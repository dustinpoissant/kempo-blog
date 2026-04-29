import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const kempoBlogCategory = pgTable('kempoBlogCategory', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  parent: text('parent'),
});

export const kempoBlogPost = pgTable('kempoBlogPost', {
  path: text('path').primaryKey(),
  created: timestamp('created').notNull(),
  updated: timestamp('updated').notNull(),
  author: text('author').notNull(),
  public: boolean('public').notNull().default(true),
  status: text('status').notNull().default('draft'),
  category: text('category'),
});

export const kempoBlogTag = pgTable('kempoBlogTag', {
  id: text('id').primaryKey(),
  post: text('post').notNull(),
  tag: text('tag').notNull(),
});

export const blogComment = pgTable('blogComment', {
  id: text('id').primaryKey(),
  post: text('post').notNull(),
  parent: text('parent'),
  userid: text('userid').notNull(),
  created: timestamp('created').notNull(),
  updated: timestamp('updated').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('pending'),
});
