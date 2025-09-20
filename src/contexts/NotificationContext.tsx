import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

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
}

type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: number }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_UNREAD_COUNT'; payload: number };

interface NotificationContextType {
  state: NotificationState;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS': {
      const unreadCount = action.payload.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: action.payload,
        unreadCount
      };
    }
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications];
      const unreadCount = newNotifications.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: newNotifications,
        unreadCount
      };
    }
    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );
      const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount
      };
    }
    case 'MARK_ALL_AS_READ': {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true
      }));
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0
      };
    }
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false
};

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: number | null;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('http://localhost:4000/api/notifications', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_NOTIFICATIONS', payload: data.data });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        dispatch({ type: 'MARK_AS_READ', payload: id });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:4000/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:4000');
        
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