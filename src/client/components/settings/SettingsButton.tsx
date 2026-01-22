import { FaCog } from 'react-icons/fa';
import { cn } from '../../utils/cn.js';

interface SettingsButtonProps {
  onClick: () => void;
  className?: string;
}

export function SettingsButton({ onClick, className }: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md p-2 hover:bg-muted transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label="Open settings"
      title="Settings"
    >
      <FaCog className="h-5 w-5" />
    </button>
  );
}