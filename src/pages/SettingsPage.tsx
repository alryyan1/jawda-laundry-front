// src/pages/SettingsPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings as SettingsIcon, Palette } from "lucide-react"; // Example icons

// Import sub-components for each settings tab
import { ProfileSettings } from "@/features/settings/components/ProfileSettings";
import { AccountSettings } from "@/features/settings/components/AccountSettings";
import { AppearanceSettings } from "@/features/settings/components/AppearanceSettings";

const SettingsPage: React.FC = () => {
  const { t } = useTranslation(["common", "settings"]);

  const settingTabs = [
    {
      value: "profile",
      labelKey: "profile",
      icon: User,
      component: <ProfileSettings />,
    },
    {
      value: "account",
      labelKey: "account",
      icon: SettingsIcon,
      component: <AccountSettings />,
    },
    {
      value: "appearance",
      labelKey: "appearance",
      icon: Palette,
      component: <AppearanceSettings />,
    },
    // Add admin-only tabs here with a role check
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("settingsPageTitle", { ns: "settings" })}
        description={t("manageYourSettings", { ns: "settings" })}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          {settingTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="py-2.5">
              <tab.icon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {t(tab.labelKey, { ns: "settings" })}
            </TabsTrigger>
          ))}
        </TabsList>

        {settingTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
