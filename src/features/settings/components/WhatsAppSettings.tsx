// src/features/settings/components/WhatsAppSettings.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { Loader2, Send, Bot } from "lucide-react";

import type { SettingsFormValues } from "@/pages/admin/SettingsPage";
import settingService from "@/services/settingService";
import { Label } from "@/components/ui/label";

export const WhatsAppSettings: React.FC = () => {
  const { t } = useTranslation(["settings", "common"]);
  const { control, watch, setValue } = useFormContext<SettingsFormValues>();

  const [testPhone, setTestPhone] = useState("");

  const testMutation = useMutation<{ message: string }, Error, string>({
    mutationFn: settingService.sendTestWhatsappMessage,
    onSuccess: (data) => {
      toast.success(t("testMessageSentSuccess"), { description: data.message });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const details = (error as { response?: { data?: { details?: { message?: string } } } })?.response?.data?.details?.message || errorMessage;
      toast.error(t("testMessageSentFailed"), { description: details });
    },
  });

  const handleSendTest = () => {
    if (!testPhone) {
      toast.error(t("pleaseEnterTestPhoneNumber"));
      return;
    }
    testMutation.mutate(testPhone);
  };

  // Watch the enabled field to conditionally show other fields
  const isWhatsAppEnabled = watch("whatsapp_enabled");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-green-600" />
            {t("whatsappApiSettingsTitle")}
          </CardTitle>
          <CardDescription>
            {t("whatsappApiSettingsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="whatsapp_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("enableWhatsAppNotifications")}
                  </FormLabel>
                  <FormDescription>
                    {t("enableWhatsAppNotificationsHint")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isWhatsAppEnabled && (
            <div className="space-y-4 pt-4 border-t">
              {/* UltraMsg Configuration */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {t("ultraMsgInfo", { defaultValue: "Using UltraMsg WhatsApp API" })}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {t("ultraMsgDescription", { defaultValue: "This system uses UltraMsg API for WhatsApp messaging. Please configure your UltraMsg credentials below." })}
                  </p>
                </div>

                <FormField
                  control={control}
                  name="ultramsg_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("ultramsgToken", { defaultValue: "UltraMsg Token" })}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          value={field.value || ""}
                          placeholder="b6ght2y2ff7rbha6"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("ultramsgTokenHint", { defaultValue: "Your UltraMsg API token" })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="ultramsg_instance_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("ultramsgInstanceId", { defaultValue: "UltraMsg Instance ID" })}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="instance139458"
                        />
                      </FormControl>
                      <FormDescription>
                        {t("ultramsgInstanceIdHint", { defaultValue: "Your UltraMsg instance ID" })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="whatsapp_notification_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("notificationNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="98889761"
                        />
                      </FormControl>
                      <FormDescription>{t("notificationNumberHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="whatsapp_country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("countryCode")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="968"
                        />
                      </FormControl>
                      <FormDescription>{t("countryCodeHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isWhatsAppEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>{t("sendTestMessageTitle")}</CardTitle>
            <CardDescription>{t("sendTestMessageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="test-phone">{t("testPhoneNumberLabel")}</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                id="test-phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder={t("testPhoneNumberPlaceholder")}
                disabled={testMutation.isPending}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleSendTest}
                disabled={testMutation.isPending}
                aria-label={t("sendTestMessageTitle")}
              >
                {testMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("testPhoneNumberHint")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
