import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaListAlt, FaCogs, FaSearch } from 'react-icons/fa';
import { cn } from '../../utils/cn.js';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <FaHome className="h-5 w-5" /> },
  { path: '/docs', label: 'Docs', icon: <FaBook className="h-5 w-5" /> },
  { path: '/workhub', label: 'Workhub', icon: <FaListAlt className="h-5 w-5" /> },
  { path: '/search', label: 'Search', icon: <FaSearch className="h-5 w-5" /> },
];

interface MobileBottomNavProps {
  className?: string;
  onMenuClick?: () => void;
}

export function MobileBottomNav({ className, onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t bg-card lg:hidden',
        className
      )}
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <ul className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all',
                  'touch-manipulation',
                  isActive
                    ? 'text-primary-foreground bg-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  'min-w-[64px]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="transition-transform active:scale-95">
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}

        {/* Settings/Menu button */}
        <li>
          <button
            onClick={onMenuClick}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all',
              'touch-manipulation',
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              'min-w-[64px]'
            )}
            aria-label="Open settings"
          >
            <span className="transition-transform active:scale-95">
              <FaCogs className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}