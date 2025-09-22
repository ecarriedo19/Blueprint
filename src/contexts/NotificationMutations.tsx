import React, { createContext, useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NotificationMutationsContextType {
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

interface NotificationMutationsProviderProps {
  children: React.ReactNode;
}

const NotificationMutationsContext = createContext<NotificationMutationsContextType | undefined>(undefined);

export const useNotificationMutations = () => {
  const context = useContext(NotificationMutationsContext);
  if (context === undefined) {
    throw new Error('useNotificationMutations must be used within a NotificationMutationsProvider');
  }
  return context;
};

export const NotificationMutationsProvider: React.FC<NotificationMutationsProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to mark notification as read');
      }
    },
    onSuccess: () => {
      // Invalidate notifications to refetch with updated read status
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
    },
    onSuccess: () => {
      // Invalidate notifications to refetch with all marked as read
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = useCallback(async (id: number) => {
    await markAsReadMutation.mutateAsync(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const value: NotificationMutationsContextType = {
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationMutationsContext.Provider value={value}>
      {children}
    </NotificationMutationsContext.Provider>
  );
};