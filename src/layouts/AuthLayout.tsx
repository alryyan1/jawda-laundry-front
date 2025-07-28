// src/layouts/AuthLayout.tsx
import { Outlet } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle';
import { useTranslation } from 'react-i18next';
import { Shirt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import settingService from '@/services/settingService';
import AppIcon from '@/components/ui/app-icon';

const AuthLayout = () => {
  const { t } = useTranslation('common');
  
  // Fetch settings for app branding
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative"
      style={{
        backgroundImage: 'url(/assets/back.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Top-right utilities */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        {/* LanguageSwitcher could go here if needed and styled minimally */}
        <ModeToggle />
      </div>

      {/* Main content area for the form */}
      <div className="w-full max-w-md bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-lg"> {/* Constrain width of the form container */}
        {/* Branding - Centered above the form */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-2">
            <AppIcon 
              iconUrl={settings?.company_logo_url} 
              className="h-8 w-8" 
              fallbackIcon={Shirt}
            />
            <h1 className="text-3xl font-bold tracking-tight">
              {settings?.app_name || t('appName')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {settings?.app_description || t('appSubtitle', { ns: 'auth', defaultValue: 'LAUNDRY MANAGEMENT SYSTEM' })}
          </p>
        </div>

        <Outlet /> {/* This is where LoginPage will render */}
      </div>

      {/* Optional: Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-muted-foreground w-full">
        © {new Date().getFullYear()} {settings?.app_name || t('appName')}. {t('allRightsReserved', { ns: 'common' })}
      </footer>
    </div>
  );
};
export default AuthLayout;