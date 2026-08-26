import { join } from 'path';
import generateBlogTemplate from '../server/utils/posts/generateBlogTemplate.js';

/*
  Keeps the generated blog-post template in step with the site's own default template.

  A post needs an <article> wrapper the site's default template does not have, and kempo templates
  cannot extend one another, so the post template is built by copying default.template.html and
  substituting its <location />. That copy is the problem this hook exists for: everything in it
  that is literal markup — a footer, meta tags, wrapper elements the site owner edited by hand — is
  a snapshot taken when the copy was made, and posts kept rendering the old version of it.

  Not everything went stale, which is what made it easy to miss. The copy preserves <fragment> and
  <location> tags verbatim, and those resolve per render, so a nav fragment and anything an
  extension pushes into a location were always live on posts. Only literal markup froze.

  Regenerating here means the snapshot is retaken the moment the thing it is a snapshot of changes.

  No loop: generateBlogTemplate writes post/blog-post.template.html, which fires this event again
  with a file that is not the default template, and the second pass returns immediately.
*/
export default async ({ file }) => {
  const changed = String(file || '').replace(/^\/+/, '');
  if(changed !== 'default.template.html') return;

  const [error] = await generateBlogTemplate({ rootDir: join(process.cwd(), 'public') });

  /*
    Never throw. This is a notification-contract hook, so a throw here is recorded rather than
    surfaced, and failing would in any case be worse than leaving the previous template in place:
    the site's own template edit has already been saved, and posts still render with the copy they
    have.
  */
  if(error) console.warn(`[kempo-blog] Default template changed but the blog-post template could not be regenerated: ${error.msg}`);
};
