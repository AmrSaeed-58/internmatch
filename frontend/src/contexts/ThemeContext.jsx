import { createContext, useContext, useReducer, useEffect } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (['light', 'dark', 'system'].includes(stored)) return stored;
  return 'system';
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function themeReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE':
      return (state === 'system' ? getSystemTheme() : state) === 'dark' ? 'light' : 'dark';
    case 'SET':
      return action.payload;
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [theme, dispatch] = useReducer(themeReducer, null, getInitialTheme);

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const toggleTheme = () => dispatch({ type: 'TOGGLE' });
  const setTheme = (t) => dispatch({ type: 'SET', payload: t });

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
