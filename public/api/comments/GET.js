import getComments from '../../../server/utils/comments/getComments.js';
import { getSession } from 'kempo/server/sdk.js';

export default async (request, response) => {
  const { post, limit, offset, approved_only } = request.query;

  if(!post){
    return response.status(400).json({ error: 'post query param is required' });
  }

  const token = request.cookies.session_token;
  const [, session] = await getSession({ token });
  const approvedOnly = approved_only === 'true' && !session?.user;

  const [error, data] = await getComments({
    post,
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0,
    approvedOnly,
  });

  if(error){
    return response.status(error.code).json({ error: error.msg });
  }

  response.json(data);
};
