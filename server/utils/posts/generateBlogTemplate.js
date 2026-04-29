import { getTemplate, createTemplate, updateTemplate } from 'kempo/server/sdk.js';

const BLOG_TEMPLATE_BODY = `  <article>
    <header class="mb">
      <h1>{{title}}</h1>
      <div class="d-f g-sm tc-muted small">
        <span>By <k-blog-post-author author="{{author}}"></k-blog-post-author></span>
        <span>&bull;</span>
        <k-timestamp>{{created}}</k-timestamp>
      </div>
      <k-blog-post-tags tags="{{tags}}"></k-blog-post-tags>
    </header>
    <script type="module" src="/blog/posts/components/PostAuthor.js"></script>
    <script type="module" src="/blog/posts/components/PostTags.js"></script>
    <script type="module" src="/blog/posts/components/PostComments.js"></script>
    <script type="module" src="/blog/posts/components/AddPostComment.js"></script>
    <location />
    <section class="mt">
      <k-blog-post-comments></k-blog-post-comments>
    </section>
  </article>`;

export default async ({ rootDir }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];

  const [tmplError, defaultTemplate] = await getTemplate({ rootDir, file: 'default.template.html' });
  if(tmplError) return [tmplError, null];

  const blogMarkup = defaultTemplate.markup.replace(/<location\s*\/>/, BLOG_TEMPLATE_BODY);
  if(blogMarkup === defaultTemplate.markup){
    return [{ code: 400, msg: 'Default template does not have a <location /> placeholder to replace' }, null];
  }

  const blogTemplateFile = 'blog/blog-post.template.html';

  const [, existing] = await getTemplate({ rootDir, file: blogTemplateFile });
  if(existing){
    const [updateError] = await updateTemplate({ rootDir, file: blogTemplateFile, markup: blogMarkup });
    if(updateError) return [updateError, null];
    return [null, { file: blogTemplateFile }];
  }

  const [createError] = await createTemplate({ rootDir, directory: 'blog', name: 'blog-post', locked: true });
  if(createError) return [createError, null];

  const [updateError] = await updateTemplate({ rootDir, file: blogTemplateFile, markup: blogMarkup });
  if(updateError) return [updateError, null];

  return [null, { file: blogTemplateFile }];
};
