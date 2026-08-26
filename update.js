import { join } from 'path';
import generateBlogTemplate from './server/utils/posts/generateBlogTemplate.js';

export default async ({ oldVersion, newVersion, oldKempo, newKempo }) => {
  // Column-level schema migrations go here as needed between versions

  /*
    Rewrite the site's blog-post template.

    Older versions generated it by copying default.template.html and substituting its <location />.
    That copy was a snapshot of the site's chrome at install time and drifted from it silently
    afterwards. The template now extends the site default instead, which composes the two on every
    render — so this rewrite is what moves an already-installed site off its stale copy, and once
    done there is nothing left to keep in step.

    It also moves the post chrome onto this package's fragments, so from here on changing the post
    header or comments section is a release of this extension and needs no regeneration at all.

    Safe to repeat: the template is extension-owned and locked, and the markup written is now the
    same for every site, so this holds no edits of the site's own to lose.
  */
  const [templateError] = await generateBlogTemplate({ rootDir: join(process.cwd(), 'public') });
  if(templateError){
    // Never fail the upgrade over this — the site keeps the template it had, which still renders
    console.warn(`[kempo-blog] Could not rewrite the blog template: ${templateError.msg}`);
  } else {
    console.log('[kempo-blog] Blog template updated to extend the site default.');
  }
};
