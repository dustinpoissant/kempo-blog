import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import '/kempo-ui/components/Toast.js';
import '/kempo-ui/components/MarkdownEditor.js';
import { createComment } from '/blog/sdk.js';

const ALLOWED_TAGS = 'p,br,strong,em,del,code,pre,blockquote,ul,ol,li,h1,h2,h3,h4,h5,h6';

export default class AddPostComment extends ShadowComponent {
  static properties = {
    post: { type: String, reflect: true },
    submitting: { state: true },
  };

  constructor(){
    super();
    this.post = '';
    this.submitting = false;
  }

  get editor(){
    return this.shadowRoot?.querySelector('k-markdown-editor');
  }

  async onSubmit(e){
    e.preventDefault();
    const content = this.editor?.value?.trim();
    if(!content) return;
    this.submitting = true;
    const [err, { comment }] = await createComment({ post: this.post, content });
    this.submitting = false;
    if(err){ customElements.get('k-toast').error(err.msg); return; }
    this.editor.clear();
    this.dispatchEvent(new CustomEvent('comment-added', { bubbles: true, composed: true, detail: { comment } }));
  }

  render(){
    return html`
      <form @submit=${this.onSubmit}>
        <k-markdown-editor
          controls="minimal"
          allowed-tags="${ALLOWED_TAGS}"
          placeholder="Write a comment..."
          ?disabled=${this.submitting}
        ></k-markdown-editor>

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

