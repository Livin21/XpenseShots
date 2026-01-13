import { useState } from 'react';
import { Settings, Plus, Trash2, GripVertical, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories } from '../hooks/useCategories.js';

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#6b7280', '#78716c',
];

/**
 * Settings page - Category management
 */
export function SettingsPage() {
  const { categories, loading, add, update, remove } = useCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    await add({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });

    setNewCategoryName('');
    setNewCategoryColor(COLOR_OPTIONS[0]);
    setIsAdding(false);
  };

  const handleStartEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingId) return;

    await update(editingId, {
      name: editingName.trim(),
      color: editingColor,
    });

    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await remove(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your categories and preferences
        </p>
      </div>

      {/* Categories Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Categories</h2>
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          )}
        </div>

        <div className="divide-y divide-border">
          {/* Add new category form */}
          {isAdding && (
            <div className="p-4 bg-secondary/30 space-y-3">
              <Input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all',
                      newCategoryColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  <Check className="w-4 h-4 mr-1" />
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Category list */}
          {categories.map((category) => (
            <div key={category.id} className="p-4 flex items-center gap-3">
              {editingId === category.id ? (
                // Edit mode
                <div className="flex-1 space-y-3">
                  <Input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditingColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-all',
                          editingColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1 text-foreground">{category.name}</span>
                  {category.isDefault && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                      Default
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(category)}
                  >
                    Edit
                  </Button>
                  {!category.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
