import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Users, 
  Package, 
  DollarSign, 
  Calendar,
  ArrowRight,
  Clock,
  ShoppingCart,
  Receipt,
  Download
} from 'lucide-react';

const DetailedReportsMainPage: React.FC = () => {
  const { t } = useTranslation(['reports', 'common']);
  const { can } = useAuth();

  const reports = [
    {
      id: 'overdue-pickups',
      title: t('overduePickupsTitle'),
      description: t('overduePickupsDescription'),
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      route: '/reports/detailed/overdue-pickups',
      permission: 'report:view-operational',
      features: [
        t('overduePickupsFeatures.1'),
        t('overduePickupsFeatures.2'),
        t('overduePickupsFeatures.3'),
        t('overduePickupsFeatures.4')
      ]
    },
    {
      id: 'detailed-orders',
      title: t('detailedOrdersReportTitle'),
      description: t('detailedOrdersReportDescription'),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      route: '/reports/detailed-orders',
      permission: 'report:view-financial',
      features: [
        t('detailedOrdersFeatures.1'),
        t('detailedOrdersFeatures.2'),
        t('detailedOrdersFeatures.3'),
        t('detailedOrdersFeatures.4')
      ]
    },
    {
      id: 'customer-analysis',
      title: t('customerAnalysisReportTitle'),
      description: t('customerAnalysisReportDescription'),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      route: '/reports/customer-analysis',
      permission: 'report:view-financial',
      features: [
        t('customerAnalysisFeatures.1'),
        t('customerAnalysisFeatures.2'),
        t('customerAnalysisFeatures.3'),
        t('customerAnalysisFeatures.4')
      ]
    },
    {
      id: 'product-performance',
      title: t('productPerformanceReportTitle'),
      description: t('productPerformanceReportDescription'),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      route: '/reports/product-performance',
      permission: 'report:view-financial',
      features: [
        t('productPerformanceFeatures.1'),
        t('productPerformanceFeatures.2'),
        t('productPerformanceFeatures.3'),
        t('productPerformanceFeatures.4')
      ]
    },
    {
      id: 'revenue-analysis',
      title: t('revenueAnalysisReportTitle'),
      description: t('revenueAnalysisReportDescription'),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      route: '/reports/revenue-analysis',
      permission: 'report:view-financial',
      features: [
        t('revenueAnalysisFeatures.1'),
        t('revenueAnalysisFeatures.2'),
        t('revenueAnalysisFeatures.3'),
        t('revenueAnalysisFeatures.4')
      ]
    },
    {
      id: 'expense-analysis',
      title: t('expenseAnalysisReportTitle'),
      description: t('expenseAnalysisReportDescription'),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      route: '/reports/expense-analysis',
      permission: 'report:view-financial',
      features: [
        t('expenseAnalysisFeatures.1'),
        t('expenseAnalysisFeatures.2'),
        t('expenseAnalysisFeatures.3'),
        t('expenseAnalysisFeatures.4')
      ]
    },
    {
      id: 'time-analysis',
      title: t('timeAnalysisReportTitle'),
      description: t('timeAnalysisReportDescription'),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      route: '/reports/time-analysis',
      permission: 'report:view-financial',
      features: [
        t('timeAnalysisFeatures.1'),
        t('timeAnalysisFeatures.2'),
        t('timeAnalysisFeatures.3'),
        t('timeAnalysisFeatures.4')
      ]
    },
    {
      id: 'sales-trends',
      title: t('salesTrendsReportTitle'),
      description: t('salesTrendsReportDescription'),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      route: '/reports/sales-trends',
      permission: 'report:view-financial',
      features: [
        t('salesTrendsFeatures.1'),
        t('salesTrendsFeatures.2'),
        t('salesTrendsFeatures.3'),
        t('salesTrendsFeatures.4')
      ]
    },
    {
      id: 'inventory-report',
      title: t('inventoryReportTitle'),
      description: t('inventoryReportDescription'),
      icon: ShoppingCart,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      route: '/reports/inventory',
      permission: 'report:view-financial',
      features: [
        t('inventoryFeatures.1'),
        t('inventoryFeatures.2'),
        t('inventoryFeatures.3'),
        t('inventoryFeatures.4')
      ]
    }
  ];

  const availableReports = reports.filter(report => can(report.permission));

  if (availableReports.length === 0) {
    return (
      <div className="p-8 text-center text-destructive">
        {t('accessDenied', { ns: 'common' })}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('detailedReportsTitle')}
        description={t('detailedReportsDescription')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableReports.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.id} className="group hover:shadow-lg transition-all duration-200">
              <Link to={report.route} className="block">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors">
                    {report.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {report.description}
                  </p>
                  <div className="space-y-2">
                    {report.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {t('detailedReport')}
                    </Badge>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">{t('reportsTipsTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <Calendar className="h-4 w-4 mt-0.5 text-primary" />
            <span>{t('reportsTips.dateRange')}</span>
          </div>
          <div className="flex items-start space-x-2">
            <Download className="h-4 w-4 mt-0.5 text-primary" />
            <span>{t('reportsTips.export')}</span>
          </div>
          <div className="flex items-start space-x-2">
            <BarChart3 className="h-4 w-4 mt-0.5 text-primary" />
            <span>{t('reportsTips.filtering')}</span>
          </div>
          <div className="flex items-start space-x-2">
            <Receipt className="h-4 w-4 mt-0.5 text-primary" />
            <span>{t('reportsTips.detailed')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedReportsMainPage; 