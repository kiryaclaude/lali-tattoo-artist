/**
 * layouts/MasterLayout.tsx
 * Layout для кабинета мастера
 * Отдельный модуль для возможности extraction в отдельное приложение
 */

import React from 'react';
import type { ReactNode } from 'react';

interface MasterLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export const MasterLayout: React.FC<MasterLayoutProps> = ({
  children,
  showSidebar = true,
  showHeader = true,
}) => {
  return (
    <div className="flex min-h-screen bg-page text-white">
      {/* Sidebar будет добавлен в следующем этапе */}
      {showSidebar && (
        <aside className="hidden md:block w-64 bg-card border-r border-line">
          {/* Sidebar content */}
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header будет добавлен в следующем этапе */}
        {showHeader && (
          <header className="bg-card border-b border-line">{/* Header content */}</header>
        )}

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
