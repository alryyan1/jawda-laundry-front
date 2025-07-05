// src/layouts/AuthLayout.tsx
import { Outlet } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle';
import { useTranslation } from 'react-i18next';
import { Shirt } from 'lucide-react';

const AuthLayout = () => {
  const { t } = useTranslation('common');

  return (
    <div 
      className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative"
      style={{
        backgroundImage: 'url(/assets/login-background.jpg)',
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
          <Shirt className="h-12 w-12 text-primary mb-3" /> {/* Larger icon */}
          <h1 className="text-3xl font-bold tracking-tight">
            {t('appName')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('appSubtitle', { ns: 'auth', defaultValue: 'Laundry Management System' })}
          </p>
        </div>

        <Outlet /> {/* This is where LoginPage will render */}
      </div>

      {/* Optional: Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-muted-foreground w-full">
        © {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved', { ns: 'common' })}
      </footer>
    </div>
  );
};
export default AuthLayout;