import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  FileQuestion,
  RefreshCw,
  Coffee
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // You can implement search functionality here
      // For now, redirect to dashboard with search params
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickLinks = [
    { to: '/', label: t('dashboard', { defaultValue: 'Dashboard' }), icon: Home },
    { to: '/orders', label: t('orders', { defaultValue: 'Orders' }), icon: FileQuestion },
    { to: '/customers', label: t('customers', { defaultValue: 'Customers' }), icon: FileQuestion },
    { to: '/pos', label: t('pointOfSale', { defaultValue: 'POS' }), icon: FileQuestion },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          {/* Large 404 Number */}
          <div className="relative mb-6">
            <h1 className="text-9xl md:text-[12rem] font-bold text-muted-foreground/20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 border">
                <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                <Badge variant="outline" className="text-xs">
                  Page Not Found
                </Badge>
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('pageNotFoundTitle', { defaultValue: 'Oops! Page not found' })}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pageNotFoundDescription', { 
              defaultValue: 'The page you\'re looking for doesn\'t exist or has been moved. Don\'t worry, let\'s get you back on track!' 
            })}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Try these common actions to find what you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleGoBack} variant="outline" className="w-full justify-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('goBack', { defaultValue: 'Go Back' })}
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t('goHome', { defaultValue: 'Go to Dashboard' })}
                </Link>
              </Button>

              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full justify-start"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('reloadPage', { defaultValue: 'Reload Page' })}
              </Button>
            </CardContent>
          </Card>

          {/* Search and Quick Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search or Browse
              </CardTitle>
              <CardDescription>
                Search for content or visit popular pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder={t('searchPlaceholder', { defaultValue: 'Search for pages...' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Quick Links */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Popular Pages
                </h4>
                {quickLinks.map((link) => (
                  <Button
                    key={link.to}
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto py-2"
                  >
                    <Link to={link.to}>
                      <link.icon className="mr-2 h-3 w-3" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 pt-6 border-t">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Coffee className="h-4 w-4" />
            <span>{t('appName', { defaultValue: 'Laundry Management' })}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Error Code: 404 • Page Not Found • {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;