import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import { getPost, updatePost, softDeletePost } from '/blog/posts/sdk.js';
import '/kempo-ui/components/MarkdownEditor.js';

export default class BlogPostEdit extends ShadowComponent {
  static properties = {
    path: { type: String, reflect: true },
    post: { state: true },
    name: { state: true },
    status: { state: true },
    isPublic: { state: true },
    tags: { state: true },
    content: { state: true },
    loading: { state: true },
    submitting: { state: true },
    error: { state: true },
    success: { state: true },
  };

  constructor(){
    super();
    this.path = '';
    this.post = null;
    this.name = '';
    this.status = 'draft';
    this.isPublic = true;
    this.tags = '';
    this.content = '';
    this.loading = true;
    this.submitting = false;
    this.error = '';
    this.success = '';
  }

  updated(changed){
    super.updated?.(changed);
    if(changed.has('path') && this.path) this.load();
  }

  async load(){
    this.loading = true;
    const [err, data] = await getPost(this.path);
    this.loading = false;
    if(err){ this.error = err.msg; return; }
    const p = data.post;
    this.post = p;
    this.name = p.name || '';
    this.status = p.status || 'draft';
    this.isPublic = p.public !== false;
    this.tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    this.content = p.contents?.find(c => c.location === 'default')?.content || '';
  }

  async onSave(e){
    e.preventDefault();
    this.submitting = true;
    this.error = '';
    this.success = '';
    const [err] = await updatePost({
      path: this.path,
      name: this.name || undefined,
      status: this.status,
      public: this.isPublic,
      tags: this.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: this.content,
    });
    this.submitting = false;
    if(err){ this.error = err.msg; return; }
    this.success = 'Post saved.';
  }

  async onDelete(){
    if(!confirm('Delete this post? It will be disabled but not permanently removed.')) return;
    const [err] = await softDeletePost(this.path);
    if(err){ alert(err.msg); return; }
    window.location.href = '/blog/posts';
  }

  render(){
    if(this.loading) return html`<k-spinner></k-spinner>`;
    return html`
      <form @submit=${this.onSave}>
        <div class="mb">
          <label>Post Name / Title</label>
          <input class="w100" type="text" .value=${this.name} @input=${e => { this.name = e.target.value; }}>
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
        <div class="mb">
          <label>Tags (comma-separated)</label>
          <input class="w100" type="text" .value=${this.tags} @input=${e => { this.tags = e.target.value; }}>
        </div>
        <div class="mb">
          <label>Content</label>
          <k-markdown-editor .value=${this.content} @change=${e => { this.content = e.detail?.value ?? this.content; }}></k-markdown-editor>
        </div>
        ${this.error ? html`<p class="tc-error small">${this.error}</p>` : ''}
        ${this.success ? html`<p class="tc-success small">${this.success}</p>` : ''}
        <div class="d-f g-sm">
          <button class="btn" type="submit" ?disabled=${this.submitting}>
            ${this.submitting ? html`<k-spinner small></k-spinner>` : 'Save'}
          </button>
          <button class="btn danger ghost" type="button" @click=${this.onDelete}>Delete Post</button>
        </div>
      </form>
    `;
  }
}

customElements.define('k-blog-post-edit', BlogPostEdit);
