// src/pages/admin/SettingsPage.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Loader2, Building, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Import the tab components
import { GeneralSettings } from '@/features/settings/components/GeneralSettings';
import { WhatsAppSettings } from '@/features/settings/components/WhatsAppSettings';

import type { SettingsFormData, ApplicationSettings } from '@/types';
import { getApplicationSettings, updateApplicationSettings } from '@/api/settingsService';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Zod schema for the entire settings form
const settingsSchema = z.object({
    general: z.object({
        company_name: z.string().optional().or(z.literal('')),
        company_address: z.string().optional().or(z.literal('')),
        company_phone: z.string().optional().or(z.literal('')),
        currency_symbol: z.string().optional(),
    }).optional(),
    whatsapp: z.object({
        api_url: z.string().url({message: "validation.invalidUrl"}).optional().or(z.literal('')),
        api_token: z.string().optional(),
        enabled: z.boolean().optional(),
    }).optional(),
});

const SettingsPage: React.FC = () => {
  const { t } = useTranslation(['common', 'settings', 'admin', 'validation']);
  const { can } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if user doesn't have permission
  if (!can('settings:manage-application')) {
    navigate('/');
    return null;
  }

  const { data: settings, isLoading } = useQuery<ApplicationSettings, Error>({
    queryKey: ['applicationSettings'],
    queryFn: getApplicationSettings,
  });

  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        general: {},
        whatsapp: {},
    }
  });
  const { handleSubmit, reset, formState: { isDirty, isSubmitting }, getValues } = methods;

  useEffect(() => {
    if (settings && !isLoading) {
        console.log('Resetting form with settings:', settings);
        reset(settings, { keepDefaultValues: false });
    }
  }, [settings, reset, isLoading]);

  const mutation = useMutation<any, Error, SettingsFormData>({
    mutationFn: (data) => {
        return updateApplicationSettings(data);
    },
    onSuccess: () => {
        toast.success(t('settingsUpdatedSuccess', {ns: 'settings'}));
        queryClient.invalidateQueries({queryKey: ['applicationSettings']});
        reset(getValues());
    },
    onError: (error) => {
        toast.error(error.message || t('settingsUpdateFailed', {ns: 'settings'}));
    }
  });

  return (
    <FormProvider {...methods}>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <PageHeader
                title={t('applicationSettings', { ns: 'settings' })}
                description={t('manageGlobalSettings', { ns: 'settings' })}
            >
                <Button type="submit" disabled={!isDirty || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('saveAllSettings', {ns: 'settings'})}
                </Button>
            </PageHeader>
            
            {isLoading ? (
                <div className="space-y-6 mt-6">
                    <Skeleton className="h-10 w-full max-w-sm" />
                    <Skeleton className="h-96 w-full" />
                </div>
            ) : (
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="general"><Building className="mr-2 h-4 w-4"/>{t('general', {ns:'settings'})}</TabsTrigger>
                        <TabsTrigger value="whatsapp"><MessageSquare className="mr-2 h-4 w-4"/>{t('whatsapp', {ns:'settings'})}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general"><GeneralSettings /></TabsContent>
                    <TabsContent value="whatsapp"><WhatsAppSettings /></TabsContent>
                </Tabs>
            )}
        </form>
    </FormProvider>
  );
};

export default SettingsPage;