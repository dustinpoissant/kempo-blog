import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html, css } from '/kempo-ui/lit-all.min.js';
import '/blog/components/RecentPosts.js';

/*
  The latest published posts on a page built in the page builder, optionally from one category or tag. It shows
  published posts only; a page cannot ask for drafts.
*/
export default class RecentPostsWidget extends ShadowComponent {
  static properties = {
    limit: { type: Number },
    category: { type: String },
    tag: { type: String }
  };

  static styles = css`
    :host { display: block; }
  `;

  constructor(){
    super();
    this.limit = 5;
    this.category = '';
    this.tag = '';
  }

  render(){
    return html`<k-blog-recent-posts limit=${this.limit} category=${this.category} tag=${this.tag}></k-blog-recent-posts>`;
  }
}

customElements.define('k-blog-recent-posts-widget', RecentPostsWidget);
