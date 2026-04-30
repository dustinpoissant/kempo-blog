import { getSession, currentUserHasPermission } from 'kempo/server/sdk.js';
import getComment from '../../../server/utils/comments/getComment.js';
import updateComment from '../../../server/utils/comments/updateComment.js';

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [sessionError, sessionData] = await getSession({ token });

  if(sessionError){
    return response.status(401).json({ error: 'Authentication required' });
  }

  const { id, content, status } = request.body;

  if(!id){
    return response.status(400).json({ error: 'Comment ID is required' });
  }

  const [fetchError, existing] = await getComment(id);
  if(fetchError){
    return response.status(fetchError.code).json({ error: fetchError.msg });
  }

  const isOwner = existing.userid === sessionData.user.id;
  if(!isOwner){
    const [, canEdit] = await currentUserHasPermission(token, 'comments:update');
    if(!canEdit){
      return response.status(403).json({ error: 'You do not have permission to edit this comment' });
    }
  }

  const [error, updated] = await updateComment(id, { content, status });
  if(error){
    return response.status(error.code).json({ error: error.msg });
  }

  response.json({ comment: updated });
};
