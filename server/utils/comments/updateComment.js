import db from 'kempo/server/db/index.js';
import { blogComment } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

const sanitize = content =>
  content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();

const VALID_STATUSES = new Set(['pending', 'approved', 'blocked']);

export default async (id, { content, status }) => {
  if(!id){
    return [{ code: 400, msg: 'Comment ID is required' }, null];
  }

  const updates = { updated: new Date() };

  if(content !== undefined){
    const cleaned = sanitize(content);
    if(!cleaned){
      return [{ code: 400, msg: 'Comment content cannot be empty' }, null];
    }
    updates.content = cleaned;
  }

  if(status !== undefined){
    if(!VALID_STATUSES.has(status)){
      return [{ code: 400, msg: 'Status must be pending, approved, or blocked' }, null];
    }
    updates.status = status;
  }

  try {
    const [result] = await db
      .update(blogComment)
      .set(updates)
      .where(eq(blogComment.id, id))
      .returning();

    if(!result){
      return [{ code: 404, msg: 'Comment not found' }, null];
    }

    return [null, result];
  } catch {
    return [{ code: 500, msg: 'Failed to update comment' }, null];
  }
};
