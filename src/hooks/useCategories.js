import { useState, useEffect, useCallback } from 'react';
import { db } from '../storage/db.js';

/**
 * Default categories (used as fallback before DB is initialized)
 */
const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#f97316', isDefault: true, order: 0 },
  { id: 'groceries', name: 'Groceries', color: '#22c55e', isDefault: true, order: 1 },
  { id: 'utilities', name: 'Utilities', color: '#3b82f6', isDefault: true, order: 2 },
  { id: 'subscriptions', name: 'Subscriptions', color: '#a855f7', isDefault: true, order: 3 },
  { id: 'shopping', name: 'Shopping', color: '#ec4899', isDefault: true, order: 4 },
  { id: 'transport', name: 'Transport', color: '#eab308', isDefault: true, order: 5 },
  { id: 'entertainment', name: 'Entertainment', color: '#06b6d4', isDefault: true, order: 6 },
  { id: 'health', name: 'Health', color: '#ef4444', isDefault: true, order: 7 },
  { id: 'misc', name: 'Miscellaneous', color: '#6b7280', isDefault: true, order: 8 },
];

/**
 * Hook for managing categories
 * @returns {{
 *   categories: import('../storage/db.js').Category[],
 *   loading: boolean,
 *   add: (category: Omit<import('../storage/db.js').Category, 'id' | 'order'>) => Promise<string>,
 *   update: (id: string, updates: Partial<import('../storage/db.js').Category>) => Promise<void>,
 *   remove: (id: string) => Promise<void>,
 *   reorder: (orderedIds: string[]) => Promise<void>,
 *   getCategoryColor: (name: string) => string,
 *   refresh: () => Promise<void>
 * }}
 */
export function useCategories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      let cats = await db.categories.orderBy('order').toArray();

      // If no categories exist, add defaults
      if (cats.length === 0) {
        await db.categories.bulkAdd(DEFAULT_CATEGORIES);
        cats = DEFAULT_CATEGORIES;
      }

      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const add = useCallback(async (category) => {
    const maxOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.order))
      : -1;

    const id = `custom-${Date.now()}`;
    const newCategory = {
      ...category,
      id,
      isDefault: false,
      order: maxOrder + 1,
    };

    await db.categories.add(newCategory);
    await loadCategories();
    return id;
  }, [categories, loadCategories]);

  const update = useCallback(async (id, updates) => {
    await db.categories.update(id, updates);
    await loadCategories();
  }, [loadCategories]);

  const remove = useCallback(async (id) => {
    // Don't allow removing default categories
    const category = categories.find(c => c.id === id);
    if (category?.isDefault) {
      throw new Error('Cannot delete default category');
    }

    await db.categories.delete(id);
    await loadCategories();
  }, [categories, loadCategories]);

  const reorder = useCallback(async (orderedIds) => {
    const updates = orderedIds.map((id, index) => ({
      key: id,
      changes: { order: index }
    }));

    await Promise.all(
      updates.map(({ key, changes }) => db.categories.update(key, changes))
    );
    await loadCategories();
  }, [loadCategories]);

  const getCategoryColor = useCallback((name) => {
    const category = categories.find(c => c.name === name);
    return category?.color || '#6b7280';
  }, [categories]);

  return {
    categories,
    loading,
    add,
    update,
    remove,
    reorder,
    getCategoryColor,
    refresh: loadCategories,
  };
}
