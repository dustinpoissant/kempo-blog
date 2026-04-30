import { join } from 'path';
import { deleteAdminGlobalContentByOwner } from 'kempo/server/sdk.js';

export default async () => {
  const adminDir = join(process.cwd(), 'node_modules', 'kempo', 'dist', 'admin');

  await deleteAdminGlobalContentByOwner({ adminDir, owner: 'kempo-blog' });
};
