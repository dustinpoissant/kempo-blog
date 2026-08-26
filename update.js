import { join } from 'path';
import generateBlogTemplate from './server/utils/posts/generateBlogTemplate.js';

export default async ({ oldVersion, newVersion, oldKempo, newKempo }) => {
  // Column-level schema migrations go here as needed between versions

  /*
    Rewrite the site's blog-post template.

    Older versions generated a real template by copying default.template.html and substituting its
    <location />. That copy was a snapshot of the site's chrome and drifted from it silently. It is
    now a *.template-patch.html, which kempo-server applies to the site's live default template on
    every render, so there is no copy left to go stale.

    This is what moves an already-installed site across: it writes the patch, removes the template
    the older version generated (which would otherwise keep winning, since a real template takes
    precedence over a patch of the same name), and adds id="main" to the site's default template if
    it predates that attribute.
  */
  const [error, result] = await generateBlogTemplate({ rootDir: join(process.cwd(), 'public') });

  if(error){
    // Never fail the upgrade over this
    console.warn(`[kempo-blog] Could not write the blog post template patch: ${error.msg}`);
    return;
  }

  console.log('[kempo-blog] Blog post template is now a patch on the site default.');
  if(result?.warning) console.warn(`[kempo-blog] ${result.warning}`);
};
