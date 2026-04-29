import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import { getPosts } from '/blog/posts/sdk.js';

export default class BlogRecentPosts extends ShadowComponent {
  static properties = {
    limit: { type: Number, reflect: true },
    category: { type: String, reflect: true },
    tag: { type: String, reflect: true },
    posts: { state: true },
    loading: { state: true },
  };

  constructor(){
    super();
    this.limit = 5;
    this.category = '';
    this.tag = '';
    this.posts = [];
    this.loading = true;
  }

  connectedCallback(){
    super.connectedCallback();
    this.load();
  }

  async load(){
    this.loading = true;
    const [, data] = await getPosts({
      limit: this.limit,
      offset: 0,
      status: 'published',
      category: this.category || undefined,
      tag: this.tag || undefined,
    });
    this.loading = false;
    this.posts = data?.posts || [];
  }

  render(){
    if(this.loading) return html`<k-spinner></k-spinner>`;
    if(!this.posts.length) return html`<p class="tc-muted small">No recent posts.</p>`;
    return html`
      <ul>
        ${this.posts.map(p => html`
          <li><a href="/blog/${p.path.replace(/^blog\//, '').replace(/\.page\.html$/, '')}">${p.name || p.path}</a></li>
        `)}
      </ul>
    `;
  }
}

customElements.define('k-blog-recent-posts', BlogRecentPosts);
