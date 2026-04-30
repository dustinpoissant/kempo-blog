import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import { deleteComment } from '/blog/posts/sdk.js';

export default class BlogPostComment extends ShadowComponent {
  static properties = {
    comment: { type: Object },
    currentUserId: { type: String, attribute: 'current-user-id', reflect: true },
    canModerate: { type: Boolean, attribute: 'can-moderate', reflect: true },
    deleted: { state: true },
  };

  constructor(){
    super();
    this.comment = null;
    this.currentUserId = '';
    this.canModerate = false;
    this.deleted = false;
  }

  async onDelete(){
    if(!confirm('Delete this comment?')) return;
    const [err] = await deleteComment(this.comment.id);
    if(err){ alert(err.msg); return; }
    this.deleted = true;
    this.dispatchEvent(new CustomEvent('comment-deleted', { bubbles: true, composed: true, detail: { id: this.comment.id } }));
  }

  render(){
    if(this.deleted) return html``;
    const c = this.comment;
    if(!c) return html``;
    const canDelete = this.canModerate || this.currentUserId === c.userid;
    return html`
      <div class="card mb0">
        <div class="d-f jc-sb">
          <div class="d-f g-sm tc-muted small">
            <k-blog-post-author author="${c.userid}"></k-blog-post-author>
            <span>&bull;</span>
            <k-timestamp timestamp="${c.created}"></k-timestamp>
          </div>
          ${canDelete ? html`<button class="btn ghost small" @click=${this.onDelete}><k-icon name="delete"></k-icon></button>` : ''}
        </div>
        <div class="mt0">${c.content}</div>
      </div>
    `;
  }
}

customElements.define('k-blog-post-comment', BlogPostComment);
