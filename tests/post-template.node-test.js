import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
  Static checks tying the blog-post template together with the posts that ask for it.

  Every one of these guards a failure that produces no error at all. A template a page cannot find
  is not reported: kempo-server falls back to default.template.html, so posts keep rendering and
  simply lose their header, byline, tags and comments — which is exactly what shipped, because
  the generator wrote `blog/blog-post.template.html` while every post asked for `post/blog-post`.

  The same silence applies to the fragments: a <fragment> naming a file that does not exist renders
  its fallback (here, nothing) rather than failing.
*/

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const generator = await readFile(path.join(root, 'server/utils/posts/generateBlogTemplate.js'), 'utf8');
const createPost = await readFile(path.join(root, 'server/utils/posts/createPost.js'), 'utf8');

const templateFile = generator.match(/const blogTemplateFile = '([^']+)'/)?.[1];
const postDefault = createPost.match(/template = '([^']+)'/)?.[1];

export default {
  'the generator writes the template posts actually ask for': ({ pass, fail }) => {
    if(!templateFile) return fail('could not read blogTemplateFile out of generateBlogTemplate.js');
    if(!postDefault) return fail("could not read createPost's template default");

    // A page's `template="post/blog-post"` resolves to <root>/post/blog-post.template.html
    const expected = `${postDefault}.template.html`;
    if(templateFile !== expected){
      return fail(`generator writes "${templateFile}" but posts request "${postDefault}", which resolves to "${expected}" — posts would silently fall back to default.template.html`);
    }
    pass();
  },

  'createTemplate is called with a directory matching that path': ({ pass, fail }) => {
    const directory = generator.match(/createTemplate\(\{[^}]*directory:\s*'([^']+)'/)?.[1];
    if(!directory) return fail('could not read the createTemplate directory argument');
    const expected = path.posix.dirname(templateFile);
    if(directory !== expected){
      return fail(`createTemplate creates in "${directory}" but the file is written to "${templateFile}"`);
    }
    pass();
  },

  'the generated template is owned by this extension, not the site': ({ pass, fail }) => {
    const call = generator.match(/createTemplate\(\{[^}]*\}\)/)?.[0] || '';
    if(!/owner:\s*'kempo-blog'/.test(call)){
      return fail("createTemplate must pass owner: 'kempo-blog' — without it the template is stored as owner 'custom' and is indistinguishable from one the site's own admin wrote");
    }
    pass();
  },

  'every fragment the template pulls ships in this package': async ({ pass, fail }) => {
    const names = [...generator.matchAll(/<fragment\s+name="([^"]+)"/g)].map(m => m[1]);
    if(!names.length) return fail('the template body pulls no fragments — expected the post chrome to be pulled by name');

    for(const name of names){
      const file = path.join(root, 'public', `${name}.fragment.html`);
      if(!existsSync(file)){
        return fail(`template pulls <fragment name="${name}"> but public/${name}.fragment.html does not ship — it would render as nothing, with no error`);
      }
      const markup = await readFile(file, 'utf8');
      if(!/^\s*<fragment[\s>]/.test(markup)){
        return fail(`public/${name}.fragment.html must wrap its markup in a <fragment> element`);
      }
    }
    pass();
  },

  'the template body stays thin so upgrades reach existing sites': ({ pass, fail }) => {
    const body = generator.match(/const BLOG_TEMPLATE_BODY = `([\s\S]*?)`;/)?.[1];
    if(!body) return fail('could not read BLOG_TEMPLATE_BODY');

    /*
      The body is copied into the site's own project, so anything inlined here is frozen there at
      the version that generated it. Keeping the post chrome in fragments is what lets an upgrade
      change it without regenerating anything.
    */
    if(/<k-blog-|<header|<script/.test(body)){
      return fail('post chrome is inlined in BLOG_TEMPLATE_BODY again — it belongs in a fragment, or upgrades cannot reach sites that already generated their template');
    }
    if(!/<location\s*\/>/.test(body)) return fail('BLOG_TEMPLATE_BODY must keep a <location /> for the post content');
    pass();
  },

  'update.js regenerates the template': async ({ pass, fail }) => {
    const update = await readFile(path.join(root, 'update.js'), 'utf8');
    if(!/generateBlogTemplate/.test(update)){
      return fail('update.js must regenerate the blog template — otherwise a site installed on an older version keeps its stale copy forever');
    }
    pass();
  },

  'a template:updated hook is registered and regenerates': async ({ pass, fail }) => {
    const config = JSON.parse(await readFile(path.join(root, 'kempo-config.json'), 'utf8'));
    const handler = config.hooks?.['template:updated'];
    if(!handler){
      return fail('kempo-config.json must register a template:updated hook — the generated post template is a copy of the site\'s default template, and without this it keeps stale literal markup until the extension is next upgraded');
    }

    const file = path.join(root, handler.replace(/^\.\//, ''));
    if(!existsSync(file)) return fail(`template:updated handler ${handler} does not ship`);

    const source = await readFile(file, 'utf8');
    if(!/generateBlogTemplate/.test(source)) return fail('the template:updated handler must regenerate the blog template');

    /*
      Regenerating writes a template, which fires template:updated again. Without a guard on which
      file changed that recurses.
    */
    if(!/default\.template\.html/.test(source)){
      return fail('the handler must act only on default.template.html — regenerating fires template:updated again, so an unguarded handler recurses');
    }
    pass();
  }
};
