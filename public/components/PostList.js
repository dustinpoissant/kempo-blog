import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import '/kempo-ui/components/Pagination.js';
import { getPosts } from '/blog/sdk.js';

export default class BlogPostList extends ShadowComponent {
  static properties = {
    status: { type: String, reflect: true },
    author: { type: String, reflect: true },
    category: { type: String, reflect: true },
    tag: { type: String, reflect: true },
    'created-after': { type: String, reflect: true },
    'created-before': { type: String, reflect: true },
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
    this['created-after'] = '';
    this['created-before'] = '';
    this['page-size'] = 25;
    this.posts = [];
    this.total = 0;
    this.offset = 0;
    this.loading = true;
    this.error = '';
  }

  connectedCallback(){
    super.connectedCallback();
    this.connected = true;
    this.load();
  }

  updated(changed){
    super.updated?.(changed);
    if(!this.connected) return;
    const filterProps = ['tag', 'author', 'category', 'status', 'created-after', 'created-before'];
    if(filterProps.some(p => changed.has(p) && changed.get(p) !== undefined)){
      this.offset = 0;
      this.load();
    }
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
      createdAfter: this['created-after'] || undefined,
      createdBefore: this['created-before'] || undefined,
    };
    const [err, data] = await getPosts(params);
    this.loading = false;
    if(err){ this.error = err.msg; return; }
    this.posts = data.posts;
    this.total = data.total;
  }

  handlePageChange(e){
    const { currentPage, itemsPerPage } = e.detail;
    const offset = (currentPage - 1) * itemsPerPage;
    if(itemsPerPage === this['page-size'] && offset === this.offset) return;
    this['page-size'] = itemsPerPage;
    this.offset = offset;
    this.load();
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  render(){
    if(this.loading) return html`<k-spinner></k-spinner>`;
    if(this.error) return html`<p class="tc-muted">${this.error}</p>`;
    if(!this.posts.length) return html`<p class="tc-muted">No posts found.</p>`;
    const page = Math.floor(this.offset / this['page-size']) + 1;
    return html`
      ${this.posts.map(p => {
        const el = document.createElement('k-blog-post-summary');
        el.post = p;
        return el;
      })}
      <k-pagination
        style="margin-top: var(--spacer)"
        controls="full"
        .page=${page}
        .totalItems=${this.total}
        .itemsPerPage=${this['page-size']}
        @page-change=${this.handlePageChange}
      ></k-pagination>
    `;
  }
}

customElements.define('k-blog-post-list', BlogPostList);

