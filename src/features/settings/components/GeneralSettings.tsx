// src/features/settings/components/GeneralSettings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import type { SettingsFormData } from '@/types';

export const GeneralSettings: React.FC = () => {
    const { t } = useTranslation(['settings', 'common', 'validation']);
    const { control } = useFormContext<SettingsFormData>();

    const currencyOptions = ['USD', 'EUR', 'SAR', 'INR', '$', '€', '₹', 'ر.س']; // Example currencies

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('generalSettingsTitle')}</CardTitle>
                <CardDescription>{t('generalSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={control}
                    name="general.company_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('companyName')}</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="general.company_phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('companyPhone')}</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="general.currency_symbol"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('currencySymbol')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectCurrency')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {currencyOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={control}
                    name="general.company_address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('companyAddress')}</FormLabel>
                            <FormControl>
                                <Textarea {...field} value={field.value || ""} rows={3} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
};