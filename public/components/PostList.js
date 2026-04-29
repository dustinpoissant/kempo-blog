import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import { getPosts } from '/blog/posts/sdk.js';

export default class BlogPostList extends ShadowComponent {
  static properties = {
    status: { type: String, reflect: true },
    author: { type: String, reflect: true },
    category: { type: String, reflect: true },
    tag: { type: String, reflect: true },
    'page-size': { type: Number, reflect: true },
    posts: { state: true },
    total: { state: true },
    offset: { state: true },
    loading: { state: true },
    error: { state: true },
  };

  constructor(){
    super();
    this.status = 'published';
    this.author = '';
    this.category = '';
    this.tag = '';
    this['page-size'] = 10;
    this.posts = [];
    this.total = 0;
    this.offset = 0;
    this.loading = true;
    this.error = '';
  }

  connectedCallback(){
    super.connectedCallback();
    this.load();
  }

  async load(){
    this.loading = true;
    this.error = '';
    const params = {
      limit: this['page-size'],
      offset: this.offset,
      status: this.status || undefined,
      author: this.author || undefined,
      category: this.category || undefined,
      tag: this.tag || undefined,
    };
    const [err, data] = await getPosts(params);
    this.loading = false;
    if(err){ this.error = err.msg; return; }
    this.posts = data.posts;
    this.total = data.total;
  }

  prev(){
    this.offset = Math.max(0, this.offset - this['page-size']);
    this.load();
  }

  next(){
    this.offset += this['page-size'];
    this.load();
  }

  render(){
    if(this.loading) return html`<k-spinner></k-spinner>`;
    if(this.error) return html`<p class="tc-muted">${this.error}</p>`;
    if(!this.posts.length) return html`<p class="tc-muted">No posts found.</p>`;
    return html`
      ${this.posts.map(p => {
        const el = document.createElement('k-blog-post-summary');
        el.post = p;
        return el;
      })}
      <div class="d-f g-sm mt">
        ${this.offset > 0 ? html`<button class="btn secondary" @click=${this.prev}>Previous</button>` : ''}
        ${this.total > this.offset + this['page-size'] ? html`<button class="btn secondary" @click=${this.next}>Next</button>` : ''}
      </div>
    `;
  }
}

customElements.define('k-blog-post-list', BlogPostList);
