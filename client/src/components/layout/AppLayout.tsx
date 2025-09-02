import React from 'react';
import Header from '@/components/Header';

interface AppLayoutProps {
  /** Contenuto principale dell'applicazione */
  children: React.ReactNode;
  /** Se true, usa uno sfondo più scuro per maggiore immersività */
  darkMode?: boolean;
  /** Classe CSS personalizzata per il container principale */
  className?: string;
}

/**
 * Layout generale dell'applicazione
 * 
 * Fornisce la struttura base con:
 * - Header comune con logo, tema e profilo
 * - Container principale per il contenuto
 * - Gestione del tema scuro/chiaro
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  darkMode = false,
  className = ''
}) => {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-background'} text-foreground ${className}`}>
      <Header />
      
      {/* Container principale */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;