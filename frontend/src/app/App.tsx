import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Studio } from './pages/Studio';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (currentPath === '/studio') {
    return <Studio onNavigateToLanding={() => navigateTo('/')} />;
  }

  return <Landing onNavigateToStudio={() => navigateTo('/studio')} />;
};

export default App;
