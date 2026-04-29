import { getSetting, addUserToGroup } from 'kempo/server/sdk.js';

export default async ({ user }) => {
  if(!user?.id) return;

  const [err, setting] = await getSetting('kempo-blog', 'new_user_groups');
  if(err || !setting) return;

  const groupNames = String(setting).split(',').map(g => g.trim()).filter(Boolean);
  for(const group of groupNames){
    await addUserToGroup(user.id, group);
  }
};
