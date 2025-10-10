// Document visibility types and constants
export type DocumentVisibility = 'private' | 'team' | 'shared' | 'public';

export const DOCUMENT_VISIBILITY_ICONS: Record<DocumentVisibility, string> = {
  private: '🔒',
  team: '👥', 
  shared: '🔗',
  public: '🌐'
};

export const DOCUMENT_VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  private: 'Privat',
  team: 'Team',
  shared: 'Geteilt', 
  public: 'Öffentlich'
};

export const DOCUMENT_VISIBILITY_BG_COLORS: Record<DocumentVisibility, string> = {
  private: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  team: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  shared: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  public: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
};
