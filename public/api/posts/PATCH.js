import { join } from 'path';
import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import getPost from '../../../server/utils/posts/getPost.js';
import updatePost from '../../../server/utils/posts/updatePost.js';

const ROOT_DIR = join(process.cwd(), 'public');

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [sessionError, session] = await getSession({ token });
  if(sessionError) return response.status(401).json({ error: 'Authentication required' });

  const { path, name, content, abstract, tags, isPublic, status, category, commentsEnabled, approvedCommentsOnly } = request.body;
  if(!path) return response.status(400).json({ error: 'Post path is required' });

  const [fetchError, existing] = await getPost(path);
  if(fetchError) return response.status(fetchError.code).json({ error: fetchError.msg });

  const isOwner = existing.author === session.user.id;
  const [, canEditOwn] = await currentUserHasPermission(token, 'kempo-blog:posts:own:update');
  const [, canEditOthers] = await currentUserHasPermission(token, 'kempo-blog:posts:others:update');

  if(!((isOwner && canEditOwn) || canEditOthers)){
    return response.status(403).json({ error: 'Insufficient permissions' });
  }

  const [error, result] = await updatePost({
    rootDir: ROOT_DIR,
    path,
    name,
    content,
    abstract,
    tags,
    isPublic,
    status,
    category,
    commentsEnabled,
    approvedCommentsOnly,
  });

  if(error) return response.status(error.code).json({ error: error.msg });

  response.json(result);
};
