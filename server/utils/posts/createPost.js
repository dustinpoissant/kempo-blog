import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';
import db from 'kempo/server/db/index.js';
import { kempoBlogPost, kempoBlogTag } from '../../db/schema.js';

const slugify = name => name
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/[\s_]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const buildPageFile = ({ name, author, authorId, nowISO, commentsEnabled, isPublic, status, approvedCommentsOnly, category, tags, content, abstract, template }) => {
  const tagsStr = tags.length ? tags.join(', ') : '';
  const frontmatterLines = [
    '<!--',
    `  owner: kempo-blog`,
    `  name: ${name}`,
    `  author: ${authorId}`,
    `  created: ${nowISO}`,
    `  updated: ${nowISO}`,
    `  locked: true`,
    `  comments: ${commentsEnabled}`,
    `  public: ${isPublic}`,
    `  status: ${status}`,
    `  approved_comments_only: ${approvedCommentsOnly}`,
  ];
  if(category) frontmatterLines.push(`  category: ${category}`);
  frontmatterLines.push('-->');

  const attrParts = [`template="${template}" title="${name}" author="${author}"`];
  attrParts.push(`created="${nowISO}" updated="${nowISO}"`);
  attrParts.push(`public="${isPublic}" status="${status}"`);
  attrParts.push(`approved_comments_only="${approvedCommentsOnly}"`);
  if(tagsStr) attrParts.push(`tags="${tagsStr}"`);
  if(category) attrParts.push(`category="${category}"`);

  const contentBlocks = [
    `<content>\n${content || ''}\n</content>`,
    ...(abstract ? [`<content location="abstract">\n${abstract}\n</content>`] : []),
  ].join('\n');

  return `${frontmatterLines.join('\n')}\n<page ${attrParts.join(' ')}>\n${contentBlocks}\n</page>\n`;
};

export default async ({ rootDir, name, authorId, author, category = null, isPublic = true, status = 'draft', content = '', abstract = '', tags = [], commentsEnabled = true, approvedCommentsOnly = false, template = 'blog/blog-post' }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];
  if(!name) return [{ code: 400, msg: 'Post name is required' }, null];
  if(!authorId) return [{ code: 400, msg: 'Author ID is required' }, null];

  const slug = slugify(name);
  if(!slug) return [{ code: 400, msg: 'Post name must contain valid characters' }, null];

  const postId = crypto.randomBytes(4).toString('hex');
  const fileName = `${postId}-${slug}.page.html`;
  const blogDir = join(rootDir, 'blog');
  const filePath = join(blogDir, fileName);
  const path = `blog/${fileName}`;

  if(existsSync(filePath)) return [{ code: 409, msg: 'A post with this name already exists' }, null];

  const now = new Date();
  const nowISO = now.toISOString();
  const pageContent = buildPageFile({ name, author: author || authorId, authorId, nowISO, commentsEnabled, isPublic, status, approvedCommentsOnly, category, tags, content, abstract, template });

  await mkdir(blogDir, { recursive: true });
  await writeFile(filePath, pageContent, 'utf-8');

  try {
    await db.insert(kempoBlogPost).values({
      path,
      created: now,
      updated: now,
      author: authorId,
      public: isPublic,
      status,
      category: category || null,
    });

    if(tags.length){
      await db.insert(kempoBlogTag).values(
        tags.map(tag => ({
          id: crypto.randomBytes(8).toString('hex'),
          post: path,
          tag: tag.trim(),
        }))
      );
    }
  } catch {
    await unlink(filePath).catch(() => {});
    return [{ code: 500, msg: 'Failed to create post record' }, null];
  }

  return [null, { path, name, slug, postId, status, author: authorId, created: nowISO, updated: nowISO }];
};
