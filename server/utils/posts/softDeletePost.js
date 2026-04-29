import { join } from 'path';
import { disablePage } from 'kempo/server/sdk.js';
import db from 'kempo/server/db/index.js';
import { kempoBlogPost } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async ({ rootDir, path }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];
  if(!path) return [{ code: 400, msg: 'Post path is required' }, null];

  const [error, result] = await disablePage({ rootDir, file: path });
  if(error) return [error, null];

  await db.update(kempoBlogPost).set({ status: 'disabled' }).where(eq(kempoBlogPost.path, path));

  return [null, result];
};
