import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`}
        title="Tema Claro"
        aria-label="Ativar tema claro"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`}
        title="Tema do Sistema"
        aria-label="Usar tema do sistema"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`}
        title="Tema Escuro"
        aria-label="Ativar tema escuro"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
