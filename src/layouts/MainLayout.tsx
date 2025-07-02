// src/layouts/MainLayout.tsx
import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

  import {
    Home,
    Package,
    Users,
    Settings as SettingsIcon,
    LogOut,
    Menu,
    Shirt,
    Layers,
    Box,
    Wand2,
    ChevronDown,
    ChevronRight,
    Languages,
    ShirtIcon,
    User2,
    Lock,
    DollarSign,
    ShoppingCart,
    FolderKanban,
    ChartBar,
  } from "lucide-react";

// MainLayout Component
const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "auth", "settings"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: storeLogout } = useAuthStore();

  const [isServiceAdminOpen, setIsServiceAdminOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post("/logout");
    } catch (error) {
      console.error(
        "Backend logout failed, proceeding with client-side logout:",
        error
      );
    } finally {
      storeLogout();
      toast.info(t("loggedOut", { ns: "auth" }));
      navigate("/auth/login");
    }
  };

  // --- User Navigation Dropdown ---
  const UserNav: React.FC = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.avatar_url || "/placeholder-user.jpg"}
              alt={user?.name || "User"}
            />
            <AvatarFallback>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || t("user", { ns: "common", defaultValue: "User" })}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email ||
                t("userEmailPlaceholder", {
                  ns: "auth",
                  defaultValue: "user@example.com",
                })}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <SettingsIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          <span>
            {t("profile", { ns: "settings", defaultValue: "Profile" })}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          <span>{t("logout", { ns: "common" })}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // --- Language Switcher Dropdown ---
  const LanguageSwitcher: React.FC = () => {
    const changeLanguage = (lng: string) => {
      i18n.changeLanguage(lng);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("changeLanguage", {
              ns: "common",
              defaultValue: "Change language",
            })}
          >
            <Languages className="h-[1.1rem] w-[1.1rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("selectLanguage", {
              ns: "common",
              defaultValue: "Select Language",
            })}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => changeLanguage("en")}
            disabled={i18n.language.startsWith("en")}
          >
            {t("languageEnglish", { ns: "common", defaultValue: "English" })}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => changeLanguage("ar")}
            disabled={i18n.language.startsWith("ar")}
          >
            {t("languageArabic", {
              ns: "common",
              defaultValue: "العربية (Arabic)",
            })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // --- Sidebar Navigation Structure (as defined before) ---
  const navItems = [
    /* ... your navItems array ... */
    { to: "/", labelKey: "dashboard", icon: Home, type: "link" as const },
    { to: "/orders", labelKey: "orders", icon: Package, type: "link" as const },
    {
      to: "/customers",
      labelKey: "customers",
      icon: Users,
      type: "link" as const,
    },
    {
      to: "/service-offerings",
      labelKey: "serviceOfferings",
      icon: Shirt,
      type: "link" as const,
    },
    // --- THE NEW LINK ---
    { to: '/admin/expense-categories', labelKey: 'expenseCategories', ns: 'admin', icon: FolderKanban, permission: 'expense-category:manage' },
    {
      to: "/expenses",
      labelKey: "expenses",
      namespace: "expenses",
      icon: DollarSign,
      type: "link" as const,
    },
    {
      to: "/purchases",
      labelKey: "purchases",
      namespace: "purchases",
      icon: ShoppingCart,
      type: "link" as const,
    },

    {
      to: "/suppliers",
      labelKey: "suppliers",
      namespace: "suppliers",
      icon: Users,
      type: "link" as const,
    },
    {
      to: "/orders/kanban",
      labelKey: "kanban",
      namespace: "orders",
      icon: FolderKanban,
      type: "link" as const,
    },
    {
      to: "/reports",
      labelKey: "reports",
      namespace: "reports",
      icon: ChartBar,
      type: "link" as const,
    },
    {
      labelKey: "serviceAdmin",
      icon: SettingsIcon,
      type: "collapsible" as const,
      isOpen: isServiceAdminOpen,
      onToggle: () => setIsServiceAdminOpen(!isServiceAdminOpen),
      subItems: [
        {
          to: "/admin/product-categories",
          labelKey: "productCategories",
          icon: Layers,
        },
        { to: "/admin/product-types", labelKey: "productTypes", icon: Box },
        {
          to: "/admin/service-actions",
          labelKey: "serviceActions",
          icon: Wand2,
        },
      ],
    },
    {
      to: "/settings",
      labelKey: "settingsPageTitle",
      icon: SettingsIcon,
      type: "link" as const,
    }, 
    {
      to: "/admin/users",
      labelKey: "users",
      icon: User2,
      type: "link" as const,
    }, 
    {
      to: "/admin/roles",
      labelKey: "roles",
      icon: Lock,
      type: "link" as const,
    }, // Use a different key if "Settings" is used for admin
  ];

  const SidebarNav: React.FC<{ mobile?: boolean; closeSheet?: () => void }> = ({
    mobile = false,
    closeSheet,
  }) => (
    // ... (SidebarNav implementation as before, using navItems)
    // Make sure to call closeSheet?.() on mobile link clicks if sheet state is managed here or passed
    <nav
      className={`grid items-start gap-1 px-2 text-sm font-medium lg:px-4 ${
        mobile ? "text-lg py-4" : "py-2"
      }`}
    >
      {navItems.map((item) => {
        const isActive = item.type === "link" && location.pathname === item.to;
        const isSubItemActive =
          item.type === "collapsible" &&
          item.subItems?.some((sub) => location.pathname.startsWith(sub.to!));

        return item.type === "link" ? (
          <Button
            key={item.labelKey}
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
            onClick={() => mobile && closeSheet?.()}
          >
            <Link to={item.to!}>
              <item.icon
                className={`mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 ${
                  mobile ? "h-5 w-5" : ""
                }`}
              />
              {t(item.labelKey, {
                ns: item.namespace || (item.labelKey.includes("settings") ? "settings" : "common"),
              })}
            </Link>
          </Button>
        ) : (
          <Collapsible
            key={item.labelKey}
            open={item.isOpen}
            onOpenChange={item.onToggle}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant={isSubItemActive ? "secondary" : "ghost"}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <item.icon
                    className={`mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 ${
                      mobile ? "h-5 w-5" : ""
                    }`}
                  />
                  {t(item.labelKey, { ns: "services" })}
                </span>
                {item.isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-7 rtl:pr-7 pt-1 space-y-1">
              {item.subItems?.map((subItem) => (
                <Button
                  key={subItem.labelKey}
                  variant={
                    location.pathname === subItem.to ? "secondary" : "ghost"
                  }
                  className="w-full justify-start text-xs"
                  asChild
                  onClick={() => mobile && closeSheet?.()}
                >
                  <Link to={subItem.to!}>
                    <subItem.icon
                      className={`mr-2 h-3 w-3 rtl:ml-2 rtl:mr-0 ${
                        mobile ? "h-4 w-4" : ""
                      }`}
                    />
                    {t(subItem.labelKey, { ns: "services" })}
                  </Link>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );

  // --- Main Layout JSX ---
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-background md:block dark:bg-muted/40">
        {" "}
        {/* Adjusted dark mode bg for sidebar */}
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <ShirtIcon className="h-6 w-6 text-primary" />
              <span className="text-lg">{t("appName", { ns: "common" })}</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Header (App Bar) */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 dark:bg-muted/40">
          {/* Mobile Navigation Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">
                  {t("toggleNavigationMenu", {
                    ns: "common",
                    defaultValue: "Toggle navigation menu",
                  })}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              {" "}
              {/* Remove padding for full height nav */}
              <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6 self-start w-full">
                <Link to="/" className="flex items-center gap-2 font-semibold">
                  <ShirtIcon className="h-6 w-6 text-primary" />
                  <span className="text-lg">
                    {t("appName", { ns: "common" })}
                  </span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav mobile />{" "}
                {/* Pass closeSheet if you manage sheet state */}
              </div>
            </SheetContent>
          </Sheet>

          {/* Flexible space to push items to the right */}
          <div className="w-full flex-1">
            {/* Placeholder for Breadcrumbs or Global Search Bar if needed */}
          </div>

          {/* Right-aligned Header Items */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ModeToggle />
            <UserNav />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 bg-muted/20 dark:bg-background overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
