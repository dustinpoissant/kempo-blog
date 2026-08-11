import { join } from 'path';
import { getSession, currentUserHasPermission, getPage } from 'kempo/server/sdk.js';
import getPosts from '../../../server/utils/posts/getPosts.js';
import getPost, { getPostByPostId } from '../../../server/utils/posts/getPost.js';

const ROOT_DIR = join(process.cwd(), 'public');

const enrichPostName = async post => {
  const [, page] = await getPage({ rootDir: ROOT_DIR, file: post.path });
  if(page) post.name = page.title || page.name || '';
  return post;
};

export default async (request, response) => {
  const token = request.cookies.session_token;
  const { path, postId, limit, offset, status, author, category, tag, createdAfter, createdBefore } = request.query;

  if(postId){
    const [, session] = await getSession({ token });
    const userId = session?.user?.id;
    const [, canReadPrivate] = await currentUserHasPermission(token, 'posts:read');
    const [error, post] = await getPostByPostId(postId, { rootDir: ROOT_DIR, includeContent: true });
    if(error) return response.status(error.code).json({ error: error.msg });
    if(post.status === 'draft' && post.author !== userId && !canReadPrivate){
      return response.status(403).json({ error: 'Insufficient permissions' });
    }
    if(!post.public && !canReadPrivate && post.author !== userId){
      return response.status(403).json({ error: 'This post is private' });
    }
    return response.json({ post: await enrichPostName(post) });
  }

  if(path){
    const [, session] = await getSession({ token });
    const userId = session?.user?.id;
    const [, canReadPrivate] = await currentUserHasPermission(token, 'posts:read');

    const [error, post] = await getPost(path, { rootDir: ROOT_DIR, includeContent: true });
    if(error) return response.status(error.code).json({ error: error.msg });

    if(post.status === 'draft' && post.author !== userId && !canReadPrivate){
      return response.status(403).json({ error: 'Insufficient permissions' });
    }
    if(!post.public && !canReadPrivate && post.author !== userId){
      return response.status(403).json({ error: 'This post is private' });
    }

    return response.json({ post: await enrichPostName(post) });
  }

  const [, session] = await getSession({ token });
  const userId = session?.user?.id;
  const [, canReadPrivate] = await currentUserHasPermission(token, 'posts:read');

  const resolvedStatus = status || (canReadPrivate ? undefined : 'published');
  const includePrivate = !!canReadPrivate || (userId && author === userId);

  const [error, data] = await getPosts({
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0,
    status: resolvedStatus,
    author,
    category,
    tag,
    createdAfter,
    createdBefore,
    includePrivate: !!includePrivate,
  });

  if(error) return response.status(error.code).json({ error: error.msg });

  await Promise.all(data.posts.map(enrichPostName));

  response.json(data);
};
