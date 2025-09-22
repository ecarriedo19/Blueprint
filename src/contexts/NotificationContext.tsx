import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useNotificationsList } from '../utils/queries';
import { useNotificationMutations } from './NotificationMutations';

interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean };

interface NotificationContextType {
  state: NotificationState;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications];
      const unreadCount = newNotifications.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: newNotifications,
        unreadCount
      };
    }
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload
      };
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: false,
  error: null
};

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: number | null;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId }) => {
  const [wsState, dispatch] = useReducer(notificationReducer, initialState);
  
  // Use React Query for data fetching
  const { data: notifications = [], isLoading, error, refetch } = useNotificationsList();
  
  // Use React Query mutations
  const { markAsRead: markAsReadMutation, markAllAsRead: markAllAsReadMutation } = useNotificationMutations();

  // Calculate unread count from React Query data
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  // Create combined state from React Query data and WebSocket state
  const state: NotificationState = {
    notifications: [...wsState.notifications, ...notifications].reduce((acc, notification) => {
      // Remove duplicates, preferring WebSocket notifications (more recent)
      const existingIndex = acc.findIndex(n => n.id === notification.id);
      if (existingIndex >= 0) {
        return acc;
      }
      return [...acc, notification];
    }, [] as Notification[]),
    unreadCount,
    isConnected: wsState.isConnected,
    isLoading,
    error: error?.message || null
  };

  // Fetch notifications (just refetch React Query)
  const fetchNotifications = useCallback(() => {
    refetch();
  }, [refetch]);

  // Wrap mutations with error handling
  const markAsRead = useCallback(async (id: number) => {
    try {
      await markAsReadMutation(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [markAllAsReadMutation]);

  // WebSocket connection management
  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        // Connect directly to WebSocket server (can't use Vite proxy for WebSocket)
        const wsUrl = 'ws://localhost:4000';
        console.log('Connecting to WebSocket:', wsUrl);
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
          
          // Authenticate with server
          if (ws) {
            ws.send(JSON.stringify({
              type: 'auth',
              userId: userId
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'notification') {
              dispatch({ type: 'ADD_NOTIFICATION', payload: message.data });
            } else if (message.type === 'auth_success') {
              console.log('WebSocket authenticated successfully');
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [userId]);

  // Fetch initial notifications when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const contextValue: NotificationContextType = {
    state,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};