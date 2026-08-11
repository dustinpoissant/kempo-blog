import db from 'kempo/server/db/index.js';
import { blogComment } from '../../db/schema.js';
import crypto from 'crypto';
import { marked } from 'marked';

/*
  Strict HTML sanitizer — allowlist only, zero attributes.
  Accepts HTML produced by marked and strips everything dangerous:
  script/style/iframe blocks (with their content), all attributes,
  and any tag not in the allowlist (text content preserved).
*/
const ALLOWED_TAGS = new Set([
  'p','br','strong','em','del','code','pre',
  'blockquote','ul','ol','li',
  'h1','h2','h3','h4','h5','h6',
]);

const sanitize = html => {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '');
  // Self-closing (e.g. <br />): strip attrs, remove if not allowed
  s = s.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s*\/>/g, (_, t) =>
    ALLOWED_TAGS.has(t.toLowerCase()) ? `<${t.toLowerCase()} />` : ''
  );
  // Opening tags: strip ALL attributes, remove tag if not allowed (keep inner text)
  s = s.replace(/<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>/g, (_, t) =>
    ALLOWED_TAGS.has(t.toLowerCase()) ? `<${t.toLowerCase()}>` : ''
  );
  // Closing tags: remove if not allowed
  s = s.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g, (_, t) =>
    ALLOWED_TAGS.has(t.toLowerCase()) ? `</${t.toLowerCase()}>` : ''
  );
  return s.trim();
};

export default async ({ post, parent = null, userid, content }) => {
  if(!post || !userid || !content){
    return [{ code: 400, msg: 'post, userid, and content are required' }, null];
  }

  // Accept raw markdown, render to HTML, then sanitize strictly
  const rendered = marked.parse(String(content), { breaks: true });
  const cleaned = sanitize(rendered);
  if(!cleaned){
    return [{ code: 400, msg: 'Comment content cannot be empty' }, null];
  }

  const now = new Date();
  try {
    const [result] = await db
      .insert(blogComment)
      .values({
        id: crypto.randomBytes(16).toString('hex'),
        post,
        parent: parent || null,
        userid,
        created: now,
        updated: now,
        content: cleaned,
        status: 'pending',
      })
      .returning();

    return [null, result];
  } catch {
    return [{ code: 500, msg: 'Failed to create comment' }, null];
  }
};
