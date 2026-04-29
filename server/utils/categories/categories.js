import db from 'kempo/server/db/index.js';
import { kempoBlogCategory } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const getCategories = async () => {
  try {
    const rows = await db.select().from(kempoBlogCategory);
    return [null, rows];
  } catch {
    return [{ code: 500, msg: 'Failed to retrieve categories' }, null];
  }
};

export const createCategory = async ({ name, description = '', parent = null }) => {
  if(!name) return [{ code: 400, msg: 'Category name is required' }, null];
  try {
    const [row] = await db
      .insert(kempoBlogCategory)
      .values({ id: crypto.randomBytes(8).toString('hex'), name, description, parent: parent || null })
      .returning();
    return [null, row];
  } catch {
    return [{ code: 500, msg: 'Failed to create category' }, null];
  }
};

export const updateCategory = async (id, { name, description, parent }) => {
  if(!id) return [{ code: 400, msg: 'Category ID is required' }, null];
  const updates = {};
  if(name !== undefined) updates.name = name;
  if(description !== undefined) updates.description = description;
  if(parent !== undefined) updates.parent = parent || null;
  try {
    const [row] = await db
      .update(kempoBlogCategory)
      .set(updates)
      .where(eq(kempoBlogCategory.id, id))
      .returning();
    if(!row) return [{ code: 404, msg: 'Category not found' }, null];
    return [null, row];
  } catch {
    return [{ code: 500, msg: 'Failed to update category' }, null];
  }
};

export const deleteCategory = async (id) => {
  if(!id) return [{ code: 400, msg: 'Category ID is required' }, null];
  try {
    await db.delete(kempoBlogCategory).where(eq(kempoBlogCategory.id, id));
    return [null, { success: true }];
  } catch {
    return [{ code: 500, msg: 'Failed to delete category' }, null];
  }
};
