import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, ChevronUp } from 'lucide-react';
import { useCurrentUser } from '../../utils/queries';

interface UserMenuProps {
  onLogout: () => Promise<void>;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: currentUser } = useCurrentUser();

  // Helper function to construct absolute URLs for images
  const getAbsoluteImageUrl = (relativePath: string | null): string | null => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath; // Already absolute
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${apiBaseUrl}${relativePath}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleLogoutClick = async () => {
    setIsOpen(false);
    await onLogout();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center p-3 text-left hover:bg-muted/50 rounded-lg transition-colors duration-150 border-t border-border"
      >
        <img
          src={
            getAbsoluteImageUrl(currentUser.profilePictureUrl || null) || 
            `https://ui-avatars.com/api/?background=e0e7ff&color=3730a3&bold=true&name=${encodeURIComponent(currentUser.name || 'User')}`
          }
          alt=""
          className="w-10 h-10 rounded-lg"
        />
        <div className="flex-1 ml-3 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-card-foreground truncate">{currentUser.name || 'Loading...'}</h4>
            {currentUser.subscriptionStatus === 'active' ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                Pro
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                Free
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate block">{currentUser.email || 'Loading...'}</span>
        </div>
        <ChevronUp className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Content */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg z-20 py-2">
            {/* Company Name Label */}
            {currentUser.companyName && (
              <>
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-foreground">{currentUser.companyName}</p>
                </div>
                <div className="border-t border-border my-1"></div>
              </>
            )}

            {/* Settings Link */}
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <div className="border-t border-border my-1"></div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;