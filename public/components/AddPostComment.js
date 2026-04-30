import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import '/kempo-ui/components/Toast.js';
import { createComment } from '/blog/posts/sdk.js';

export default class AddPostComment extends ShadowComponent {
  static properties = {
    post: { type: String, reflect: true },
    content: { state: true },
    submitting: { state: true },
  };

  constructor(){
    super();
    this.post = '';
    this.content = '';
    this.submitting = false;
  }

  async onSubmit(e){
    e.preventDefault();
    if(!this.content.trim()) return;
    this.submitting = true;
    const [err, { comment }] = await createComment({ post: this.post, content: this.content });
    this.submitting = false;
    if(err){ customElements.get('k-toast').error(err.msg); return; }
    this.content = '';
    this.dispatchEvent(new CustomEvent('comment-added', { bubbles: true, composed: true, detail: { comment } }));
  }

  render(){
    return html`
      <form @submit=${this.onSubmit}>
        <textarea
          class="w100"
          rows="4"
          placeholder="Write a comment..."
          .value=${this.content}
          @input=${e => { this.content = e.target.value; }}
          ?disabled=${this.submitting}
        ></textarea>

        <div class="mt0">
          <button class="btn" type="submit" ?disabled=${this.submitting}>
            ${this.submitting ? html`<k-spinner small></k-spinner>` : 'Post Comment'}
          </button>
        </div>
      </form>
    `;
  }
}

customElements.define('k-blog-add-post-comment', AddPostComment);
