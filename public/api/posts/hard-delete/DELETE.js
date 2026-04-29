import { join } from 'path';
import { currentUserHasPermission } from 'kempo/server/sdk.js';
import hardDeletePost from '../../../../server/utils/posts/hardDeletePost.js';

const ROOT_DIR = join(process.cwd(), 'public');

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [, canHardDelete] = await currentUserHasPermission(token, 'kempo-blog:posts:delete');
  if(!canHardDelete) return response.status(403).json({ error: 'Insufficient permissions' });

  const path = request.body?.path || request.query.path;
  if(!path) return response.status(400).json({ error: 'Post path is required' });

  const [error, result] = await hardDeletePost({ rootDir: ROOT_DIR, path });
  if(error) return response.status(error.code).json({ error: error.msg });

  response.json(result);
};
