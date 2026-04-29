import { join } from 'path';
import { getSession, currentUserHasPermission, getSetting } from 'kempo/server/sdk.js';
import createPost from '../../../server/utils/posts/createPost.js';

const ROOT_DIR = join(process.cwd(), 'public');

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [sessionError, session] = await getSession({ token });
  if(sessionError) return response.status(401).json({ error: 'Authentication required' });

  const [, canCreate] = await currentUserHasPermission(token, 'kempo-blog:posts:create');
  if(!canCreate) return response.status(403).json({ error: 'Insufficient permissions' });

  const { name, content, abstract, tags, isPublic, status, category, commentsEnabled, approvedCommentsOnly } = request.body;

  const [, globalCommentsEnabled] = await getSetting('kempo-blog', 'comments_enabled', true);

  const [error, post] = await createPost({
    rootDir: ROOT_DIR,
    name,
    authorId: session.user.id,
    author: session.user.name,
    category: category || null,
    isPublic: isPublic !== false,
    status: status || 'draft',
    content: content || '',
    abstract: abstract || '',
    tags: tags || [],
    commentsEnabled: commentsEnabled !== false && globalCommentsEnabled,
    approvedCommentsOnly: approvedCommentsOnly || false,
  });

  if(error) return response.status(error.code).json({ error: error.msg });

  response.status(201).json({ post });
};
