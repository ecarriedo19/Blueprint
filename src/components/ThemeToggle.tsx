import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100/10 hover:bg-gray-100/20 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? (
        <Sun 
          size={18} 
          className="text-gray-300 group-hover:text-yellow-400 transition-colors duration-200" 
        />
      ) : (
        <Moon 
          size={18} 
          className="text-gray-600 group-hover:text-blue-600 transition-colors duration-200" 
        />
      )}
    </button>
  );
};

export default ThemeToggle;
