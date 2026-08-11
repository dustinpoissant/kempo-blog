import db from 'kempo/server/db/index.js';
import { user } from 'kempo/server/db/schema.js';
import { kempoBlogPost } from '../../db/schema.js';
import { ilike, inArray, eq, and } from 'drizzle-orm';

export default async ({ q = '', limit = 20 } = {}) => {
  try {
    const authorRows = await db
      .selectDistinct({ author: kempoBlogPost.author })
      .from(kempoBlogPost)
      .where(eq(kempoBlogPost.status, 'published'));

    const authorIds = authorRows.map(r => r.author);
    if(!authorIds.length) return [null, { authors: [] }];

    const where = q
      ? and(inArray(user.id, authorIds), ilike(user.name, `%${q}%`))
      : inArray(user.id, authorIds);

    const authors = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(where)
      .limit(limit);

    return [null, { authors }];
  } catch(err){
    return [{ code: 500, msg: 'Failed to search authors' }, null];
  }
};
