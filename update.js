import { join } from 'path';
import generateBlogTemplate from './server/utils/posts/generateBlogTemplate.js';

export default async ({ oldVersion, newVersion, oldKempo, newKempo }) => {
  // Column-level schema migrations go here as needed between versions

  /*
    Rewrite the site's blog-post template on every upgrade.

    The template is generated into the site's own project, so anything inlined into it is frozen at
    the version that generated it — nothing here re-ran it before, which is why the post markup
    could never be fixed for a site once installed. The body is now thin (it pulls this package's
    fragments by name), so this regeneration is what moves an existing site onto that indirection;
    after this runs once, changes to the post chrome no longer need an upgrade at all.

    It also re-derives the template from the site's *current* default.template.html, so a site that
    has since changed its own header, nav or footer gets those picked up here too.

    Safe to repeat: generateBlogTemplate updates in place when the template already exists, and the
    file is extension-owned and locked, so it holds no edits of the site's own to lose.
  */
  const [templateError] = await generateBlogTemplate({ rootDir: join(process.cwd(), 'public') });
  if(templateError){
    /*
      Never fail the upgrade over this. A site whose default template has no <location /> to build
      from keeps the template it already had, which still renders — the extension is just left on
      the older inlined copy until that is fixed.
    */
    console.warn(`[kempo-blog] Could not regenerate the blog template: ${templateError.msg}`);
  } else {
    console.log('[kempo-blog] Blog template regenerated.');
  }
};
