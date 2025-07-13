import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import type { AppSettings } from "@/services/settingService";
import { toast } from "sonner";

// shadcn/ui & Lucide Icons
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  MessageSquare,
  AlertCircle,
  Save,
  TestTube,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/api/apiClient";

// WhatsApp settings schema
const whatsappSettingsSchema = z.object({
  whatsapp_enabled: z.boolean(),
  whatsapp_api_url: z.string().url({ message: "validation:url" }).or(z.literal("")),
  whatsapp_api_token: z.string().min(1, { message: "validation:required" }).or(z.literal("")),
  whatsapp_notification_number: z.string().regex(/^[0-9]+$/, { message: "validation:phoneNumber" }).or(z.literal("")),
  whatsapp_country_code: z.string().regex(/^[0-9]+$/, { message: "validation:countryCode" }).min(1, { message: "validation:required" }),
});

type WhatsAppSettingsFormValues = z.infer<typeof whatsappSettingsSchema>;

interface WhatsAppSettingsProps {
  settings: AppSettings | null;
  isLoadingSettings: boolean;
  updateSettings: (data: Partial<AppSettings>) => Promise<AppSettings | null>;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({
  settings,
  isLoadingSettings,
  updateSettings,
}) => {
  const { t } = useTranslation(["settings", "common", "validation"]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<WhatsAppSettingsFormValues>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: {
      whatsapp_enabled: false,
      whatsapp_api_url: "",
      whatsapp_api_token: "",
      whatsapp_notification_number: "",
      whatsapp_country_code: "968",
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
    watch,
    getValues,
  } = form;

  const whatsappEnabled = watch("whatsapp_enabled");

  // Reset form when settings change
  React.useEffect(() => {
    if (settings) {
      reset({
        whatsapp_enabled: settings.whatsapp_enabled || false,
        whatsapp_api_url: settings.whatsapp_api_url || "",
        whatsapp_api_token: settings.whatsapp_api_token || "",
        whatsapp_notification_number: settings.whatsapp_notification_number || "",
        whatsapp_country_code: settings.whatsapp_country_code || "968",
      });
    }
  }, [settings, reset]);

  const onSubmit: SubmitHandler<WhatsAppSettingsFormValues> = async (data) => {
    setServerError(null);

    try {
      await updateSettings(data);
      toast.success(t("settings:whatsappSettingsUpdated"));
    } catch (err) {
      console.error("Failed to update WhatsApp settings:", err);
      setServerError(t("settings:whatsappSettingsUpdateFailed"));
    }
  };

  const handleTestWhatsApp = async () => {
    const notificationNumber = getValues("whatsapp_notification_number");
    
    if (!notificationNumber) {
      toast.error(t("settings:pleaseEnterNotificationNumber"));
      return;
    }

    setIsTesting(true);
    try {
      await apiClient.post("/settings/whatsapp/send-test", {
        test_phone_number: notificationNumber,
      });

      toast.success(t("settings:testMessageSentSuccessfully"));
    } catch (error: unknown) {
      console.error("Test WhatsApp error:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message || t("settings:testMessageFailed")
        : t("settings:testMessageFailed");
      toast.error(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="dark:bg-gray-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>{t("settings:whatsappSettingsTitle")}</CardTitle>
        </div>
        <CardDescription>{t("settings:whatsappSettingsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && !isSubmitting && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("common:error")}</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Enable/Disable WhatsApp */}
            <FormField
              control={form.control}
              name="whatsapp_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("settings:enableWhatsApp")}
                    </FormLabel>
                    <FormDescription>
                      {t("settings:enableWhatsAppDesc")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoadingSettings}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {whatsappEnabled && (
              <>
                <Separator />
                
                {/* API URL */}
                <FormField
                  control={form.control}
                  name="whatsapp_api_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings:whatsappApiUrl")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://api.whatsapp.com/v1"
                          type="url"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings:whatsappApiUrlDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* API Token */}
                <FormField
                  control={form.control}
                  name="whatsapp_api_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings:whatsappApiToken")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="your-api-token-here"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings:whatsappApiTokenDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notification Number */}
                <FormField
                  control={form.control}
                  name="whatsapp_notification_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings:whatsappNotificationNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="1234567890"
                          type="tel"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings:whatsappNotificationNumberDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country Code */}
                <FormField
                  control={form.control}
                  name="whatsapp_country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings:whatsappCountryCode")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="968"
                          type="tel"
                          maxLength={4}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("settings:whatsappCountryCodeDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Test Button */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWhatsApp}
                    disabled={isTesting }
                  >
                    {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <TestTube className="mr-2 h-4 w-4" />
                    {t("settings:testWhatsAppConnection")}
                  </Button>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || isLoadingSettings}
              >
                {isSubmitting && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                <Save className="me-2 h-4 w-4" />
                {t("common:saveChanges")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WhatsAppSettings; 