import db from 'kempo/server/db/index.js';
import { blogComment } from '../../db/schema.js';
import { eq, isNull, and, desc, count, inArray } from 'drizzle-orm';

export default async ({ post, limit = 20, offset = 0, approvedOnly = false }) => {
  if(!post){
    return [{ code: 400, msg: 'post is required' }, null];
  }

  try {
    const statusFilter = approvedOnly
      ? and(eq(blogComment.post, post), isNull(blogComment.parent), eq(blogComment.status, 'approved'))
      : and(eq(blogComment.post, post), isNull(blogComment.parent));

    const [{ total }] = await db
      .select({ total: count() })
      .from(blogComment)
      .where(statusFilter);

    const topLevel = await db
      .select()
      .from(blogComment)
      .where(statusFilter)
      .orderBy(desc(blogComment.created))
      .limit(limit)
      .offset(offset);

    const replies = topLevel.length
      ? await db
          .select()
          .from(blogComment)
          .where(
            and(
              eq(blogComment.post, post),
              inArray(blogComment.parent, topLevel.map(c => c.id)),
              ...(approvedOnly ? [eq(blogComment.status, 'approved')] : [])
            )
          )
          .orderBy(desc(blogComment.created))
      : [];

    const replyMap = {};
    for(const r of replies){
      if(!replyMap[r.parent]) replyMap[r.parent] = [];
      replyMap[r.parent].push(r);
    }

    const comments = topLevel.map(c => ({ ...c, replies: replyMap[c.id] || [] }));

    return [null, { comments, total, limit, offset }];
  } catch {
    return [{ code: 500, msg: 'Failed to retrieve comments' }, null];
  }
};
