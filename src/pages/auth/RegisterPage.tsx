// src/pages/auth/RegisterPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RegisterForm } from '@/features/auth/components/RegisterForm'; // Import the new component

const RegisterPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="mx-auto grid w-[380px] gap-6"> {/* Slightly wider for more fields */}
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">{t('registerTitle', { ns: 'auth' })}</h1>
        <p className="text-balance text-muted-foreground">
          {t('registerDescription', { ns: 'auth' })}
        </p>
      </div>

      <RegisterForm /> {/* Use the extracted form component */}

      {/* "Already have an account" link removed as per earlier request. Can be re-added: */}
      {/* <div className="mt-4 text-center text-sm">
        {t('alreadyHaveAccount', { ns: 'auth' })}{" "}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          {t('login', { ns: 'common' })}
        </Link>
      </div> */}
    </div>
  );
};
export default RegisterPage;