import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, Package, Users, Settings, LogOut, SunMoon, Menu, Laundry, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle'; // Adjust path
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const navItems = [
  { to: '/', labelKey: 'dashboard', icon: Home },
  { to: '/orders', labelKey: 'orders', icon: Package },
  { to: '/customers', labelKey: 'customers', icon: Users },
  { to: '/services', labelKey: 'services', icon: Shirt },
  { to: '/settings', labelKey: 'settings', icon: Settings },
];

const MainLayout = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Clear token
    // Potentially call a backend logout endpoint
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const UserNav = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" /> {/* Replace with actual user image */}
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User Name</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const LanguageSwitcher = () => (
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('es')}>
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const SidebarNav = () => (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <Button
          key={item.labelKey}
          variant={location.pathname === item.to ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          asChild
        >
          <Link to={item.to}>
            <item.icon className="mr-2 h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        </Button>
      ))}
    </nav>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Laundry className="h-6 w-6" />
              <span className="">{t('appName')}</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
              <SidebarNav />
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Mobile Header & Main Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium mt-8">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Laundry className="h-6 w-6" />
                  <span className="">{t('appName')}</span>
                </Link>
                <SidebarNav />
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* Future: Add Breadcrumbs or Search Bar here */}
          </div>
          <LanguageSwitcher />
          <ModeToggle />
          <UserNav />
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// A simple Languages icon component
const Languages: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

export default MainLayout;