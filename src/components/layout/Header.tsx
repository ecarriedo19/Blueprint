import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import InlineSearch from './InlineSearch.tsx';
import CreateDropdown from './CreateDropdown.tsx';

interface HeaderProps {
  notifications: any[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  return (
    <header className="flex items-center justify-between w-full h-16 px-6 bg-card border-b border-border">
      {/* Left side - Inline Search */}
      <InlineSearch />

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Create Dropdown */}
        <CreateDropdown />

        {/* Settings Link */}
        <Link 
          to="/settings"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-150"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Notification Bell */}
        <NotificationBell 
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />
      </div>
    </header>
  );
};

export default Header;