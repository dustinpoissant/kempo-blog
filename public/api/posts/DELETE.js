import { join } from 'path';
import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import getPost from '../../../server/utils/posts/getPost.js';
import softDeletePost from '../../../server/utils/posts/softDeletePost.js';

const ROOT_DIR = join(process.cwd(), 'public');

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [sessionError, session] = await getSession({ token });
  if(sessionError) return response.status(401).json({ error: 'Authentication required' });

  const path = request.body?.path || request.query.path;
  if(!path) return response.status(400).json({ error: 'Post path is required' });

  const [fetchError, existing] = await getPost(path);
  if(fetchError) return response.status(fetchError.code).json({ error: fetchError.msg });

  const isOwner = existing.author === session.user.id;
  const [, canDeleteOwn] = await currentUserHasPermission(token, 'posts:own:delete');
  const [, canDeleteOthers] = await currentUserHasPermission(token, 'posts:others:delete');

  if(!((isOwner && canDeleteOwn) || canDeleteOthers)){
    return response.status(403).json({ error: 'Insufficient permissions' });
  }

  const [error, result] = await softDeletePost({ rootDir: ROOT_DIR, path });
  if(error) return response.status(error.code).json({ error: error.msg });

  response.json(result);
};
