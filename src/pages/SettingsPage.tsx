// src/pages/SettingsPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ModeToggle } from "@/components/mode-toggle"; // If placing here instead of MainLayout

const SettingsPage: React.FC = () => {
  const { t } = useTranslation(["common", "settings", "auth"]);
  const { user } = useAuthStore(); // Assuming user object is populated

  // TODO: Implement form handling and mutation for updating profile

  return (
    <div>
      <PageHeader
        title={t("settings", { ns: "common" })}
        description={t("manageYourSettings", {
          ns: "settings",
          defaultValue: "Manage your account and application settings.",
        })}
      />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[1fr_300px]">
        {" "}
        {/* Main content and sidebar layout */}
        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("profileInformation", { ns: "settings" })}
              </CardTitle>
              <CardDescription>
                {t("updateYourProfile", { ns: "settings" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={user?.avatar_url || "/placeholder-user.jpg"}
                    alt={user?.name}
                  />
                  <AvatarFallback>
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                {/* <Button variant="outline" size="sm">{t('changeAvatar', {ns:'settings'})}</Button> */}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="name">{t("name", { ns: "common" })}</Label>
                <Input
                  id="name"
                  defaultValue={user?.name || ""}
                  disabled
                />{" "}
                {/* Make editable later */}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">{t("email", { ns: "common" })}</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                />
              </div>
              {/* TODO: Add "Change Password" section */}
              {/* <Button disabled>{t('updateProfileBtn', {ns:'settings'})}</Button> */}
            </CardContent>
          </Card>

          {/* Application Settings Card (Example) */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("applicationSettings", { ns: "settings" })}
              </CardTitle>
              <CardDescription>
                {t("customizeAppExperience", { ns: "settings" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="flex flex-col space-y-1">
                  <span>{t("theme", { ns: "common" })}</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    {t("selectThemeDescription", {
                      ns: "settings",
                      defaultValue:
                        "Adjust the look and feel of the application.",
                    })}
                  </span>
                </Label>
                <ModeToggle />
              </div>
              {/* TODO: Add language preference selector here */}
              {/* TODO: Add default currency selector, notification preferences etc. */}
            </CardContent>
          </Card>
        </div>
        {/* Optional Sidebar for settings navigation if it gets complex */}
        {/* <aside className="space-y-4">
            <h3 className="font-semibold">{t('settingsNavigation', {ns:'settings'})}</h3>
            <nav className="flex flex-col">
                <Button variant="ghost" className="justify-start">Profile</Button>
                <Button variant="ghost" className="justify-start">Appearance</Button>
                <Button variant="ghost" className="justify-start">Notifications</Button>
            </nav>
        </aside> */}
      </div>
    </div>
  );
};

export default SettingsPage;
