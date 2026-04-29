import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import createComment from '../../../server/utils/comments/createComment.js';

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [sessionError, sessionData] = await getSession({ token });

  if(sessionError){
    return response.status(401).json({ error: 'Authentication required' });
  }

  const [, canComment] = await currentUserHasPermission(token, 'kempo-blog:comments:create');
  if(!canComment){
    return response.status(403).json({ error: 'You do not have permission to comment' });
  }

  const { post, parent, content } = request.body;
  const [error, comment] = await createComment({
    post,
    parent: parent || null,
    userid: sessionData.user.id,
    content,
  });

  if(error){
    return response.status(error.code).json({ error: error.msg });
  }

  response.json({ comment });
};
