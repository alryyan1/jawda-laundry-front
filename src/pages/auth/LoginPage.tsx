// src/pages/auth/LoginPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { ChefHat, Utensils, Clock, Star } from 'lucide-react';
import { FloatingElement, GlowElement } from '@/components/ui/animated-elements';

const LoginPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="mx-auto grid w-full max-w-md gap-8 animate-fade-in">
      {/* Enhanced Header with Restaurant Branding */}
      <div className="grid gap-4 text-center animate-slide-up">
        <FloatingElement delay={0.2}>
          <div className="flex justify-center mb-2">
            <GlowElement color="orange">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-full">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
              </div>
            </GlowElement>
          </div>
        </FloatingElement>
        
  
      </div>

   
      {/* Login Form */}
      <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <LoginForm />
        
        {/* Additional Restaurant Info */}
        
      </div>
    </div>
  );
};

export default LoginPage;