import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const OrderDetailsPage = () => {
  const { t } = useTranslation(['common', 'orders']);
  const { id } = useParams();

  return (
    <div>
      <Button variant="outline" asChild className="mb-4">
        <Link to="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">
        {t('orderId', { ns: 'orders' })}: {id}
      </h1>
      <p>Details for order {id} will be displayed here.</p>
      <p>Customer info, items, status updates, payment details etc.</p>
    </div>
  );
};
export default OrderDetailsPage;