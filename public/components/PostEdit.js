import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import Toast from '/kempo-ui/components/Toast.js';
import { getPost, updatePost, softDeletePost } from '/blog/sdk.js';
import '/kempo-ui/components/MarkdownEditor.js';
import '/kempo-ui/components/Toggle.js';
import '/kempo-ui/components/SegmentedControl.js';
import '/kempo-ui/components/Tags.js';

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
  }

  updated(changed){
    super.updated?.(changed);
    if(changed.has('path') && this.path) this.load();
  }

  async load(){
    this.loading = true;
    const [err, data] = await getPost(this.path);
    this.loading = false;
    if(err){ Toast.error(err.msg); return; }
    const p = data.post;
    this.post = p;
    this.name = p.name || '';
    this.status = p.status || 'draft';
    this.isPublic = p.public !== false;
    this.tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    this.content = p.contents?.find(c => c.location === 'default')?.content || '';
  }

  /*
    Event Handlers
  */
  saveHandler(e){
    e.preventDefault();
    this.save();
  }

  nameInputHandler(e){
    this.name = e.target.value;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  statusChangeHandler(e){
    this.status = e.target.value;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  publicChangeHandler(e){
    this.isPublic = e.target.checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  tagsInputHandler(e){
    this.tags = e.detail?.newValue ?? this.tags;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  contentChangeHandler(e){
    this.content = e.detail?.value ?? this.content;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  deleteHandler(){
    if(!confirm('Delete this post? It will be disabled but not permanently removed.')) return;
    this.delete();
  }

  /*
    Methods
  */
  async save(){
    this.submitting = true;
    const [err] = await updatePost({
      path: this.path,
      name: this.name || undefined,
      status: this.status,
      public: this.isPublic,
      tags: this.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: this.content,
    });
    this.submitting = false;
    if(err){ Toast.error(err.msg); return; }
    await this.load();
    Toast.success('Post saved.');
  }

  async delete(){
    const [err] = await softDeletePost(this.path);
    if(err){ Toast.error(err.msg); return; }
    window.location.href = '/admin/extension/kempo-blog/';
  }

  reset(){
    this.load();
  }

  render(){
    if(this.loading) return html`<k-spinner></k-spinner>`;
    return html`
      <form @submit=${this.saveHandler}>
        <div class="mb">
          <label>Post Name / Title</label>
          <input class="w100" type="text" .value=${this.name} @input=${this.nameInputHandler}>
        </div>
        <div class="mb">
          <label>Status</label>
          <k-segmented-control .value=${this.status} @change=${this.statusChangeHandler}>
            <k-sc-option value="published">Published</k-sc-option>
            <k-sc-option value="draft">Draft</k-sc-option>
            <k-sc-option value="disabled">Disabled</k-sc-option>
          </k-segmented-control>
        </div>
        <div class="mb">
          <k-toggle .checked=${this.isPublic} @change=${this.publicChangeHandler}>Public</k-toggle>
        </div>
        <div class="mb">
          <label>Tags</label>
          <k-tags .value=${this.tags} @change=${this.tagsInputHandler}></k-tags>
        </div>
        <div class="mb">
          <h3 class="mb0">Content</h3>
          <k-markdown-editor style="--height: 600px; --min-height: 15rem; --max-height: 75vh" .value=${this.content} @change=${this.contentChangeHandler} controls="minimal"></k-markdown-editor>
        </div>
      </form>
    `;
  }
}

customElements.define('k-blog-post-edit', BlogPostEdit);

