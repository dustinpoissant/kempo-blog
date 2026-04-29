import db from 'kempo/server/db/index.js';
import { kempoBlogPost, kempoBlogTag } from '../../db/schema.js';
import { eq, and, desc, count, inArray, ilike } from 'drizzle-orm';

export default async ({ limit = 20, offset = 0, status, author, category, tag, search, includePrivate = false } = {}) => {
  try {
    const conditions = [];
    if(status) conditions.push(eq(kempoBlogPost.status, status));
    if(author) conditions.push(eq(kempoBlogPost.author, author));
    if(category) conditions.push(eq(kempoBlogPost.category, category));
    if(!includePrivate) conditions.push(eq(kempoBlogPost.public, true));

    let postPaths = null;
    if(tag){
      const tagRows = await db
        .select({ post: kempoBlogTag.post })
        .from(kempoBlogTag)
        .where(eq(kempoBlogTag.tag, tag));
      postPaths = tagRows.map(r => r.post);
      if(!postPaths.length) return [null, { posts: [], total: 0, limit, offset }];
      conditions.push(inArray(kempoBlogPost.path, postPaths));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(kempoBlogPost)
      .where(where);

    const posts = await db
      .select()
      .from(kempoBlogPost)
      .where(where)
      .orderBy(desc(kempoBlogPost.created))
      .limit(limit)
      .offset(offset);

    if(!posts.length) return [null, { posts: [], total, limit, offset }];

    const allTags = await db
      .select()
      .from(kempoBlogTag)
      .where(inArray(kempoBlogTag.post, posts.map(p => p.path)));

    const tagMap = {};
    for(const t of allTags){
      if(!tagMap[t.post]) tagMap[t.post] = [];
      tagMap[t.post].push(t.tag);
    }

    return [null, {
      posts: posts.map(p => ({ ...p, tags: tagMap[p.path] || [] })),
      total,
      limit,
      offset,
    }];
  } catch {
    return [{ code: 500, msg: 'Failed to retrieve posts' }, null];
  }
};
