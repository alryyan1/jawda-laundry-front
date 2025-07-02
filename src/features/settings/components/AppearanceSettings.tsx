// src/features/settings/components/AppearanceSettings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/components/theme-provider'; // Import your theme context hook

export const AppearanceSettings: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('appearanceSettingsTitle', { ns: 'settings' })}</CardTitle>
        <CardDescription>{t('appearanceSettingsDescription', { ns: 'settings' })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base">{t('theme', { ns: 'common' })}</Label>
          <p className="text-sm text-muted-foreground">
            {t('selectThemeDescription', { ns: 'settings' })}
          </p>
        </div>

        {/* Use RadioGroup for a better theme selection experience */}
        <RadioGroup
          defaultValue={theme}
          onValueChange={setTheme}
          className="grid max-w-md grid-cols-1 sm:grid-cols-3 gap-8 pt-2"
        >
          {/* Light Theme Option */}
          <div>
            <RadioGroupItem value="light" id="light" className="sr-only" />
            <Label
              htmlFor="light"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <div className="mb-2 flex w-full items-center justify-between">
                <span className="font-semibold">{t('themeLight', { ns: 'common' })}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                  {theme === 'light' && <div className="h-2.5 w-2.5 rounded-full bg-current" />}
                </span>
              </div>
              <div className="w-full rounded-md border bg-white p-2 shadow-sm">
                <div className="space-y-2 rounded-sm bg-slate-100 p-2">
                  <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-2 w-4/5 rounded-lg bg-slate-300" />
                    <div className="h-2 w-full rounded-lg bg-slate-300" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-300" />
                    <div className="h-2 w-full rounded-lg bg-slate-300" />
                  </div>
                </div>
              </div>
            </Label>
          </div>

          {/* Dark Theme Option */}
          <div>
            <RadioGroupItem value="dark" id="dark" className="sr-only" />
            <Label
              htmlFor="dark"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <div className="mb-2 flex w-full items-center justify-between">
                <span className="font-semibold">{t('themeDark', { ns: 'common' })}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                  {theme === 'dark' && <div className="h-2.5 w-2.5 rounded-full bg-current" />}
                </span>
              </div>
              <div className="w-full rounded-md border bg-slate-900 p-2 shadow-sm">
                <div className="space-y-2 rounded-sm bg-slate-800 p-2">
                  <div className="space-y-2 rounded-md bg-slate-900 p-2 shadow-sm">
                    <div className="h-2 w-4/5 rounded-lg bg-slate-600" />
                    <div className="h-2 w-full rounded-lg bg-slate-600" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-slate-900 p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-600" />
                    <div className="h-2 w-full rounded-lg bg-slate-600" />
                  </div>
                </div>
              </div>
            </Label>
          </div>
          
          {/* System Theme Option */}
           <div>
            <RadioGroupItem value="system" id="system" className="sr-only" />
            <Label
              htmlFor="system"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <div className="mb-2 flex w-full items-center justify-between">
                <span className="font-semibold">{t('themeSystem', { ns: 'common' })}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                  {theme === 'system' && <div className="h-2.5 w-2.5 rounded-full bg-current" />}
                </span>
              </div>
              <div className="w-full rounded-md border bg-white p-2 shadow-sm dark:bg-slate-900">
                <div className="space-y-2 rounded-sm bg-slate-100 p-2 dark:bg-slate-800">
                  <div className="space-y-2 rounded-md bg-white p-2 shadow-sm dark:bg-slate-900">
                    <div className="h-2 w-4/5 rounded-lg bg-slate-300 dark:bg-slate-600" />
                    <div className="h-2 w-full rounded-lg bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm dark:bg-slate-900">
                    <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="h-2 w-full rounded-lg bg-slate-300 dark:bg-slate-600" />
                  </div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};