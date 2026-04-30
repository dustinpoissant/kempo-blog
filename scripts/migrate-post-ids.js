// One-time migration: Assign post IDs and update comments to use post.id instead of path
import db from '../server/db/index.js';
import { kempoBlogPost, blogComment } from '../server/db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const randomId = () => crypto.randomBytes(4).toString('hex');

const migrate = async () => {
  // 1. Add id to all posts if missing
  const posts = await db.select().from(kempoBlogPost);
  for(const post of posts){
    if(!post.id){
      const id = randomId();
      await db.update(kempoBlogPost).set({ id }).where(eq(kempoBlogPost.path, post.path));
      post.id = id;
    }
  }

  // 2. Update all comments to use post.id
  for(const post of posts){
    if(post.id && post.path){
      await db.update(blogComment).set({ post: post.id }).where(eq(blogComment.post, post.path));
    }
  }

  console.log('Migration complete.');
  process.exit(0);
};

migrate().catch(e => { console.error(e); process.exit(1); });
