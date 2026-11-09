import { access, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/*
  The two blog widgets the page builder offers. kempo's registry code cleans each declaration (so a declaration it would
  refuse fails here and not in somebody's editor), and kempo-ui's page renderer takes a page through each widget. The
  kempo-ui modules are loaded from the installed kempo-ui, so they are the ones kempo's registry adds the widgets to.
*/

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = async file => import(pathToFileURL(file).href);
const kempo = relative => load(path.join(root, 'node_modules', 'kempo', relative));
const ui = relative => load(path.join(root, 'node_modules', 'kempo-ui', 'src', relative));

const config = JSON.parse(await readFile(path.join(root, 'kempo-config.json'), 'utf8'));
const { normalizeExtensionWidget } = await kempo('server/utils/sitebuilder/registry.js');
const { widgets, addWidget, registryOf } = await ui('utils/pageWidgets.js');
const { renderPage, collectModules } = await ui('utils/renderPage.js');
const { createNode } = await ui('utils/pageTree.js');

const declared = config.page_widgets.map(definition => normalizeExtensionWidget('kempo-blog', definition));
const errors = declared.filter(([error]) => error).map(([error]) => error.msg);
declared.filter(([error]) => !error).forEach(([, widget]) => addWidget(widget));
const registry = registryOf(widgets);
const recentKey = 'kempo-blog-recent-posts';
const listKey = 'kempo-blog-post-list';

export default {
  'both declarations are ones kempo accepts': async ({ pass, fail }) => {
    if(errors.length) return fail(errors.join('; '));
    if(config.page_widgets.length !== 2) return fail('expected the two blog widgets');
    pass('');
  },

  'the files the declarations point at exist': async ({ pass, fail }) => {
    for(const definition of config.page_widgets){
      try {
        await access(path.join(root, 'public', definition.page_component.replace(/^\/blog\//, '')));
      } catch {
        return fail(`${definition.page_component} does not exist`);
      }
    }
    pass('');
  },

  'the recent posts widget is written as its element with its limit and category': async ({ pass, fail }) => {
    const html = renderPage([createNode(recentKey, { limit: 3, category: 'news' })], registry);
    if(!html.startsWith('<k-blog-recent-posts-widget')) return fail(html);
    if(!html.includes('limit="3"') || !html.includes('category="news"')) return fail(html);
    pass('');
  },

  'a plain recent posts widget has no settings written': async ({ pass, fail }) => {
    const html = renderPage([createNode(recentKey, {})], registry);
    if(!html.startsWith('<k-blog-recent-posts-widget') || /limit=|category=|tag=/.test(html)) return fail(html);
    pass('');
  },

  'the post list widget is written with its page size and author': async ({ pass, fail }) => {
    const html = renderPage([createNode(listKey, { 'page-size': 4, author: 'abc123' })], registry);
    if(!html.startsWith('<k-blog-post-list-widget') || !html.includes('page-size="4"') || !html.includes('author="abc123"')) return fail(html);
    pass('');
  },

  'a page that uses a blog widget loads its component, once': async ({ pass, fail }) => {
    const modules = collectModules([createNode(recentKey, {}), createNode(recentKey, {}), createNode(listKey, {})], registry);
    const recent = modules.filter(url => url === '/blog/components/RecentPostsWidget.js');
    if(recent.length !== 1 || !modules.includes('/blog/components/PostListWidget.js')) return fail(modules.join(', '));
    pass('');
  },

  'no blog widget offers a status, so a page cannot ask for drafts': async ({ pass, fail }) => {
    for(const definition of config.page_widgets){
      if(definition.attributes.some(attribute => attribute.name === 'status')) return fail(`${definition.key} offers a status`);
    }
    pass('');
  },

  'the blog widgets are in the Blog group': async ({ pass, fail }) => {
    for(const definition of config.page_widgets){
      if(definition.category !== 'blog' || definition.category_title !== 'Blog') return fail(`${definition.key} is not in the Blog group`);
    }
    pass('');
  }
};
