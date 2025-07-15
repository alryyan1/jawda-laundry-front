import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Calendar, Users, Clock } from 'lucide-react';

import { getDiningTables, getDiningTableStatistics } from '@/api/diningTableService';
import { getTodayReservations } from '@/api/tableReservationService';
import type { DiningTable, TableReservation } from '@/types/dining.types';
import { DiningTableGrid } from '@/features/dining/components/DiningTableGrid';
import { TableReservationList } from '@/features/dining/components/TableReservationList';
import { DiningTableFormModal } from '@/features/dining/components/DiningTableFormModal';
import { TableReservationFormModal } from '@/features/dining/components/TableReservationFormModal';

const DiningManagementPage: React.FC = () => {
  const { t } = useTranslation(['common', 'dining']);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);

  // Fetch dining tables
  const { data: tables = [], isLoading: isLoadingTables, refetch: refetchTables } = useQuery<DiningTable[]>({
    queryKey: ['diningTables'],
    queryFn: getDiningTables,
  });

  // Fetch table statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['diningTableStatistics'],
    queryFn: getDiningTableStatistics,
  });

  // Fetch today's reservations
  const { data: todayReservations = [], isLoading: isLoadingReservations, refetch: refetchReservations } = useQuery<TableReservation[]>({
    queryKey: ['todayReservations'],
    queryFn: getTodayReservations,
  });

  const handleTableCreated = () => {
    setIsTableModalOpen(false);
    refetchTables();
    toast.success(t('tableCreatedSuccess', { ns: 'dining' }));
  };

  const handleReservationCreated = () => {
    setIsReservationModalOpen(false);
    refetchReservations();
    refetchTables();
    toast.success(t('reservationCreatedSuccess', { ns: 'dining' }));
  };

  const handleTableClick = (table: DiningTable) => {
    setSelectedTable(table);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoadingTables || isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('loading', { ns: 'common' })}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('diningManagement', { ns: 'dining' })}</h1>
          <p className="text-muted-foreground">{t('diningManagementDescription', { ns: 'dining' })}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTableModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addTable', { ns: 'dining' })}
          </Button>
          <Button variant="outline" onClick={() => setIsReservationModalOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            {t('addReservation', { ns: 'dining' })}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalTables', { ns: 'dining' })}</p>
                <p className="text-2xl font-bold">{statistics?.total_tables || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('available', { ns: 'dining' })}</p>
                <p className="text-2xl font-bold text-green-600">{statistics?.available_tables || 0}</p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                {t('available', { ns: 'dining' })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('occupied', { ns: 'dining' })}</p>
                <p className="text-2xl font-bold text-red-600">{statistics?.occupied_tables || 0}</p>
              </div>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                {t('occupied', { ns: 'dining' })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('reserved', { ns: 'dining' })}</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics?.reserved_tables || 0}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                {t('reserved', { ns: 'dining' })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('maintenance', { ns: 'dining' })}</p>
                <p className="text-2xl font-bold text-gray-600">{statistics?.maintenance_tables || 0}</p>
              </div>
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                {t('maintenance', { ns: 'dining' })}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">{t('tables', { ns: 'dining' })}</TabsTrigger>
          <TabsTrigger value="reservations">{t('reservations', { ns: 'dining' })}</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <DiningTableGrid
            tables={tables}
            onTableClick={handleTableClick}
            onTableUpdated={refetchTables}
          />
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <TableReservationList
            reservations={todayReservations}
            isLoading={isLoadingReservations}
            onReservationUpdated={refetchReservations}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DiningTableFormModal
        isOpen={isTableModalOpen}
        onOpenChange={setIsTableModalOpen}
        onSuccess={handleTableCreated}
      />

      <TableReservationFormModal
        isOpen={isReservationModalOpen}
        onOpenChange={setIsReservationModalOpen}
        onSuccess={handleReservationCreated}
        selectedTable={selectedTable}
      />
    </div>
  );
};

export default DiningManagementPage; 