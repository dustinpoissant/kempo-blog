import { getTemplate, createTemplate, updateTemplate } from 'kempo/server/sdk.js';

/*
  Writes the site's blog-post template.

  It extends the site's own default template rather than copying it. That is the whole point of this
  file being three lines of markup: a post needs an <article> wrapper the default template does not
  have, and the only way to get one used to be to read default.template.html, substitute its
  <location />, and write the result out as a second template.

  That copy was a snapshot, and it drifted. Not visibly — <fragment> and <location> tags were copied
  verbatim and resolve per render, so the nav and anything an extension pushed stayed live; only
  literal markup the site owner edited by hand froze. And it could not be fixed by regenerating on
  change, because a developer editing default.template.html in an editor triggers nothing at all.
  Extending composes the two on every render, so there is no snapshot to go stale.

  The article chrome ships in this package as public/blog-post-{header,comments}.fragment.html and
  is pulled by name, so changing it is a release of this extension and nothing else. A site that
  wants its own version defines a fragment of the same name, which wins.

  This file is now the same for every site, so it no longer has to be derived from anything — but it
  is still generated rather than shipped, because a template has to live in the site's own tree for
  a page's `template="post/blog-post"` to resolve to it.
*/
const BLOG_TEMPLATE = `<template extends="default">
  <content>
    <article>
      <fragment name="blog-post-header" />
      <location />
      <fragment name="blog-post-comments" />
    </article>
  </content>
</template>`;

export default async ({ rootDir }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];

  /*
    Must stay in step with createPost's `template` default (`post/blog-post`). A page's template is
    resolved by walking up from the page's own directory, so `post/blog-post` reached from a post in
    public/post/ means public/post/blog-post.template.html.
  */
  const blogTemplateFile = 'post/blog-post.template.html';

  const [, existing] = await getTemplate({ rootDir, file: blogTemplateFile });
  if(existing){
    const [updateError] = await updateTemplate({ rootDir, file: blogTemplateFile, markup: BLOG_TEMPLATE });
    if(updateError) return [updateError, null];
    return [null, { file: blogTemplateFile }];
  }

  /*
    `owner` marks the template as belonging to this extension rather than the site. Without it the
    file is stored as owner 'custom', i.e. indistinguishable from something the site's own admin
    wrote — which is what decides whether the admin UI lets it be edited or deleted out from under
    the extension that regenerates it.
  */
  const [createError] = await createTemplate({ rootDir, directory: 'post', name: 'blog-post', owner: 'kempo-blog', locked: true });
  if(createError) return [createError, null];

  const [updateError] = await updateTemplate({ rootDir, file: blogTemplateFile, markup: BLOG_TEMPLATE });
  if(updateError) return [updateError, null];

  return [null, { file: blogTemplateFile }];
};
