// src/pages/SettingsPage.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Loader2, User, Building, MessageSquare, Palette, Shield } from 'lucide-react';

// Import the tab components we will create in the next steps
import { ProfileSettings } from '@/features/settings/components/ProfileSettings';
import { AccountSettings } from '@/features/settings/components/AccountSettings';
import { GeneralSettings } from '@/features/settings/components/GeneralSettings';
import { WhatsAppSettings } from '@/features/settings/components/WhatsAppSettings';
import { AppearanceSettings } from '@/features/settings/components/AppearanceSettings';


import type { SettingsFormData, ApplicationSettings } from '@/types';
import { getApplicationSettings, updateApplicationSettings } from '@/api/settingsService';
import { useAuth } from '@/features/auth/hooks/useAuth';

// A comprehensive Zod schema for all editable settings
const settingsSchema = z.object({
    general: z.object({
        company_name: z.string().optional(),
        company_address: z.string().optional(),
        company_phone: z.string().optional(),
        default_currency: z.string().optional(),
    }),
    whatsapp: z.object({
        api_url: z.string().url({message: "validation.invalidUrl"}).optional().or(z.literal('')),
        instance_id: z.string().optional(),
        api_token: z.string().optional(),
    }),
});

const SettingsPage: React.FC = () => {
    const { t } = useTranslation(['common', 'settings', 'admin', 'validation']);
    const { can } = useAuth();
    const queryClient = useQueryClient();

    // Fetch existing application-wide settings (only if user is admin)
    const { data: settings, isLoading } = useQuery<ApplicationSettings, Error>({
        queryKey: ['applicationSettings'],
        queryFn: getApplicationSettings,
        enabled: can('settings:manage-application'), // Only admins fetch this data
    });

    const methods = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: { // Set defaults to prevent uncontrolled component warnings
            general: { company_name: '', company_address: '', company_phone: '', default_currency: 'USD' },
            whatsapp: { api_url: '', instance_id: '', api_token: '' },
        }
    });
    const { handleSubmit, reset, formState: { isDirty, isSubmitting }, getValues } = methods;

    // Pre-fill form when settings data is loaded
    useEffect(() => {
        if (settings) {
            reset(settings);
        }
    }, [settings, reset]);

    const mutation = useMutation<{ message: string }, Error, SettingsFormData>({
        mutationFn: updateApplicationSettings,
        onSuccess: () => {
            toast.success(t('settingsUpdatedSuccess', {ns: 'settings'}));
            queryClient.invalidateQueries({queryKey: ['applicationSettings']});
            // Reset form with the just-submitted values to clear the 'isDirty' state
            reset(getValues());
        },
        onError: (error) => {
            toast.error(error.message || t('settingsUpdateFailed', {ns: 'settings'}));
        }
    });

    const onSubmit = (data: SettingsFormData) => {
        mutation.mutate(data);
    };
    
    const settingTabs = [
        { value: "profile", labelKey: "profile", icon: User, component: <ProfileSettings />, permission: 'settings:view-profile' },
        { value: "account", labelKey: "account", icon: Shield, component: <AccountSettings />, permission: 'settings:change-password' },
        { value: "appearance", labelKey: "appearance", icon: Palette, component: <AppearanceSettings />, permission: null }, // Everyone can see
        { value: "general", labelKey: "general", icon: Building, component: <GeneralSettings />, permission: 'settings:manage-application' },
        { value: "whatsapp", labelKey: "whatsapp", icon: MessageSquare, component: <WhatsAppSettings />, permission: 'settings:manage-application' },
    ];

    const visibleTabs = settingTabs.filter(tab => !tab.permission || can(tab.permission));

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <PageHeader
                    title={t('settingsPageTitle', { ns: 'settings' })}
                    description={t('manageYourSettings', { ns: 'settings' })}
                >
                    {/* The Save button is in the header, affects all tabs */}
                    <Button type="submit" disabled={!isDirty || isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('saveAllSettings', {ns: 'settings', defaultValue: 'Save All Settings'})}
                    </Button>
                </PageHeader>
                
                {isLoading && can('settings:manage-application') ? (
                    <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                ) : (
                    <Tabs defaultValue={visibleTabs[0]?.value || "profile"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
                            {visibleTabs.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value} className="py-2.5">
                                    <tab.icon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                                    {t(tab.labelKey, { ns: 'settings' })}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {visibleTabs.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value} className="mt-6">
                                {tab.component}
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </form>
        </FormProvider>
    );
};

export default SettingsPage;