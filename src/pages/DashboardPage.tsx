import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const DashboardPage = () => {
  const { t } = useTranslation(['common', 'orders']);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard', { ns: 'common' })}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('welcomeMessage', { appName: t('appName') })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is your laundry management dashboard. More widgets and stats coming soon!</p>
          <p>Example from orders namespace: {t('title', {ns: 'orders'})}</p>
        </CardContent>
      </Card>
    </div>
  );
};
export default DashboardPage;