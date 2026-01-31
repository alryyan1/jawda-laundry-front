import { Outlet } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { useTranslation } from "react-i18next";
import { Shirt, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import settingService from "@/services/settingService";
import AppIcon from "@/components/ui/app-icon";

const AuthLayout = () => {
  const { t } = useTranslation("common");

  // Fetch settings for app branding
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="w-full h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Left Side - Visual Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 text-white bg-zinc-900 border-r border-zinc-900">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/assets/back.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 z-0 bg-zinc-900/60 backdrop-blur-[2px]" />

        {/* Content over background */}
        <div className="relative z-10 flex items-center font-medium text-lg gap-2">
          <AppIcon
            iconUrl={settings?.company_logo_url}
            className="h-8 w-8 text-white"
            fallbackIcon={Shirt}
          />
          <span>{settings?.app_name || t("appName")}</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
            {settings?.app_description || "Professional Laundry Management"}
          </h2>
          <div className="space-y-4 text-zinc-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <p>{t("Effortless POS & Order Tracking")}</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <p>{t("Inventory & Customer Management")}</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <p>{t("Real-time Reports & Analytics")}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-400">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Streamline your operations and deliver excellence with
              every order.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="relative flex flex-col items-center justify-center p-6 lg:p-10 bg-background">
        {/* Mobile Branding */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2 font-bold text-lg">
          <AppIcon
            iconUrl={settings?.company_logo_url}
            className="h-6 w-6"
            fallbackIcon={Shirt}
          />
          <span>{settings?.app_name || t("appName")}</span>
        </div>

        <div className="absolute top-6 right-6">
          <ModeToggle />
        </div>

        <div className="w-full max-w-[400px] flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("welcomeBack", { defaultValue: "Welcome Back" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("enterCredentials", {
                defaultValue: "Enter your credentials to access your account",
              })}
            </p>
          </div>

          <Outlet />

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking login, you agree to our{" "}
            <span className="underline underline-offset-4 hover:text-primary pointer-events-none cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline underline-offset-4 hover:text-primary pointer-events-none cursor-pointer">
              Privacy Policy
            </span>
            .
          </p>
        </div>

        <footer className="absolute bottom-6 w-full text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} {settings?.app_name || t("appName")}
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
