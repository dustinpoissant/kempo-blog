import ShadowComponent from '/kempo-ui/components/ShadowComponent.js';
import { html } from '/kempo-ui/lit-all.min.js';

export default class BlogPostAuthor extends ShadowComponent {
  static properties = {
    author: { type: String, reflect: true },
    name: { state: true },
  };

  constructor(){
    super();
    this.author = '';
    this.name = '';
  }

  updated(changed){
    super.updated?.(changed);
    if(changed.has('author') && this.author) this.loadAuthor();
  }

  async loadAuthor(){
    try {
      const res = await fetch(`/kempo/api/user/${this.author}`);
      if(res.ok){
        const data = await res.json();
        this.name = data.user?.name || this.author;
      }
    } catch {
      this.name = this.author;
    }
  }

  render(){
    return html`<a href="/blog/posts/author/${this.author}">${this.name || this.author}</a>`;
  }
}

customElements.define('k-blog-post-author', BlogPostAuthor);
