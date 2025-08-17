import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getUserNavigation } from '@/api/navigationService';

const RoleTest: React.FC = () => {
  const { user } = useAuthStore();
  
  const { data: navigationItems = [], isLoading, error } = useQuery({
    queryKey: ['user-navigation'],
    queryFn: getUserNavigation,
    enabled: !!user,
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Role Test Component</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">User Information:</h3>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Username: {user?.username}</p>
        <p>Roles: {user?.roles?.join(', ')}</p>
        <p>Permissions: {user?.permissions?.join(', ')}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Navigation Status:</h3>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error ? 'Yes' : 'No'}</p>
        {error && <p className="text-red-500">Error: {JSON.stringify(error)}</p>}
      </div>

      <div>
        <h3 className="font-semibold">Navigation Items ({navigationItems.length}):</h3>
        {navigationItems.map((item) => (
          <div key={item.id} className="ml-4 mb-2">
            <p>• {item.key}: {item.title.en}</p>
            {item.children && item.children.length > 0 && (
              <div className="ml-4">
                {item.children.map((child) => (
                  <p key={child.id}>  - {child.key}: {child.title.en}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleTest;
