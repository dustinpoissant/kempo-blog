import { getPostByPostId } from '../server/utils/posts/getPost.js';
import getSession from 'kempo/server/utils/auth/getSession.js';

export default async ({ url, cookies }) => {
  const postMatch = url.match(/^\/post\/([0-9a-f]{8})-/);
  if(postMatch){
    const [err, post] = await getPostByPostId(postMatch[1]);
    if(err || !post) return;
    if(post.status !== 'draft') return;
    const [, session] = await getSession({ token: cookies.session_token });
    if(session?.user?.id === post.author) return;
    throw { code: 404 };
  }

  const authorPrivateMatch = url.match(/^\/blog\/author\/([0-9a-f]{32})\/(drafts|disabled)/);
  if(authorPrivateMatch){
    const [, session] = await getSession({ token: cookies.session_token });
    if(session?.user?.id === authorPrivateMatch[1]) return;
    throw { code: 404 };
  }
};
