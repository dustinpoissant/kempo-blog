const BASE = '/blog/api';

const req = async (method, path, data) => {
  const opts = { method, headers: {} };
  if(data && method !== 'GET'){
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }
  try {
    const res = await fetch(path, opts);
    const json = await res.json().catch(() => ({}));
    if(!res.ok) return [{ code: res.status, msg: json.error || 'An error occurred' }, null];
    return [null, json];
  } catch {
    return [{ code: 503, msg: 'Network error' }, null];
  }
};

const buildQuery = params => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if(!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
};

/*
  Posts
*/

export const getPosts = (params = {}) =>
  req('GET', `${BASE}/posts${buildQuery(params)}`);

export const getPostsCounts = () =>
  req('GET', `${BASE}/posts/counts`);

export const getPost = path =>
  req('GET', `${BASE}/posts${buildQuery({ path })}`);

export const getPostById = postId =>
  req('GET', `${BASE}/posts${buildQuery({ postId })}`);

export const createPost = data =>
  req('POST', `${BASE}/posts`, data);

export const updatePost = data =>
  req('PATCH', `${BASE}/posts`, data);

export const softDeletePost = path =>
  req('DELETE', `${BASE}/posts`, { path });

export const hardDeletePost = path =>
  req('DELETE', `${BASE}/posts/hard-delete`, { path });

/*
  Categories
*/

export const getCategories = () =>
  req('GET', `${BASE}/categories`);

export const createCategory = data =>
  req('POST', `${BASE}/categories`, data);

export const updateCategory = data =>
  req('PATCH', `${BASE}/categories`, data);

export const deleteCategory = id =>
  req('DELETE', `${BASE}/categories`, { id });

/*
  Comments
*/

export const getComments = (params = {}) =>
  req('GET', `${BASE}/comments${buildQuery(params)}`);

export const createComment = data =>
  req('POST', `${BASE}/comments`, data);

export const updateComment = data =>
  req('PATCH', `${BASE}/comments`, data);

export const deleteComment = id =>
  req('DELETE', `${BASE}/comments`, { id });

/*
  Template
*/

export const regenerateTemplate = () =>
  req('POST', `${BASE}/template`, {});
