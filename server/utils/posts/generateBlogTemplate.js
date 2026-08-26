import { getTemplate, createTemplate, updateTemplate } from 'kempo/server/sdk.js';

/*
  The article chrome itself lives in this package as public/blog-post-{header,comments}.fragment.html
  and is pulled in by name, rather than being written into the site's own template file.

  It used to be inlined here. That meant the markup was frozen into every site at the moment the
  extension was installed: kempo core reads a template from the site's project, so shipping a fix to
  the post header reached nobody until this generator happened to run again — and update.js did not
  run it. Pulling it as a fragment means kempo core reads the file out of this package on every
  render, so an upgrade takes effect immediately and there is nothing to regenerate.

  A site that wants a different post header can still have one: a fragment of the same name in the
  site's own tree wins over this package's, so overriding is a matter of adding the file.
*/
const BLOG_TEMPLATE_BODY = `  <article>
    <fragment name="blog-post-header" />
    <location />
    <fragment name="blog-post-comments" />
  </article>`;

export default async ({ rootDir }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];

  const [tmplError, defaultTemplate] = await getTemplate({ rootDir, file: 'default.template.html' });
  if(tmplError) return [tmplError, null];

  const blogMarkup = defaultTemplate.markup.replace(/<location\s*\/>/, BLOG_TEMPLATE_BODY);
  if(blogMarkup === defaultTemplate.markup){
    return [{ code: 400, msg: 'Default template does not have a <location /> placeholder to replace' }, null];
  }

  /*
    Must stay in step with createPost's `template` default (`post/blog-post`). A page's template is
    resolved by walking up from the page's own directory, so `post/blog-post` reached from a post in
    public/post/ means public/post/blog-post.template.html.

    This wrote `blog/…` until now, which no post has ever asked for: posts requested
    `post/blog-post`, did not find it, and silently fell back to default.template.html — losing the
    entire article header and comments section, with nothing logged. Sites that look correct today
    have a public/post/blog-post.template.html left over from an older version of this extension.
    A stray public/blog/blog-post.template.html from the broken path is inert and safe to delete.
  */
  const blogTemplateFile = 'post/blog-post.template.html';

  const [, existing] = await getTemplate({ rootDir, file: blogTemplateFile });
  if(existing){
    const [updateError] = await updateTemplate({ rootDir, file: blogTemplateFile, markup: blogMarkup });
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

  const [updateError] = await updateTemplate({ rootDir, file: blogTemplateFile, markup: blogMarkup });
  if(updateError) return [updateError, null];

  return [null, { file: blogTemplateFile }];
};
