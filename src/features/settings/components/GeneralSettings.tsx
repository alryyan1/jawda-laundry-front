// src/features/settings/components/GeneralSettings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { SettingsFormData } from '@/types';

export const GeneralSettings: React.FC = () => {
    const { t } = useTranslation(['settings', 'common', 'validation']);
    const { register, watch, formState: { errors } } = useFormContext<SettingsFormData>();

    const currencyOptions = ['USD', 'EUR', 'SAR', 'INR']; // Example currencies

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('generalSettingsTitle')}</CardTitle>
                <CardDescription>{t('generalSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-1.5">
                    <Label htmlFor="general.company_name">{t('companyName')}</Label>
                    <Input id="general.company_name" {...register('general.company_name')} />
                    {errors.general?.company_name && <p className="text-sm text-destructive">{t(errors.general.company_name.message as string)}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="grid gap-1.5">
                        <Label htmlFor="general.company_phone">{t('companyPhone')}</Label>
                        <Input id="general.company_phone" {...register('general.company_phone')} />
                    </div>
                     <div className="grid gap-1.5">
                        <Label htmlFor="general.default_currency">{t('defaultCurrency')}</Label>
                        <Select onValueChange={(value) => register('general.default_currency').onChange({ target: { value } })} defaultValue={watch('general.default_currency')}>
                            <SelectTrigger><SelectValue placeholder={t('selectCurrency')} /></SelectTrigger>
                            <SelectContent>{currencyOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="general.company_address">{t('companyAddress')}</Label>
                    <Textarea id="general.company_address" {...register('general.company_address')} rows={3}/>
                </div>
            </CardContent>
        </Card>
    );
};