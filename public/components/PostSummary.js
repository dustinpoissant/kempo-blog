import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';
import '/kempo-ui/components/Timestamp.js';
import './PostAuthor.js';

export const formatDate = ts => ts ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export default class BlogPostSummary extends ShadowComponent {
  static properties = {
    post: { state: true },
  };

  constructor(){
    super();
    this.post = null;
  }

  render(){
    const p = this.post;
    if(!p) return html``;
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return html`
      <div class="card mb pb">
        <h2 class="mb0"><a class="td-n tc-default" href="/post/${p.path.replace(/^post\//, '').replace(/\.page\.html$/, '')}">${p.name || p.path}</a></h2>
        <div class="d-f tc-muted small" style="gap: var(--spacer_h); align-items: center">
          <span><k-blog-post-author author="${p.author}"></k-blog-post-author></span>
          <span>&bull;</span>
          <k-timestamp timestamp="${p.created}"></k-timestamp>
        </div>
        ${tags.length ? html`<div class="mt0"><k-blog-post-tags tags="${tags.join(', ')}"></k-blog-post-tags></div>` : ''}
        ${p.status === 'draft' ? html`<span class="badge">Draft</span>` : ''}
        ${!p.public ? html`<span class="badge">Private</span>` : ''}
      </div>
    `;
  }
}

customElements.define('k-blog-post-summary', BlogPostSummary);

