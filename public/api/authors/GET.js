import searchAuthors from '../../../server/utils/authors/searchAuthors.js';

export default async (request, response) => {
  const { q } = request.query;
  const [error, data] = await searchAuthors({ q: q || '' });
  if(error) return response.status(error.code).json({ error: error.msg });
  response.json(data);
};
