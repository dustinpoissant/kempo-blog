import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import { createPost, getCategories } from '/blog/posts/sdk.js';

export default class BlogPostCreate extends ShadowComponent {
  static properties = {
    name: { state: true },
    status: { state: true },
    isPublic: { state: true },
    category: { state: true },
    tags: { state: true },
    categories: { state: true },
    submitting: { state: true },
    error: { state: true },
  };

  constructor(){
    super();
    this.name = '';
    this.status = 'draft';
    this.isPublic = true;
    this.category = '';
    this.tags = '';
    this.categories = [];
    this.submitting = false;
    this.error = '';
  }

  connectedCallback(){
    super.connectedCallback();
    getCategories().then(([, data]) => {
      this.categories = data?.categories || [];
    });
  }

  async onSubmit(e){
    e.preventDefault();
    if(!this.name.trim()){ this.error = 'Name is required'; return; }
    this.submitting = true;
    this.error = '';
    const [err, result] = await createPost({
      name: this.name,
      status: this.status,
      public: this.isPublic,
      category: this.category || undefined,
      tags: this.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    this.submitting = false;
    if(err){ this.error = err.msg; return; }
    window.location.href = `/blog/posts/edit/${result.post.postId}`;
  }

  render(){
    return html`
      <form @submit=${this.onSubmit}>
        <div class="mb">
          <label>Post Name / Title</label>
          <input class="w100" type="text" .value=${this.name} @input=${e => { this.name = e.target.value; }} required>
        </div>
        <div class="mb">
          <label>Status</label>
          <select class="w100" .value=${this.status} @change=${e => { this.status = e.target.value; }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div class="mb d-f g-sm">
          <input type="checkbox" id="is-public" .checked=${this.isPublic} @change=${e => { this.isPublic = e.target.checked; }}>
          <label for="is-public">Public</label>
        </div>
        ${this.categories.length ? html`
          <div class="mb">
            <label>Category</label>
            <select class="w100" .value=${this.category} @change=${e => { this.category = e.target.value; }}>
              <option value="">None</option>
              ${this.categories.map(cat => html`<option value="${cat.id}">${cat.name}</option>`)}
            </select>
          </div>
        ` : ''}
        <div class="mb">
          <label>Tags (comma-separated)</label>
          <input class="w100" type="text" .value=${this.tags} @input=${e => { this.tags = e.target.value; }}>
        </div>
        ${this.error ? html`<p class="tc-error small">${this.error}</p>` : ''}
        <button class="btn" type="submit" ?disabled=${this.submitting}>
          ${this.submitting ? html`<k-spinner small></k-spinner>` : 'Create Post'}
        </button>
      </form>
    `;
  }
}

customElements.define('k-blog-post-create', BlogPostCreate);
