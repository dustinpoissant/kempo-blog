import db from 'kempo/server/db/index.js';
import { blogComment } from '../../db/schema.js';
import { eq, or } from 'drizzle-orm';

export default async (id) => {
  if(!id){
    return [{ code: 400, msg: 'Comment ID is required' }, null];
  }

  try {
    await db
      .delete(blogComment)
      .where(or(eq(blogComment.id, id), eq(blogComment.parent, id)));

    return [null, { success: true }];
  } catch {
    return [{ code: 500, msg: 'Failed to delete comment' }, null];
  }
};
