import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import getComment from '../../../server/utils/comments/getComment.js';
import deleteComment from '../../../server/utils/comments/deleteComment.js';
import getPost from '../../../server/utils/posts/getPost.js';

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [sessionError, sessionData] = await getSession({ token });

  if(sessionError){
    return response.status(401).json({ error: 'Authentication required' });
  }

  const id = request.body?.id || request.query.id;

  if(!id){
    return response.status(400).json({ error: 'Comment ID is required' });
  }

  const [fetchError, existing] = await getComment(id);
  if(fetchError){
    return response.status(fetchError.code).json({ error: fetchError.msg });
  }

  const isOwner = existing.userid === sessionData.user.id;
  if(isOwner){
    const [, canOwnDelete] = await currentUserHasPermission(token, 'comments:own:delete');
    if(!canOwnDelete){
      return response.status(403).json({ error: 'You do not have permission to delete this comment' });
    }
  } else {
    const [postErr, post] = await getPost(existing.post);
    const isPostAuthor = !postErr && post?.author === sessionData.user.id;
    if(isPostAuthor){
      const [, canPostAuthorDelete] = await currentUserHasPermission(token, 'comments:post_author:delete');
      if(!canPostAuthorDelete){
        return response.status(403).json({ error: 'You do not have permission to delete this comment' });
      }
    } else {
      const [, canOthersDelete] = await currentUserHasPermission(token, 'comments:others:delete');
      if(!canOthersDelete){
        return response.status(403).json({ error: 'You do not have permission to delete this comment' });
      }
    }
  }

  const [error] = await deleteComment(id);
  if(error){
    return response.status(error.code).json({ error: error.msg });
  }

  response.json({ success: true });
};
