import { join } from 'path';
import { getUsers, addUserToGroup, getSetting, createAdminGlobalContent } from 'kempo/server/sdk.js';
import generateBlogTemplate from './server/utils/posts/generateBlogTemplate.js';

export default async () => {
  const rootDir = join(process.cwd(), 'public');
  const adminDir = join(process.cwd(), 'node_modules', 'kempo', 'dist', 'admin');

  await createAdminGlobalContent({
    adminDir,
    name: 'kempo-blog-nav',
    location: 'admin-nav-extensions',
    owner: 'kempo-blog',
    priority: 0,
    markup: '<k-aside-item icon="article" href="/admin/extension/kempo-blog/" no-expand>Blog</k-aside-item>',
  });

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

