import { getCategories } from '../../../server/utils/categories/categories.js';

export default async (request, response) => {
  const [error, categories] = await getCategories();
  if(error) return response.status(error.code).json({ error: error.msg });
  response.json({ categories });
};
