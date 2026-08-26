import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
  Static checks tying the blog-post template patch to the posts that ask for it, and to the template
  it patches.

  Every one of these guards a failure that produces no error where it is written. A page whose
  template cannot be found does not fail: kempo-server falls back to default.template.html, so posts
  keep rendering and simply lose their header, byline, tags and comments — which is exactly what
  shipped once, because the generator wrote blog/blog-post.template.html while every post asked for
  post/blog-post. A <fragment> naming a file that does not ship renders its fallback rather than
  complaining. And a patch operation whose id is missing is skipped, not thrown, so that a template
  changing under an extension cannot take a site down — which means nothing here fails loudly at all.
*/

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const generator = await readFile(path.join(root, 'server/utils/posts/generateBlogTemplate.js'), 'utf8');
const createPost = await readFile(path.join(root, 'server/utils/posts/createPost.js'), 'utf8');

const patchFile = generator.match(/const PATCH_FILE = '([^']+)'/)?.[1];
const patchBody = generator.match(/const BLOG_PATCH = `([\s\S]*?)`;/)?.[1];
const postDefault = createPost.match(/template = '([^']+)'/)?.[1];

export default {
  'the generator writes the file posts actually ask for': ({ pass, fail }) => {
    if(!patchFile) return fail('could not read PATCH_FILE out of generateBlogTemplate.js');
    if(!postDefault) return fail("could not read createPost's template default");

    // A page's `template="post/blog-post"` resolves to post/blog-post.template.html, then
    // post/blog-post.template-patch.html
    const expected = `${postDefault}.template-patch.html`;
    if(patchFile !== expected){
      return fail(`generator writes "${patchFile}" but posts request "${postDefault}", which resolves to "${expected}" — posts would silently fall back to default.template.html`);
    }
    pass();
  },

  'the patch is a patch, not a template': ({ pass, fail }) => {
    if(!patchBody) return fail('could not read BLOG_PATCH');
    if(!/^\s*<!--[\s\S]*?\bextends:\s*default\b[\s\S]*?-->/.test(patchBody)){
      return fail('the patch must declare `extends: default` in its frontmatter — without it kempo-server cannot know what it patches');
    }
    if(/<!DOCTYPE|<html\b/i.test(patchBody)){
      return fail('this is a whole document again — it must describe changes to the site default, not copy it, or it becomes a snapshot that drifts the moment the site edits its own template');
    }
    pass();
  },

  'the patch replaces the template\'s main element by id': ({ pass, fail }) => {
    const replace = patchBody.match(/<replace\s+id="([^"]+)"/);
    if(!replace) return fail('the patch must <replace id="..."> the page body wrapper');
    if(replace[1] !== 'main'){
      return fail(`the patch targets id="${replace[1]}" but kempo's default template marks its page body wrapper id="main"`);
    }
    if(!/<location\s*\/>/.test(patchBody)) return fail('the replacement must keep a <location /> for the post content');
    pass();
  },

  'the post chrome is pulled from fragments, not inlined': ({ pass, fail }) => {
    if(/<k-blog-|<header|<script/.test(patchBody)){
      return fail('post chrome is inlined in the patch again — it belongs in a fragment, or changing it needs the patch regenerated on every site instead of just releasing this package');
    }
    const names = [...patchBody.matchAll(/<fragment\s+name="([^"]+)"/g)].map(m => m[1]);
    if(!names.length) return fail('the patch pulls no fragments — expected the post chrome to be pulled by name');
    pass();
  },

  'every fragment the patch pulls ships in this package': async ({ pass, fail }) => {
    const names = [...patchBody.matchAll(/<fragment\s+name="([^"]+)"/g)].map(m => m[1]);
    for(const name of names){
      const file = path.join(root, 'public', `${name}.fragment.html`);
      if(!existsSync(file)){
        return fail(`the patch pulls <fragment name="${name}"> but public/${name}.fragment.html does not ship — it would render as nothing, with no error`);
      }
      const markup = await readFile(file, 'utf8');
      if(!/^\s*<fragment[\s>]/.test(markup)){
        return fail(`public/${name}.fragment.html must wrap its markup in a <fragment> element`);
      }
    }
    pass();
  },

  'the templates older versions generated are cleaned up': ({ pass, fail }) => {
    const legacy = generator.match(/const LEGACY_TEMPLATE_FILES = \[([^\]]*)\]/)?.[1];
    if(!legacy) return fail('could not read LEGACY_TEMPLATE_FILES');
    /*
      A real template wins over a patch of the same name, so a leftover post/blog-post.template.html
      would keep being used and the patch would silently never apply.
    */
    if(!legacy.includes('post/blog-post.template.html')){
      return fail('post/blog-post.template.html must be removed — it takes precedence over the patch and would keep winning');
    }
    pass();
  },

  'the site default template is given the id the patch targets': ({ pass, fail }) => {
    if(!/ensureMainId/.test(generator)){
      return fail('nothing adds id="main" to a site default template that predates it — the patch would find nothing to replace, and kempo-server skips a missing id rather than erroring, so posts would quietly render without their article wrapper, header and comments');
    }
    if(!/id="main"/.test(generator)) return fail('the id being added does not match what the patch targets');
    pass();
  },

  'update.js rewrites the template': async ({ pass, fail }) => {
    const update = await readFile(path.join(root, 'update.js'), 'utf8');
    if(!/generateBlogTemplate/.test(update)){
      return fail('update.js must rewrite the blog template — it is what moves a site off the copied template an older version generated');
    }
    pass();
  }
};
