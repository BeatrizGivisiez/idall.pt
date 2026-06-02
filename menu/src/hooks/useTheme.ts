import { useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('adminTheme') !== 'light';
    } catch {
      return true;
    }
  });

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('adminTheme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  return { isDark, toggle };
}
