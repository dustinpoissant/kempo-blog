import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/*
  Writes the site's blog-post template as a *.template-patch.html — a description of what a post
  changes about the site's own default template, rather than a template in its own right.

  Older versions generated a real template by reading default.template.html, substituting its
  <location />, and writing the result out. That copy was a snapshot of the site's chrome and drifted
  from it silently: not visibly, since <fragment> and <location> tags were copied verbatim and
  resolve per render, but any literal markup the site owner edited by hand stayed frozen. Nothing
  could reliably catch it either, because the most common way to edit a template is to open the file
  in an editor, which raises no event to hang an invalidation off.

  A patch has no copy in it. kempo-server applies it to the site's live default template on every
  render, so the site's chrome is always the site's current chrome.

  The article chrome ships in this package as public/blog-post-{header,comments}.fragment.html and is
  pulled by name, so changing it is a release of this extension and nothing else.

  It is written into the site's tree rather than shipped in this package because a page's
  `template="post/blog-post"` is resolved by walking up from the page's own directory.
*/
const BLOG_PATCH = `<!--
  owner: kempo-blog
  extends: default
  locked: true
-->
<replace id="main">
  <article>
    <fragment name="blog-post-header" />
    <location />
    <fragment name="blog-post-comments" />
  </article>
</replace>
`;

/*
  Must stay in step with createPost's `template` default (`post/blog-post`). A page's template is
  resolved by walking up from the page's own directory, so `post/blog-post` reached from a post in
  public/post/ means public/post/blog-post.template-patch.html.
*/
const PATCH_FILE = 'post/blog-post.template-patch.html';

// What older versions generated, and what this replaces
const LEGACY_TEMPLATE_FILES = ['post/blog-post.template.html', 'blog/blog-post.template.html'];

/*
  The patch targets `id="main"`, which kempo's default template carries. A site whose template
  predates that has a bare <main>, and the patch would find nothing to replace.

  That failure is quiet by design — kempo-server skips an operation whose id is missing rather than
  failing the page, so that core changing a template cannot take a site down. Quiet is the problem
  here: posts would render, just without their article wrapper, header, byline or comments, and the
  only evidence would be a line in a server log.

  Adding the attribute is additive and idempotent, so it is done here rather than left as a warning
  nobody reads. Anything less than unambiguous is left alone and reported instead: a template with
  several <main> elements, or none, is not ours to guess about.
*/
const ensureMainId = async rootDir => {
  const file = join(rootDir, 'default.template.html');
  if(!existsSync(file)) return 'no default.template.html to check';

  const markup = await readFile(file, 'utf-8');
  if(/<main[^>]*\bid\s*=/.test(markup)) return null; // already has one

  const bare = markup.match(/<main(\s[^>]*)?>/g) || [];
  if(bare.length !== 1){
    return `default.template.html has ${bare.length} <main> elements — add id="main" to the one wrapping <location /> by hand, or posts will render without their article wrapper, header and comments`;
  }

  await writeFile(file, markup.replace(/<main(\s[^>]*)?>/, (_, attrs) => `<main id="main"${attrs || ''}>`), 'utf-8');
  console.log('[kempo-blog] Added id="main" to default.template.html so the blog post patch can target it.');
  return null;
};

export default async ({ rootDir }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];

  const warning = await ensureMainId(rootDir);

  await mkdir(join(rootDir, 'post'), { recursive: true });
  await writeFile(join(rootDir, PATCH_FILE), BLOG_PATCH, 'utf-8');

  /*
    Remove what older versions generated. Leaving it behind is not harmless: a real template wins
    over a patch of the same name, so a stale post/blog-post.template.html would keep being used and
    this patch would silently never apply.
  */
  for(const legacy of LEGACY_TEMPLATE_FILES){
    const path = join(rootDir, legacy);
    if(!existsSync(path)) continue;
    await unlink(path).catch(() => {});
    console.log(`[kempo-blog] Removed the superseded ${legacy}.`);
  }

  return [null, { file: PATCH_FILE, warning }];
};
