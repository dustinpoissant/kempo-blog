import { join } from 'path';
import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import getPosts from '../../../server/utils/posts/getPosts.js';
import getPost from '../../../server/utils/posts/getPost.js';

const ROOT_DIR = join(process.cwd(), 'public');

export default async (request, response) => {
  const token = request.cookies.session_token;
  const { path, limit, offset, status, author, category, tag } = request.query;

  if(path){
    const [, session] = await getSession({ token });
    const userId = session?.user?.id;
    const [, canReadPrivate] = await currentUserHasPermission(token, 'kempo-blog:posts:read');

    const [error, post] = await getPost(path, { rootDir: ROOT_DIR, includeContent: true });
    if(error) return response.status(error.code).json({ error: error.msg });

    if(post.status === 'draft' && post.author !== userId && !canReadPrivate){
      return response.status(403).json({ error: 'Insufficient permissions' });
    }
    if(!post.public && !canReadPrivate && post.author !== userId){
      return response.status(403).json({ error: 'This post is private' });
    }

    return response.json({ post });
  }

  const [, session] = await getSession({ token });
  const userId = session?.user?.id;
  const [, canReadPrivate] = await currentUserHasPermission(token, 'kempo-blog:posts:read');

  const resolvedStatus = status || 'published';
  const includePrivate = !!canReadPrivate || (userId && author === userId);

  const [error, data] = await getPosts({
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0,
    status: resolvedStatus,
    author,
    category,
    tag,
    includePrivate: !!includePrivate,
  });

  if(error) return response.status(error.code).json({ error: error.msg });

  response.json(data);
};
