// src/pages/auth/LoginPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features/auth/components/LoginForm'; // Import the new component

const LoginPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="mx-auto grid w-[350px] gap-6">
      <div className="grid gap-2 text-center">
        {/* Branding is now primarily in AuthLayout */}
        <h1 className="text-3xl font-bold">{t('loginTitle', { ns: 'auth' })}</h1>
        <p className="text-balance text-muted-foreground">
          {t('loginDescription', { ns: 'auth' })}
        </p>
      </div>

      <LoginForm /> {/* Use the extracted form component */}

      {/* "Sign Up" link removed as per earlier request. Can be re-added: */}
      {/* <div className="mt-4 text-center text-sm">
        {t('dontHaveAccount', { ns: 'auth' })}{" "}
        <Link to="/auth/register" className="font-semibold text-primary hover:underline">
          {t('signUp', { ns: 'auth' })}
        </Link>
      </div> */}
    </div>
  );
};
export default LoginPage;