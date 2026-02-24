import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminNewSidebar } from './AdminNewSidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { DocumentHead } from '@/components/seo/DocumentHead';

interface AdminNewLayoutProps {
  children: React.ReactNode;
}

export function AdminNewLayout({ children }: AdminNewLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-new-sidebar-collapsed');
    return saved === 'true';
  });
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('admin-new-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead robots="noindex, nofollow" />
      <AdminNewSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {children}
      </div>
    </div>
  );
}
