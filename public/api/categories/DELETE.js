import { currentUserHasPermission } from 'kempo/server/sdk.js';
import { deleteCategory } from '../../../server/utils/categories/categories.js';

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [, isAdmin] = await currentUserHasPermission(token, 'system:admin');
  if(!isAdmin) return response.status(403).json({ error: 'Insufficient permissions' });

  const id = request.body?.id || request.query.id;
  const [error] = await deleteCategory(id);
  if(error) return response.status(error.code).json({ error: error.msg });

  response.json({ success: true });
};
