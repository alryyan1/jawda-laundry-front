// src/features/auth/components/RegisterForm.tsx
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

import { registerUser, type AuthResponse } from '@/api/authService';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  name: z.string().nonempty({ message: "validation.nameRequired" }).min(2, { message: "validation.nameMin" }),
  email: z.string().nonempty({ message: "validation.emailRequired" }).email({ message: "validation.emailInvalid" }),
  password: z.string().nonempty({ message: "validation.passwordRequired" }).min(8, { message: "validation.passwordMin" }),
  password_confirmation: z.string().nonempty({ message: "validation.passwordConfirmationRequired" }),
}).refine(data => data.password === data.password_confirmation, {
  message: "validation.passwordsDoNotMatch",
  path: ["password_confirmation"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
    onRegisterSuccess?: (data: AuthResponse) => void; // Optional callback
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore(); // Use login to set token and user after registration
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const authResponse = await registerUser(data);
      if (authResponse.token && authResponse.user) {
        storeLogin(authResponse.token, authResponse.user); // Log in the user immediately
        toast.success(t('registrationSuccess', { ns: 'auth' }));
        if (onRegisterSuccess) {
            onRegisterSuccess(authResponse);
        } else {
            navigate('/'); // Default navigation
        }
      } else {
        throw new Error(t('error.tokenOrUserMissing', { ns: 'common' }));
      }
    } catch (error: any) {
      let errorMessage = t('registrationFailed', { ns: 'auth' });
      if (error.response?.data?.errors) {
        const laravelErrors = error.response.data.errors;
        const firstErrorKey = Object.keys(laravelErrors)[0];
        if (firstErrorKey && laravelErrors[firstErrorKey][0]) {
            errorMessage = laravelErrors[firstErrorKey][0];
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="register-name">{t('name', { ns: 'common' })}</Label>
        <Input id="register-name" placeholder={t('namePlaceholder', {ns:'auth', defaultValue:'John Doe'})} {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{t(errors.name.message as string)}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="register-email">{t('email', { ns: 'common' })}</Label>
        <Input id="register-email" type="email" placeholder="m@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{t(errors.email.message as string)}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="register-password">{t('password', { ns: 'common' })}</Label>
        <div className="relative">
            <Input id="register-password" type={showPassword ? "text" : "password"} {...register('password')} />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-1 rtl:right-auto" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{t(errors.password.message as string)}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="register-password-confirmation">{t('confirmPassword', { ns: 'common' })}</Label>
         <div className="relative">
            <Input id="register-password-confirmation" type={showConfirmPassword ? "text" : "password"} {...register('password_confirmation')} />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-1 rtl:right-auto" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
        {errors.password_confirmation && <p className="text-xs text-destructive">{t(errors.password_confirmation.message as string)}</p>}
      </div>

      <Button type="submit" className="w-full h-10 text-sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
        {isSubmitting ? t('registering', { ns: 'auth' }) : t('signUp', { ns: 'auth' })}
      </Button>
    </form>
  );
};