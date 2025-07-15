import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { restaurantTableService } from '@/api/restaurantTableService';
import { RestaurantTable } from '@/types/restaurantTable.types';
import { Loader2, MapPin, Users } from 'lucide-react';

interface TableSelectionProps {
  selectedTableId?: number | null;
  onTableSelect: (tableId: number | null) => void;
  disabled?: boolean;
}

const TableSelection: React.FC<TableSelectionProps> = ({
  selectedTableId,
  onTableSelect,
  disabled = false
}) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const availableTables = await restaurantTableService.getAvailable();
      setTables(availableTables);
    } catch (err) {
      setError('Failed to load tables');
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTable = tables.find(table => table.id === selectedTableId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Table Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading tables...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Table Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Table</label>
          <Select
            value={selectedTableId?.toString() || ''}
            onValueChange={(value) => onTableSelect(value ? parseInt(value) : null)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a table..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No table selected</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table.id} value={table.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{table.name}</span>
                    <Badge className={getStatusColor(table.status)}>
                      {table.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTable && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedTable.name}</h4>
                <p className="text-sm text-gray-600">{selectedTable.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Capacity: {selectedTable.capacity}
                </span>
                <Badge className={getStatusColor(selectedTable.status)}>
                  {selectedTable.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {tables.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            No tables available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableSelection; 