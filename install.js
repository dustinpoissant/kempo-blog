import { join } from 'path';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { getUsers, addUserToGroup, getSetting } from 'kempo/server/sdk.js';
import parseFrontmatter from 'kempo/server/utils/fs/parseFrontmatter.js';
import db from 'kempo/server/db/index.js';
import { kempoBlogPost, kempoBlogTag } from './server/db/schema.js';
import generateBlogTemplate from './server/utils/posts/generateBlogTemplate.js';

const adoptExistingPosts = async (rootDir) => {
  const postDir = join(rootDir, 'post');
  if(!existsSync(postDir)) return;

  const files = (await readdir(postDir)).filter(f => f.endsWith('.page.html'));
  let adopted = 0;

  for(const fileName of files){
    const postId = fileName.split('-')[0];
    if(!postId || postId.length !== 8) continue;

    const raw = await readFile(join(postDir, fileName), 'utf-8');
    const meta = parseFrontmatter(raw);
    if(meta.owner !== 'kempo-blog') continue;

    const path = `post/${fileName}`;

    await db.insert(kempoBlogPost).values({
      id: postId,
      path,
      created: meta.created ? new Date(meta.created) : new Date(),
      updated: meta.updated ? new Date(meta.updated) : new Date(),
      author: meta.author || '',
      public: meta.public === 'true',
      status: meta.status || 'draft',
      category: meta.category || null,
    }).onConflictDoNothing();

    const tagsMatch = raw.match(/<page\s[^>]*\btags="([^"]*)"/);
    if(tagsMatch && tagsMatch[1].trim()){
      for(const tag of tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)){
        await db.insert(kempoBlogTag).values({
          id: crypto.randomBytes(8).toString('hex'),
          post: path,
          tag,
        }).onConflictDoNothing();
      }
    }

    adopted++;
  }

  if(adopted) console.log(`[kempo-blog] Adopted ${adopted} existing post(s).`);
};

export default async () => {
  const rootDir = join(process.cwd(), 'public');

  await adoptExistingPosts(rootDir);

  /*
    The admin nav entry is not registered here. admin/nav.global.html ships in this package and is
    scanned at render time while the extension is enabled, so there is nothing to write on install
    or remove on uninstall.
  */

  const [, templateResult] = await generateBlogTemplate({ rootDir });
  if(templateResult) console.log('[kempo-blog] Blog template created/updated.');

  const [settingErr, newUserGroupsSetting] = await getSetting('kempo-blog', 'new_user_groups');
  if(settingErr || !newUserGroupsSetting) return;

  const groupNames = String(newUserGroupsSetting).split(',').map(g => g.trim()).filter(Boolean);
  if(!groupNames.length) return;

  const [usersErr, usersData] = await getUsers({});
  if(usersErr || !usersData?.users) return;

  for(const user of usersData.users){
    for(const group of groupNames){
      await addUserToGroup(user.id, group);
    }
  }

  console.log(`[kempo-blog] Added ${usersData.users.length} existing user(s) to groups: ${groupNames.join(', ')}`);
};

