import DashboardWidget from '/kempo/components/DashboardWidget.js';
import { html, nothing } from '/kempo-ui/lit-all.min.js';
import { getPosts, getPostsCounts, createPost } from '/blog/sdk.js';

const STATUSES = [
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'disabled', label: 'Disabled' }
];

/*
  The admin dashboard's view of the blog: how many posts are published, draft and disabled, and the
  latest ones. Registered through `widgets` in kempo-config.json.
*/
export default class BlogPostsWidget extends DashboardWidget {
  static properties = {
    ...DashboardWidget.properties,
    counts: { state: true },
    posts: { state: true }
  };

  constructor(){
    super();
    this.counts = {};
    this.posts = [];
    this.cta = { label: 'New post', icon: 'add', permission: 'posts:create', onClick: () => this.newPost() };
  }

  /*
    Public Methods
  */

  load = async () => {
    const [counts, { posts }] = await Promise.all([
      this.unwrap(getPostsCounts()),
      this.unwrap(getPosts({ limit: 9, offset: 0 }))
    ]);
    this.counts = counts;
    this.posts = posts;
  };

  /*
    Event Handlers
  */

  /*
    Asks for a title, creates a draft and opens it in the editor, as the Blog admin page does.
  */
  newPost = () => this.openForm({
    title: 'New Post',
    confirmText: 'Create',
    fields: [{ name: 'name', label: 'Post title', placeholder: 'Enter post title...' }],
    submit: async ({ name }) => {
      const [error, result] = await createPost({ name, status: 'draft', public: true, tags: [] });
      if(error) return error.msg;
      window.location.href = `/admin/extension/kempo-blog/edit/${result.post.postId}`;
    }
  });

  /*
    Rendering
  */

  renderContent(){
    if(!STATUSES.some(({ key }) => this.counts[key])) return html`<p class="tc-muted">No posts yet.</p>`;
    const rows = this.posts.slice(0, this.height * 3);
    return html`
      <div class="d-f mb">
        ${STATUSES.map(({ key, label }) => html`
          <div class="flex"><div class="h2 m0">${this.counts[key] ?? 0}</div><div class="small tc-muted">${label}</div></div>
        `)}
      </div>
      ${rows.length ? html`
        <div class="small tc-muted mbq">Latest posts</div>
        ${rows.map(post => html`
          <a class="d-b py bb" href="/admin/extension/kempo-blog/edit/${post.id}">
            ${post.name || post.path}
            ${post.status === 'published' ? nothing : html`<span class="small tc-muted">${post.status}</span>`}
          </a>
        `)}
      ` : nothing}
    `;
  }
}

customElements.define('k-blog-posts-widget', BlogPostsWidget);
