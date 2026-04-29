import { join } from 'path';
import { currentUserHasPermission } from 'kempo/server/sdk.js';
import generateBlogTemplate from '../../../server/utils/posts/generateBlogTemplate.js';

const ROOT_DIR = join(process.cwd(), 'public');

export default async (request, response) => {
  const token = request.cookies.session_token;
  const [, isAdmin] = await currentUserHasPermission(token, 'system:admin');
  if(!isAdmin) return response.status(403).json({ error: 'Insufficient permissions' });

  const [error, result] = await generateBlogTemplate({ rootDir: ROOT_DIR });
  if(error) return response.status(error.code).json({ error: error.msg });

  response.json(result);
};
