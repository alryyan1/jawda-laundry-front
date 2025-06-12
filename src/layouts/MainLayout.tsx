// src/layouts/MainLayout.tsx
import React, { useState } from "react"; // Added useState
// ... (other imports)
import {
  Home,
  Package,
  Users,
  Settings as SettingsIcon,
  Menu,
  Shirt,
  Layers,
  Box,
  Wand2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"; // Added new icons
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Link, Outlet } from "react-router-dom";
import { t } from "i18next";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";

// ... (useAuthStore, useTranslation, handleLogout, UserNav, LanguageSwitcher)

const MainLayout = () => {
  // ... (t, i18n, navigate, user, storeLogout, handleLogout, UserNav, LanguageSwitcher)
  const [isServiceAdminOpen, setIsServiceAdminOpen] = useState(false); // State for collapsible menu

  const navItems = [
    { to: "/", labelKey: "dashboard", icon: Home, type: "link" },
    { to: "/orders", labelKey: "orders", icon: Package, type: "link" },
    { to: "/customers", labelKey: "customers", icon: Users, type: "link" },
    {
      to: "/service-offerings",
      labelKey: "serviceOfferings",
      icon: Shirt,
      type: "link",
    },
    {
      labelKey: "serviceAdmin",
      icon: SettingsIcon,
      type: "collapsible",
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
    { to: "/settings", labelKey: "settings", icon: SettingsIcon, type: "link" }, // Main settings for user profile etc.
  ];

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav
      className={`grid items-start gap-1 px-2 text-sm font-medium lg:px-4 ${
        mobile ? "text-lg" : ""
      }`}
    >
      {navItems.map((item) =>
        item.type === "link" ? (
          <Button
            key={item.labelKey}
            variant={location.pathname === item.to ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
            onClick={mobile ? undefined : undefined}
          >
            <Link to={item.to!}>
              <item.icon
                className={`mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 ${
                  mobile ? "h-5 w-5" : ""
                }`}
              />
              {t(item.labelKey)}
            </Link>
          </Button>
        ) : (
          // Collapsible item
          <Collapsible
            key={item.labelKey}
            open={item.isOpen}
            onOpenChange={item.onToggle}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center">
                  <item.icon
                    className={`mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 ${
                      mobile ? "h-5 w-5" : ""
                    }`}
                  />
                  {t(item.labelKey)}
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
                  className="w-full justify-start text-xs" // Smaller for sub-items
                  asChild
                >
                  <Link to={subItem.to!}>
                    <subItem.icon
                      className={`mr-2 h-3 w-3 rtl:ml-2 rtl:mr-0 ${
                        mobile ? "h-4 w-4" : ""
                      }`}
                    />
                    {t(subItem.labelKey)}
                  </Link>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )
      )}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Shirt className="h-6 w-6 text-primary" />
              <span className="">{t("appName")}</span>
            </Link>
          </div>
          <div className="flex-1 py-4 overflow-y-auto">
            <SidebarNav />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Mobile Header & Main Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 self-start">
                <Link to="/" className="flex items-center gap-2 font-semibold">
                  <Shirt className="h-6 w-6 text-primary" />
                  <span className="">{t("appName")}</span>
                </Link>
              </div>
              <div className="flex-1 py-4 overflow-y-auto">
                <SidebarNav mobile />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Future: Breadcrumbs or Global Search */}
          </div>
          <ModeToggle />
          {/* <LanguageSwitcher /> */}
          {/* <UserNav /> */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default MainLayout;
