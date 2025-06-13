// src/features/settings/components/AppearanceSettings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ModeToggle } from '@/components/mode-toggle'; // Re-use existing ModeToggle
// import { LanguageSwitcher } from '@/layouts/MainLayout'; // Or create a dedicated LanguageSelect component

// If you create a dedicated LanguageSelect component:
// import { LanguageSelect } from '@/components/shared/LanguageSelect';

export const AppearanceSettings: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('appearanceSettingsTitle')}</CardTitle>
        <CardDescription>{t('appearanceSettingsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">{t('theme', {ns:'common'})}</Label>
            <p className="text-sm text-muted-foreground">
              {t('selectThemeDescription')}
            </p>
          </div>
          <ModeToggle />
        </div>

        {/* Example: Language Preference (if not solely in header) */}
        {/* <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">{t('languagePreferenceTitle', {defaultValue: 'Language'})}</Label>
            <p className="text-sm text-muted-foreground">
                {t('languagePreferenceDescription', {defaultValue: 'Choose your preferred display language.'})}
            </p>
          </div>
          <LanguageSwitcher /> // Or your dedicated LanguageSelect component
        </div> */}
      </CardContent>
    </Card>
  );
};