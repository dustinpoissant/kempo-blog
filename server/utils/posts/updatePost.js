import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { getPage } from 'kempo/server/sdk.js';
import db from 'kempo/server/db/index.js';
import { kempoBlogPost, kempoBlogTag } from '../../db/schema.js';
import { eq } from 'drizzle-orm';


export default async ({ rootDir, path, name, content, abstract, tags, isPublic, status, category, commentsEnabled, approvedCommentsOnly }) => {
  if(!rootDir) return [{ code: 400, msg: 'Root directory is required' }, null];
  if(!path) return [{ code: 400, msg: 'Post path is required' }, null];

  const safePath = path.replace(/\.\./g, '').replace(/^\//, '');
  const fullPath = join(rootDir, safePath);

  if(!existsSync(fullPath)) return [{ code: 404, msg: 'Post file not found' }, null];

  const raw = await readFile(fullPath, 'utf-8');

  const frontmatterMatch = raw.match(/^<!--\s*\n([\s\S]*?)\n\s*-->/);
  const existingMeta = {};
  if(frontmatterMatch){
    for(const line of frontmatterMatch[1].split('\n')){
      const idx = line.indexOf(':');
      if(idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if(key) existingMeta[key] = value;
    }
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const newMeta = { ...existingMeta, updated: nowISO };
  if(name !== undefined) newMeta.name = name;
  if(isPublic !== undefined) newMeta.public = String(isPublic);
  if(status !== undefined) newMeta.status = status;
  if(commentsEnabled !== undefined) newMeta.comments = String(commentsEnabled);
  if(approvedCommentsOnly !== undefined) newMeta.approved_comments_only = String(approvedCommentsOnly);
  if(category !== undefined) newMeta.category = category;

  const frontmatter = '<!--\n' +
    Object.entries(newMeta).map(([k, v]) => `  ${k}: ${v}`).join('\n') +
    '\n-->';

  const pageTagMatch = raw.match(/<page\s([^>]*)>/);
  let pageAttrs = pageTagMatch ? pageTagMatch[1] : `template="blog/blog-post" title="${newMeta.name}"`;

  const attrUpdates = {};
  if(name !== undefined){ attrUpdates.title = name; }
  if(isPublic !== undefined){ attrUpdates.public = String(isPublic); }
  if(status !== undefined){ attrUpdates.status = status; }
  if(approvedCommentsOnly !== undefined){ attrUpdates.approved_comments_only = String(approvedCommentsOnly); }
  if(tags !== undefined){ attrUpdates.tags = tags.join(', '); }
  if(category !== undefined){ attrUpdates.category = category; }
  attrUpdates.updated = nowISO;

  for(const [k, v] of Object.entries(attrUpdates)){
    if(pageAttrs.includes(`${k}="`)){
      pageAttrs = pageAttrs.replace(new RegExp(`${k}="[^"]*"`), `${k}="${v}"`);
    } else {
      pageAttrs += ` ${k}="${v}"`;
    }
  }

  let contentBlocks = '';
  if(content !== undefined || abstract !== undefined){
    const existingBlocks = {};
    const blockRx = /<content(?:\s+location="([^"]*)")?\s*>([\s\S]*?)<\/content>/g;
    let m;
    while((m = blockRx.exec(raw)) !== null){
      existingBlocks[m[1] || 'default'] = m[2].trim();
    }
    if(content !== undefined) existingBlocks['default'] = content;
    if(abstract !== undefined) existingBlocks['abstract'] = abstract;

    contentBlocks = Object.entries(existingBlocks)
      .map(([loc, c]) => loc === 'default'
        ? `<content>\n${c}\n</content>`
        : `<content location="${loc}">\n${c}\n</content>`)
      .join('\n');
  } else {
    contentBlocks = (raw.match(/<content[\s\S]*?<\/content>/g) || []).join('\n');
  }

  await writeFile(fullPath, `${frontmatter}\n<page ${pageAttrs}>\n${contentBlocks}\n</page>\n`, 'utf-8');

  const dbUpdates = { updated: now };
  if(isPublic !== undefined) dbUpdates.public = isPublic;
  if(status !== undefined) dbUpdates.status = status;
  if(category !== undefined) dbUpdates.category = category || null;

  await db.update(kempoBlogPost).set(dbUpdates).where(eq(kempoBlogPost.path, path));

  if(tags !== undefined){
    await db.delete(kempoBlogTag).where(eq(kempoBlogTag.post, path));
    if(tags.length){
      await db.insert(kempoBlogTag).values(
        tags.map(tag => ({ id: crypto.randomBytes(8).toString('hex'), post: path, tag: tag.trim() }))
      );
    }
  }

  return [null, { path, updatedAt: nowISO }];
};
