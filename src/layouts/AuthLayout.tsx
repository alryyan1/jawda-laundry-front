// src/layouts/AuthLayout.tsx
import { Outlet } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle';
import { useTranslation } from 'react-i18next';
import { Utensils, ChefHat } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import settingService from '@/services/settingService';
import AppIcon from '@/components/ui/app-icon';
import { FloatingElement, GlowElement } from '@/components/ui/animated-elements';

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
      className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={{
        backgroundImage: 'url(./assets/restaurant-bg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-red-900/10 to-yellow-900/20"></div>
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Decorative Elements */}
      <FloatingElement delay={0.5} className="absolute top-10 left-10 opacity-10">
        <ChefHat className="h-16 w-16 text-white" />
      </FloatingElement>
      <FloatingElement delay={1.5} className="absolute bottom-10 right-10 opacity-10">
        <Utensils className="h-16 w-16 text-white" />
      </FloatingElement>

      {/* Top-right utilities */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
        <ModeToggle />
      </div>

      {/* Main content area for the form */}
      <div className="relative z-10 w-full max-w-lg bg-background/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10 animate-fade-in">
        {/* Enhanced Branding - Centered above the form */}
        <div className="mb-8 flex flex-col items-center animate-slide-up">
          <div className="flex items-center space-x-3 mb-4">
            <FloatingElement delay={0.3}>
              <GlowElement color="orange">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl">
                    <AppIcon 
                      iconUrl={settings?.company_logo_url} 
                      className="h-10 w-10 text-white" 
                      fallbackIcon={ChefHat}
                    />
                  </div>
                </div>
              </GlowElement>
            </FloatingElement>
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {settings?.app_name || t('appName')}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Restaurant Management System
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {settings?.app_description || t('appSubtitle', { ns: 'auth', defaultValue: 'Streamline your restaurant operations with our comprehensive management platform' })}
          </p>
        </div>

        <Outlet /> {/* This is where LoginPage will render */}
      </div>

      {/* Enhanced Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-white/70 w-full z-10 animate-slide-up" style={{ animationDelay: '0.7s' }}>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-8 h-px bg-white/30"></div>
          <span>🍽️ Restaurant Excellence</span>
          <div className="w-8 h-px bg-white/30"></div>
        </div>
        <p>© {new Date().getFullYear()} {settings?.app_name || t('appName')}. {t('allRightsReserved', { ns: 'common' })}</p>
      </footer>
    </div>
  );
};

export default AuthLayout;