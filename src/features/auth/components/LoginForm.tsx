// src/features/auth/components/LoginForm.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { loginUser } from '@/api/authService';
import type { AuthResponse } from '@/api/authService';
import { useAuthStore } from '@/store/authStore';

// Zod schema using translation keys for messages
const loginSchema = z.object({
  email: z.string().nonempty({ message: "validation.emailRequired" }).email({ message: "validation.emailInvalid" }),
  password: z.string().nonempty({ message: "validation.passwordRequired" }).min(8, { message: "validation.passwordMin" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onLoginSuccess?: (data: AuthResponse) => void; // Optional callback
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const authResponse = await loginUser(data);
      if (authResponse.token && authResponse.user) {
        storeLogin(authResponse.token, authResponse.user);
        toast.success(t('loginSuccess', { ns: 'auth' }));
        if (onLoginSuccess) {
            onLoginSuccess(authResponse);
        } else {
            navigate('/'); // Default navigation
        }
      } else {
        throw new Error(t('error.tokenOrUserMissing', { ns: 'common' }));
      }
    } catch (error: unknown) {
      let backendError: string | undefined;
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { errors?: { email?: string[] }, message?: string } } };
        backendError = err.response?.data?.errors?.email?.[0] || err.response?.data?.message;
      }
      toast.error(backendError || t('loginFailed', { ns: 'auth' }));
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="login-email">{t('email', { ns: 'common' })}</Label>
        <Input
          id="login-email"
          type="email"
          placeholder={t('emailPlaceholder', { ns: 'auth', defaultValue: 'name@example.com' })}
          {...register('email')}
          aria-invalid={errors.email ? "true" : "false"}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-xs text-destructive" role="alert">{t(errors.email.message as string)}</p>}
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center">
            <Label htmlFor="login-password">{t('password', { ns: 'common' })}</Label>
            {/* "Forgot Password" link removed as per earlier request, can be re-added here if needed */}
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder={t('passwordPlaceholder', { ns: 'auth', defaultValue: 'Enter your password' })}
            {...register('password')}
            aria-invalid={errors.password ? "true" : "false"}
            className={errors.password ? "border-destructive" : ""}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-1 rtl:right-auto"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t('hidePassword', { ns: 'auth' }) : t('showPassword', { ns: 'auth' })}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.password && <p className="text-xs text-destructive" role="alert">{t(errors.password.message as string)}</p>}
      </div>

      <Button type="submit" className="w-full h-10 text-sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
        {isSubmitting ? t('loggingIn', { ns: 'auth' }) : t('login', { ns: 'common' })}
      </Button>
    </form>
  );
};