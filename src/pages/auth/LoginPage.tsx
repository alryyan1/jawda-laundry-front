// src/pages/auth/LoginPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import settingService from '@/services/settingService';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ChefHat, MapPin } from 'lucide-react';
import { FloatingElement, GlowElement } from '@/components/ui/animated-elements';

const LoginPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto grid w-full max-w-sm gap-4 animate-fade-in">
      {/* Enhanced Header with Restaurant Branding */}
      <div className="grid gap-2 text-center animate-slide-up">
        <FloatingElement delay={0.2}>
          <div className="flex justify-center mb-1">
            <GlowElement color="orange">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-full">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
              </div>
            </GlowElement>
          </div>
        </FloatingElement>
        {settings?.company_name && (
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {settings.company_name}
          </h2>
        )}
        {settings?.company_address && (
          <p className="flex items-center justify-center gap-2 text-sm sm:text-base text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{settings.company_address}</span>
          </p>
        )}
      </div>

   
      {/* Login Form */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <LoginForm />
        
        {/* Additional Restaurant Info */}
        
      </div>
    </div>
  );
};

export default LoginPage;