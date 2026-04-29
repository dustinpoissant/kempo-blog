import db from 'kempo/server/db/index.js';
import { kempoBlogPost, kempoBlogTag } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getPage } from 'kempo/server/sdk.js';

export default async (path, { rootDir, includeContent = false } = {}) => {
  if(!path) return [{ code: 400, msg: 'Post path is required' }, null];

  try {
    const [post] = await db
      .select()
      .from(kempoBlogPost)
      .where(eq(kempoBlogPost.path, path))
      .limit(1);

    if(!post) return [{ code: 404, msg: 'Post not found' }, null];

    const tags = await db
      .select()
      .from(kempoBlogTag)
      .where(eq(kempoBlogTag.post, path));

    const result = { ...post, tags: tags.map(t => t.tag) };

    if(includeContent && rootDir){
      const [pageError, page] = await getPage({ rootDir, file: path });
      if(!pageError) result.contents = page.contents;
    }

    return [null, result];
  } catch {
    return [{ code: 500, msg: 'Failed to retrieve post' }, null];
  }
};
