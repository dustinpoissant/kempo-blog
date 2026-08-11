import db from 'kempo/server/db/index.js';
import { kempoBlogPost } from '../../db/schema.js';
import { eq, and, count } from 'drizzle-orm';

export default async ({ includePrivate = false } = {}) => {
  try {
    const statuses = ['draft', 'published', 'disabled'];
    const counts = {};

    for(const status of statuses){
      const conditions = [eq(kempoBlogPost.status, status)];
      if(!includePrivate) conditions.push(eq(kempoBlogPost.public, true));
      const where = and(...conditions);

      const [{ total }] = await db
        .select({ total: count() })
        .from(kempoBlogPost)
        .where(where);

      counts[status] = total;
    }

    return [null, counts];
  } catch {
    return [{ code: 500, msg: 'Failed to retrieve post counts' }, null];
  }
};
