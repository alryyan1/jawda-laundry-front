// src/pages/SettingsPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'; // NavLink and Outlet for nested routing
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader'; // Optional, or a simpler header
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { User, Lock, Palette, Users, SlidersHorizontal, ShieldCheck } from 'lucide-react'; // Icons
import { useAuth } from '@/features/auth/hooks/useAuth'; // To check roles

interface SettingsNavItem {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  exact?: boolean; // For NavLink active matching
}

const SettingsPage: React.FC = () => {
  const { t } = useTranslation(['settings', 'common', 'admin']);
  const location = useLocation();
  const { user, isAdmin } = useAuth(); // Get user and admin status

  const settingsNavItems: SettingsNavItem[] = [
    { to: "/settings/profile", labelKey: "profile", icon: User, exact: true },
    { to: "/settings/account", labelKey: "accountSecurity", icon: Lock },
    { to: "/settings/appearance", labelKey: "appearance", icon: Palette },
    { to: "/admin/users", labelKey: "userManagement", icon: Users, adminOnly: true }, // Links to existing admin page
    { to: "/admin/roles", labelKey: "roleManagement", icon: ShieldCheck, adminOnly: true }, // Links to future admin page
    { to: "/settings/application", labelKey: "applicationAdmin", icon: SlidersHorizontal, adminOnly: true },
  ];

  const visibleNavItems = settingsNavItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin));

  // If the base /settings path is hit, redirect to the first available settings section
  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    if (visibleNavItems.length > 0) {
      return <Navigate to={visibleNavItems[0].to} replace />;
    }
    // If no items are visible (should not happen if profile is always there), show a message or redirect
    return <Navigate to="/" replace />; // Fallback to dashboard
  }


  return (
    <div className="max-w-6xl mx-auto"> {/* Wider for two-column layout */}
      {/* Removed PageHeader from here, title is part of the layout now */}
      {/* <PageHeader
        title={t('settingsPageTitle')}
        description={t('manageYourSettings')}
      /> */}

      <div className="space-y-6 py-2 pb-16 md:block"> {/* Adjusted padding */}
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{t('settingsPageTitle')}</h2>
          <p className="text-muted-foreground">
            {t('manageYourSettings')}
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 rtl:lg:space-x-reverse lg:space-y-0">
          <aside className="lg:w-1/5">
            <nav className="flex flex-col space-y-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact} // Important for exact matching on parent routes
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      isActive ? "bg-accent text-accent-foreground" : "transparent"
                    )
                  }
                >
                  <item.icon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 flex-shrink-0" aria-hidden="true" />
                  <span>{t(item.labelKey, { ns: item.adminOnly ? 'admin' : 'settings' })}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
          <div className="flex-1 lg:max-w-4xl">
            {/* Outlet will render the component for the matched nested route */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;