import db from 'kempo/server/db/index.js';
import { blogComment } from '../../db/schema.js';
import crypto from 'crypto';

const sanitize = content =>
  content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();

export default async ({ post, parent = null, userid, content }) => {
  if(!post || !userid || !content){
    return [{ code: 400, msg: 'post, userid, and content are required' }, null];
  }

  const cleaned = sanitize(content);
  if(!cleaned){
    return [{ code: 400, msg: 'Comment content cannot be empty' }, null];
  }

  const now = new Date();
  try {
    const [result] = await db
      .insert(blogComment)
      .values({
        id: crypto.randomBytes(16).toString('hex'),
        post,
        parent: parent || null,
        userid,
        created: now,
        updated: now,
        content: cleaned,
        status: 'pending',
      })
      .returning();

    return [null, result];
  } catch {
    return [{ code: 500, msg: 'Failed to create comment' }, null];
  }
};
