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

  'the template extends the site default and inlines nothing': ({ pass, fail }) => {
    const body = generator.match(/const BLOG_TEMPLATE = `([\s\S]*?)`;/)?.[1];
    if(!body) return fail('could not read BLOG_TEMPLATE');

    /*
      Two separate staleness traps, both closed here.

      Extending rather than copying: a copy of the site's default template is a snapshot, and it
      drifts the moment the site edits its own template — including by editing the file directly in
      an editor, which fires no event, so no amount of regenerating-on-change would catch it.

      Chrome in fragments rather than inlined: this string is written into the site's project, so
      anything inlined here is frozen at the version that wrote it. Fragments are read from this
      package per render, so changing them is a release and nothing else.
    */
    if(!/<template\s+extends="default"/.test(body)){
      return fail('the template must extend the site default rather than copying it — a copy drifts the moment the site edits its own template, including by editing the file directly, which fires no event at all');
    }
    if(/<k-blog-|<header|<script/.test(body)){
      return fail('post chrome is inlined in BLOG_TEMPLATE again — it belongs in a fragment, or upgrades cannot reach sites that already generated their template');
    }
    if(!/<location\s*\/>/.test(body)) return fail('BLOG_TEMPLATE must keep a <location /> for the post content');
    pass();
  },

  'update.js rewrites the template': async ({ pass, fail }) => {
    const update = await readFile(path.join(root, 'update.js'), 'utf8');
    if(!/generateBlogTemplate/.test(update)){
      return fail('update.js must rewrite the blog template — it is what moves a site off the copied template it generated under an older version onto one that extends the site default');
    }
    pass();
  }
};
