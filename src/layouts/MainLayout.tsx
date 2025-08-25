// src/layouts/MainLayout.tsx
import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/api/apiClient";
import settingService from "@/services/settingService";
import { toast } from "sonner";
import { useSearch } from "@/context/SearchContext";
import { useDate } from "@/context/DateContext";
import { POSSearch } from "@/components/ui/pos-search";
import { POSNewOrderButton } from "@/components/ui/pos-new-order-button";
import { POSDatePicker } from "@/components/ui/pos-date-picker";

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
    Utensils,
    Layers,
    Box,
    Wand2,
    ChevronDown,
    ChevronRight,
    Languages,
    User2,
    Lock,
    DollarSign,
    ShoppingCart,
    ChartBar,
    Calculator,
    PanelLeftClose,
    PanelLeftOpen,
    TrendingUp,
    Loader2,
    Lamp,
    Table,
    Zap,
    Calendar,
    TrendingDown,
    FileText,
    FileBarChart,
    Grid3x3,
    Tags,
    FolderOpen,
  } from "lucide-react";

import { getUserNavigation, type SimpleNavigationItem } from "@/api/navigationService";
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import AppIcon from '@/components/ui/app-icon';

// Type declaration for Echo
declare global {
  interface Window {
    Echo: {
      connector: {
        pusher: {
          connection: {
            state: string;
            bind: (event: string, callback: (...args: unknown[]) => void) => void;
            unbind: (event: string, callback: (...args: unknown[]) => void) => void;
          };
          connect: () => void;
        };
      };
    };
  }
}

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Package,
  Users,
  Settings: SettingsIcon,
  Menu,
      Utensils,
  Layers,
  Box,
  Wand2,
  User2,
  Lock,
  DollarSign,
  ShoppingCart,
  ChartBar,
  Calculator,
  TrendingUp,
  // Navigation item icon mappings
  LayoutDashboard: Home,
  Briefcase: Utensils, // Changed from Shirt to Utensils
  Receipt: DollarSign,
  Truck: Users,
  BarChart3: ChartBar,
  Shield: Lock,
  Plus: Package,
  List: Package,
  UserPlus: Users,
  Grid3x3,
  Tags,
  FolderOpen,
  TrendingDown,
  FileText,
  UtensilsCrossed: Utensils,
  Table,
  Zap,
  Calendar,
  FileBarChart,
};

// Real-time connection status lamp
const RealtimeLamp: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState('disconnected');
  const [lastEvent, setLastEvent] = useState('');
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [reconnectStatus, setReconnectStatus] = useState<'idle'|'reconnecting'|'success'|'failed'>('idle');

  useEffect(() => {
    const echo = window.Echo;
    if (!echo || !echo.connector) return;
    const pusher = echo.connector.pusher;
    if (!pusher) return;
    const updateStatus = () => {
      setConnected(pusher.connection.state === 'connected');
      setState(pusher.connection.state);
      // If dialog is open and reconnecting, update status
      if (showReconnectDialog && reconnectStatus === 'reconnecting') {
        if (pusher.connection.state === 'connected') {
          setReconnectStatus('success');
          setTimeout(() => setShowReconnectDialog(false), 1000); // auto-close
        } else if (pusher.connection.state === 'failed' || pusher.connection.state === 'unavailable') {
          setReconnectStatus('failed');
        }
      }
    };
    const handleEvent = (...args: unknown[]) => {
      const event = args[0];
      const eventString = typeof event === 'object' && event && 'type' in event && typeof event.type === 'string' 
        ? event.type 
        : String(event);
      setLastEvent(eventString);
    };
    updateStatus();
    pusher.connection.bind('state_change', updateStatus);
    pusher.connection.bind('message', handleEvent);
    return () => {
      pusher.connection.unbind('state_change', updateStatus);
      pusher.connection.unbind('message', handleEvent);
    };
  }, [showReconnectDialog, reconnectStatus]);

  const handleReconnect = () => {
    const echo = window.Echo;
    console.log(echo,'echo');
    if (echo && echo.connector && echo.connector.pusher) {
      setShowReconnectDialog(true);
      setReconnectStatus('reconnecting');
      echo.connector.pusher.connect();
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="p-0 h-8 w-8" aria-label="Real-time connection status">
            <Lamp className={`h-6 w-6 ${connected ? 'text-green-500' : 'text-gray-400'}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 text-sm">
          <div className="mb-2 font-semibold">Real-time Connection</div>
          <div>Status: <span className={connected ? 'text-green-600' : 'text-red-500'}>{state}</span></div>
          <div>Last Event: <span className="text-muted-foreground">{lastEvent || 'N/A'}</span></div>
          <Button onClick={handleReconnect} size="sm" className="mt-2">Reconnect</Button>
        </PopoverContent>
      </Popover>
      <Dialog open={showReconnectDialog} onOpenChange={setShowReconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconnecting...</DialogTitle>
            <DialogDescription>
              {reconnectStatus === 'reconnecting' && (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Attempting to reconnect to real-time server...</span>
              )}
              {reconnectStatus === 'success' && (
                <span className="text-green-600">Reconnected successfully!</span>
              )}
              {reconnectStatus === 'failed' && (
                <span className="text-red-600">Failed to reconnect. Please try again.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="outline" className="mt-4 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

// MainLayout Component
const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation(["common", "auth", "settings"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: storeLogout } = useAuthStore();
  const { setIsSearchVisible } = useSearch();
  const { setSelectedDate } = useDate();

  // Show search when on POS route
  React.useEffect(() => {
    const isPOSRoute = location.pathname === '/pos';
    setIsSearchVisible(isPOSRoute);
  }, [location.pathname, setIsSearchVisible]);

  // Handle window resize to manage sidebar state
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // On mobile/tablet, collapse sidebar by default
        setIsSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch settings for app branding
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingService.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


      const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

  // Fetch user navigation
  const { data: navigationItems = [], isLoading: isNavigationLoading, error: navigationError } = useQuery({
    queryKey: ['user-navigation'],
    queryFn: getUserNavigation,
    enabled: !!user,
  });

  console.log('User:', user);
  console.log('User roles:', user?.roles);
  console.log('Navigation items:', navigationItems);
  console.log('Navigation error:', navigationError);
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

  // Toggle collapsible state
  const toggleCollapsible = (itemKey: string) => {
    setCollapsedStates(prev => ({
      ...prev,
      [itemKey]: !(prev[itemKey] !== undefined ? prev[itemKey] : true) // Default to true (collapsed)
    }));
  };

  // Handle navigation item click - do not auto-collapse sidebar
  const handleNavigationClick = () => {
    return;
  };

  // Get icon component for navigation item
  const getIconComponent = (iconName: string | undefined) => {
    if (!iconName) return Home;
    return iconMap[iconName] || Home;
  };

  // Get title for navigation item
  const getItemTitle = (item: SimpleNavigationItem) => {
    return item.title[i18n.language as keyof typeof item.title] || item.title.en;
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

  // --- Dynamic Sidebar Navigation ---
  const SidebarNav: React.FC<{ mobile?: boolean; closeSheet?: () => void; collapsed?: boolean }> = ({
    mobile = false,
    closeSheet,
    collapsed = false,
  }) => {
    if (isNavigationLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">{t('loading')}</span>
        </div>
      );
    }

    const renderNavigationItem = (item: SimpleNavigationItem, level: number = 0) => {
      const IconComponent = getIconComponent(item.icon);
      const title = getItemTitle(item);
      const hasChildren = item.children && item.children.length > 0;
      const isActive = location.pathname === item.route;
      const isSubItemActive = hasChildren && item.children?.some(child => 
        location.pathname === child.route
      );
      const isCollapsed = collapsedStates[item.key] !== undefined ? collapsedStates[item.key] : true; // Default to true (collapsed)

      if (hasChildren) {
        return collapsed ? (
          <Button
            key={item.key}
            variant={isSubItemActive ? "secondary" : "ghost"}
            className="w-full justify-center px-2"
            title={title}
            onClick={() => {
              toggleCollapsible(item.key);
              if (mobile && closeSheet) {
                closeSheet();
              } else {
                handleNavigationClick();
              }
            }}
          >
            <IconComponent className="h-4 w-4" />
          </Button>
        ) : (
          <Collapsible
            key={item.key}
            open={!isCollapsed}
            onOpenChange={() => toggleCollapsible(item.key)}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant={isSubItemActive ? "secondary" : "ghost"}
                className="w-full justify-between"
                onClick={() => {
                  if (mobile && closeSheet) {
                    closeSheet();
                  } else {
                    handleNavigationClick();
                  }
                }}
              >
                <span className="flex items-center">
                  <IconComponent
                    className={`mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 ${
                      mobile ? "h-5 w-5" : ""
                    }`}
                  />
                  {title}
                </span>
                {!isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-7 rtl:pr-7 pt-1 space-y-1">
              {item.children?.map((child) => renderNavigationItem(child, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        );
      }

      return (
        <Button
          key={item.key}
          variant={isActive ? "secondary" : "ghost"}
          className={`w-full justify-start ${collapsed ? "justify-center px-2" : ""}`}
          asChild
          onClick={() => {
            if (mobile && closeSheet) {
              closeSheet();
            } else {
              handleNavigationClick();
            }
          }}
          title={collapsed ? title : undefined}
        >
          <Link to={item.route || "#"}>
            <IconComponent
              className={`h-4 w-4 ${
                mobile ? "h-5 w-5" : ""
              } ${collapsed ? "" : "mr-3 rtl:ml-3 rtl:mr-0"}`}
            />
            {!collapsed && title}
          </Link>
        </Button>
      );
    };

    return (
      <nav
        className={`grid items-start gap-1 px-2 text-sm font-medium lg:px-4 ${
          mobile ? "text-lg py-4" : "py-2"
        }`}
      >
        {navigationItems.map((item) => renderNavigationItem(item))}
    </nav>
  );
  };

  // Check if current route is MenuPage
  const isMenuPage = location.pathname.includes('/services/offerings/menu');

  // --- Main Layout JSX ---
  return (
    <div className={`grid min-h-screen w-full transition-all duration-300 ${
      isMenuPage 
        ? "grid-cols-1" 
        : isSidebarCollapsed 
          ? "lg:grid-cols-[60px_1fr]" 
          : "lg:grid-cols-[200px_1fr] xl:grid-cols-[250px_1fr]"
    }`}>
      {/* Desktop Sidebar - Hidden on MenuPage */}
      {!isMenuPage && (
        <div className="hidden border-r bg-background lg:block dark:bg-muted/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <div className="flex items-center justify-between w-full">
                              {!isSidebarCollapsed && (
                  <Link to="/" className="flex items-center gap-2 font-semibold">
                    <AppIcon 
                      iconUrl={settings?.company_logo_url} 
                      className="h-6 w-6" 
                      fallbackIcon={Utensils}
                    />
                    <span className="text-lg">{settings?.app_name || t("appName", { ns: "common" })}</span>
                  </Link>
                )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="ml-auto"
                title={isSidebarCollapsed ? t("expandSidebar", { ns: "common", defaultValue: "Expand sidebar" }) : t("collapseSidebar", { ns: "common", defaultValue: "Collapse sidebar" })}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav collapsed={isSidebarCollapsed} />
          </div>
        </div>
      </div>
      )}

      <div className="flex flex-col">
        {/* Header (App Bar) */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 dark:bg-muted/40">
          {/* Mobile Navigation Trigger - Hidden on MenuPage */}
          {!isMenuPage && (
            <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 lg:hidden"
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
                  <AppIcon 
                    iconUrl={settings?.company_logo_url} 
                    className="h-6 w-6" 
                    fallbackIcon={Utensils}
                  />
                  <span className="text-lg">
                    {settings?.app_name || t("appName", { ns: "common" })}
                  </span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav mobile />{" "}
                {/* Pass closeSheet if you manage sheet state */}
              </div>
            </SheetContent>
          </Sheet>
          )}

          {/* Flexible space to push items to the right */}
          <div className="w-full flex-1 flex items-center justify-center gap-4">
            <POSSearch />
            {location.pathname === '/pos' && <POSDatePicker onDateChange={setSelectedDate} />}
            {location.pathname === '/pos' && <POSNewOrderButton />}
          </div>

          {/* Right-aligned Header Items */}
          <div className="flex items-center gap-3">
            <RealtimeLamp />
            <LanguageSwitcher />
            <ModeToggle />
            <UserNav />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-1 md:gap-6   bg-muted/20 dark:bg-background overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
