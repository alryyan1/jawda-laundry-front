import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, FileText } from 'lucide-react';

const ReportsMainPage: React.FC = () => {
    const { t } = useTranslation(['reports', 'common']);

    const reportCards = [
        {
            title: t('salesSummaryTitle'),
            description: t('salesSummaryDescription'),
            icon: TrendingUp,
            to: '/reports/sales',
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950',
            borderColor: 'border-green-200 dark:border-green-800'
        },
        {
            title: t('costSummaryTitle'),
            description: t('costSummaryDescription'),
            icon: TrendingDown,
            to: '/reports/costs',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950',
            borderColor: 'border-red-200 dark:border-red-800'
        },
        {
            title: t('detailedReportsTitle'),
            description: t('detailedReportsDescription'),
            icon: FileText,
            to: '/reports/detailed',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
            borderColor: 'border-blue-200 dark:border-blue-800'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                title={t('reportsTitle', { defaultValue: 'التقارير' })}
                description={t('reportsDescription', { defaultValue: 'عرض وتحليل البيانات المالية والأداء' })}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reportCards.map((card) => (
                    <Link key={card.to} to={card.to}>
                        <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-2 ${card.borderColor} ${card.bgColor}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm leading-relaxed">
                                    {card.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            {t('reportsOverview', { defaultValue: 'نظرة عامة على التقارير' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('salesReportFeatures', { defaultValue: 'تقرير المبيعات يتضمن:' })}</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• {t('totalRevenue', { defaultValue: 'إجمالي الإيرادات' })}</li>
                                    <li>• {t('totalOrders', { defaultValue: 'إجمالي الطلبات' })}</li>
                                    <li>• {t('averageOrderValue', { defaultValue: 'متوسط قيمة الطلب' })}</li>
                                    <li>• {t('topServicesByRevenue', { defaultValue: 'أفضل الخدمات حسب الإيرادات' })}</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('costReportFeatures', { defaultValue: 'تقرير المصروفات يتضمن:' })}</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• {t('totalCost', { defaultValue: 'إجمالي التكاليف' })}</li>
                                    <li>• {t('totalExpenses', { defaultValue: 'إجمالي المصروفات' })}</li>
                                    <li>• {t('totalPurchases', { defaultValue: 'إجمالي المشتريات' })}</li>
                                    <li>• {t('expensesByCategory', { defaultValue: 'المصروفات حسب الفئة' })}</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReportsMainPage; 