import db from 'kempo/server/db/index.js';
import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import { sql } from 'drizzle-orm';

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [, session] = await getSession({ token });
  const [, canReadPrivate] = await currentUserHasPermission(token, 'posts:read');
  const includePrivate = !!canReadPrivate || !!session?.user?.id;

  try {
    const statuses = ['draft', 'published', 'disabled'];
    const counts = {};

    for(const status of statuses){
      let query = sql`SELECT COUNT(*) as total FROM "kempoBlogPost" WHERE status = ${status}`;
      if(!includePrivate){
        query = sql`SELECT COUNT(*) as total FROM "kempoBlogPost" WHERE status = ${status} AND "public" = true`;
      }

      const result = await db.execute(query);
      counts[status] = result[0]?.total || 0;
    }

    response.json(counts);
  } catch(e) {
    console.error('Counts error:', e);
    response.status(500).json({ error: 'Failed to retrieve post counts' });
  }
};
