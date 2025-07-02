// src/features/settings/components/WhatsAppSettings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { SettingsFormData } from '@/types';

export const WhatsAppSettings: React.FC = () => {
    const { t } = useTranslation(['settings', 'common', 'validation']);
    const { register, formState: { errors } } = useFormContext<SettingsFormData>();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('whatsappSettingsTitle')}</CardTitle>
                <CardDescription>{t('whatsappSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-1.5">
                    <Label htmlFor="whatsapp.api_url">{t('apiUrl')}</Label>
                    <Input id="whatsapp.api_url" type="url" {...register('whatsapp.api_url')} />
                    {errors.whatsapp?.api_url && <p className="text-sm text-destructive">{t(errors.whatsapp.api_url.message as string)}</p>}
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="whatsapp.instance_id">{t('instanceId')}</Label>
                    <Input id="whatsapp.instance_id" {...register('whatsapp.instance_id')} />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="whatsapp.api_token">{t('apiToken')}</Label>
                    <Input id="whatsapp.api_token" type="password" {...register('whatsapp.api_token')} />
                </div>
            </CardContent>
        </Card>
    );
};