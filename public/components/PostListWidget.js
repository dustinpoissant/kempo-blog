import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html, css } from '/kempo-ui/lit-all.min.js';
import '/blog/components/PostList.js';
import '/blog/components/PostSummary.js';

/*
  The published posts on a page built in the page builder, a page at a time, optionally from one category, tag or author.
  Like the Recent posts widget it never shows drafts.
*/
export default class PostListWidget extends ShadowComponent {
  static properties = {
    category: { type: String },
    tag: { type: String },
    author: { type: String },
    pageSize: { type: Number, attribute: 'page-size' }
  };

  static styles = css`
    :host { display: block; }
  `;

  constructor(){
    super();
    this.category = '';
    this.tag = '';
    this.author = '';
    this.pageSize = 10;
  }

  render(){
    return html`<k-blog-post-list status="published" category=${this.category} tag=${this.tag} author=${this.author} page-size=${this.pageSize}></k-blog-post-list>`;
  }
}

customElements.define('k-blog-post-list-widget', PostListWidget);
