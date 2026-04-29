import db from 'kempo/server/db/index.js';
import { blogComment } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async (id) => {
  if(!id){
    return [{ code: 400, msg: 'Comment ID is required' }, null];
  }

  try {
    const [result] = await db
      .select()
      .from(blogComment)
      .where(eq(blogComment.id, id))
      .limit(1);

    if(!result){
      return [{ code: 404, msg: 'Comment not found' }, null];
    }

    return [null, result];
  } catch {
    return [{ code: 500, msg: 'Failed to retrieve comment' }, null];
  }
};
