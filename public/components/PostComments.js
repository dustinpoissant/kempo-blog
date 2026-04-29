import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import { getComments } from '/blog/posts/sdk.js';

export default class BlogPostComments extends ShadowComponent {
  static properties = {
    post: { type: String, reflect: true },
    'comments-enabled': { type: Boolean, attribute: 'comments-enabled', reflect: true },
    'approved-only': { type: Boolean, attribute: 'approved-only', reflect: true },
    'page-size': { type: Number, attribute: 'page-size', reflect: true },
    comments: { state: true },
    total: { state: true },
    offset: { state: true },
    loading: { state: true },
    currentUserId: { state: true },
    canModerate: { state: true },
    canComment: { state: true },
  };

  constructor(){
    super();
    this.post = '';
    this['comments-enabled'] = true;
    this['approved-only'] = false;
    this['page-size'] = 20;
    this.comments = [];
    this.total = 0;
    this.offset = 0;
    this.loading = true;
    this.currentUserId = '';
    this.canModerate = false;
    this.canComment = false;
  }

  connectedCallback(){
    super.connectedCallback();
    this.init();
  }

  async init(){
    await this.loadUser();
    await this.load();
  }

  async loadUser(){
    try {
      const res = await fetch('/kempo/api/auth/session');
      if(!res.ok) return;
      const { user } = await res.json();
      if(!user) return;
      this.currentUserId = user.id;
      const permRes = await fetch('/kempo/api/user/current/permissions');
      if(permRes.ok){
        const { permissions } = await permRes.json();
        this.canComment = permissions.includes('kempo-blog:comments:create');
        this.canModerate = permissions.includes('kempo-blog:comments:others:delete');
      }
    } catch {}
  }

  async load(){
    this.loading = true;
    const [, data] = await getComments({
      post: this.post,
      limit: this['page-size'],
      offset: this.offset,
      approved_only: this['approved-only'] && !this.currentUserId,
    });
    this.loading = false;
    this.comments = data?.comments || [];
    this.total = data?.total || 0;
  }

  onCommentAdded(e){
    this.comments = [e.detail.comment, ...this.comments];
    this.total++;
  }

  onCommentDeleted(e){
    this.comments = this.comments.filter(c => c.id !== e.detail.id);
    this.total--;
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
    if(!this['comments-enabled']) return html``;
    return html`
      <div>
        <h3>Comments (${this.total})</h3>
        ${this.canComment ? html`
          <k-blog-add-post-comment
            post="${this.post}"
            @comment-added=${this.onCommentAdded}
          ></k-blog-add-post-comment>
        ` : html`<p class="tc-muted small"><a href="/login">Log in</a> to comment.</p>`}
        <div class="mt" @comment-deleted=${this.onCommentDeleted}>
          ${this.loading ? html`<k-spinner></k-spinner>` : html`
            ${this.comments.map(c => html`
              <k-blog-post-comment
                .comment=${c}
                current-user-id="${this.currentUserId}"
                ?can-moderate=${this.canModerate}
              ></k-blog-post-comment>
            `)}
          `}
        </div>
        <div class="d-f g-sm mt">
          ${this.offset > 0 ? html`<button class="btn secondary" @click=${this.prev}>Previous</button>` : ''}
          ${this.total > this.offset + this['page-size'] ? html`<button class="btn secondary" @click=${this.next}>Next</button>` : ''}
        </div>
      </div>
    `;
  }
}

customElements.define('k-blog-post-comments', BlogPostComments);
