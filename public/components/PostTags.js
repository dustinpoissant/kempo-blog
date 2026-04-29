import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';

export default class BlogPostTags extends ShadowComponent {
  static properties = {
    tags: { type: String, reflect: true },
  };

  constructor(){
    super();
    this.tags = '';
  }

  get tagList(){
    return this.tags
      ? this.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
  }

  render(){
    const tags = this.tagList;
    if(!tags.length) return html``;
    return html`
      <div class="d-f g-sm" style="flex-wrap:wrap">
        ${tags.map(tag => html`
          <a href="/blog/posts?tag=${encodeURIComponent(tag)}" class="badge pill">${tag}</a>
        `)}
      </div>
    `;
  }
}

customElements.define('k-blog-post-tags', BlogPostTags);
