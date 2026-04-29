import { deletePage } from 'kempo/server/sdk.js';
import db from 'kempo/server/db/index.js';
import { kempoBlogPost, kempoBlogTag, blogComment } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async ({ rootDir, path }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];
  if(!path) return [{ code: 400, msg: 'Post path is required' }, null];

  const disabledFile = path.replace(/\.page\.html$/, '.page-disabled.html');

  const [error] = await deletePage({ rootDir, files: [disabledFile] });
  if(error) return [error, null];

  const dbPath = path.endsWith('.page-disabled.html')
    ? path.replace(/\.page-disabled\.html$/, '.page.html')
    : path;

  await db.delete(kempoBlogTag).where(eq(kempoBlogTag.post, dbPath));
  await db.delete(blogComment).where(eq(blogComment.post, dbPath));
  await db.delete(kempoBlogPost).where(eq(kempoBlogPost.path, dbPath));

  return [null, { success: true }];
};
