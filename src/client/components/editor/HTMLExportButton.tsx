/**
 * HTML Export Button Component
 * 
 * React component for exporting content to HTML format.
 * Features:
 * - One-click HTML export
 * - Progress indication
 * - Error handling
 * - Theme support
 * - Customizable options
 */

import { useState } from 'react';
import { FiLoader, FiCheckCircle, FiAlertCircle, FiFile } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';
import { HTMLExporter } from '../../../server/lib/html-exporter.js';
import type { HTMLExportOptions, HTMLExportProgress } from '../../../types/html-export.js';
import type { ThemeMode } from '../../../types/theme.js';

export interface HTMLExportButtonProps {
  /** Content to export */
  content: string;
  /** Filename for the HTML */
  filename?: string;
  /** Export options */
  options?: Partial<HTMLExportOptions>;
  /** Theme mode */
  theme?: ThemeMode;
  /** Button label */
  label?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Show progress */
  showProgress?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback on export start */
  onExportStart?: () => void;
  /** Callback on export complete */
  onExportComplete?: (result: { success: boolean; size?: number }) => void;
  /** Callback on export error */
  onExportError?: (error: string) => void;
}

/**
 * HTML Export Button Component
 */
export function HTMLExportButton({
  content,
  filename = 'document.html',
  options = {},
  theme = 'light',
  label = 'Export HTML',
  size = 'md',
  variant = 'default',
  showProgress = true,
  disabled = false,
  className,
  onExportStart,
  onExportComplete,
  onExportError,
}: HTMLExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<HTMLExportProgress | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * Handle HTML export
   */
  const handleExport = async () => {
    if (isExporting || disabled || !content) {
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('idle');
      setErrorMessage('');

      if (onExportStart) {
        onExportStart();
      }

      // Create exporter with options
      const exporter = new HTMLExporter({
        ...options,
        theme,
      });

      // Set progress callback
      if (showProgress) {
        exporter.onProgress((progressData) => {
          setProgress(progressData);
        });
      }

      // Export and download
      await exporter.downloadHTML(content, filename);

      // Success
      setExportStatus('success');
      setProgress(null);

      if (onExportComplete) {
        onExportComplete({ success: true });
      }

      // Reset status after 2 seconds
      setTimeout(() => {
        setExportStatus('idle');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export HTML';
      setExportStatus('error');
      setErrorMessage(message);
      setProgress(null);

      if (onExportError) {
        onExportError(message);
      }

      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle');
        setErrorMessage('');
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Get button size classes
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      case 'md':
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  /**
   * Get button variant classes
   */
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-border bg-transparent hover:bg-accent';
      case 'ghost':
        return 'bg-transparent hover:bg-accent';
      case 'default':
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };

  /**
   * Get button icon
   */
  const getIcon = () => {
    if (exportStatus === 'success') {
      return <FiCheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (exportStatus === 'error') {
      return <FiAlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (isExporting) {
      return <FiLoader className="h-4 w-4 animate-spin" />;
    }
    return <FiFile className="h-4 w-4" />;
  };

  /**
   * Get button label
   */
  const getLabel = () => {
    if (exportStatus === 'success') {
      return 'Exported!';
    }
    if (exportStatus === 'error') {
      return 'Export Failed';
    }
    if (isExporting && progress) {
      return progress.message || 'Exporting...';
    }
    if (isExporting) {
      return 'Exporting...';
    }
    return label;
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting || !content}
        className={cn(
          'inline-flex items-center gap-2 rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          getSizeClasses(),
          getVariantClasses(),
          className
        )}
        title={errorMessage || 'Export content as HTML'}
      >
        {getIcon()}
        <span>{getLabel()}</span>
        {isExporting && showProgress && progress && (
          <span className="text-xs opacity-75">
            ({Math.round(progress.progress)}%)
          </span>
        )}
      </button>

      {/* Progress bar */}
      {isExporting && showProgress && progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-md bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      )}

      {/* Error message tooltip */}
      {exportStatus === 'error' && errorMessage && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-md bg-destructive px-3 py-2 text-xs text-destructive-foreground shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Compact HTML Export Button (icon only)
 */
export function HTMLExportButtonCompact({
  content,
  filename = 'document.html',
  options = {},
  theme = 'light',
  disabled = false,
  className,
  onExportStart,
  onExportComplete,
  onExportError,
}: Omit<HTMLExportButtonProps, 'label' | 'size' | 'variant' | 'showProgress'>) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    if (isExporting || disabled || !content) {
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('idle');

      if (onExportStart) {
        onExportStart();
      }

      const exporter = new HTMLExporter({
        ...options,
        theme,
      });

      await exporter.downloadHTML(content, filename);

      setExportStatus('success');

      if (onExportComplete) {
        onExportComplete({ success: true });
      }

      setTimeout(() => {
        setExportStatus('idle');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export HTML';
      setExportStatus('error');

      if (onExportError) {
        onExportError(message);
      }

      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = () => {
    if (exportStatus === 'success') {
      return <FiCheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (exportStatus === 'error') {
      return <FiAlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (isExporting) {
      return <FiLoader className="h-4 w-4 animate-spin" />;
    }
    return <FiFile className="h-4 w-4" />;
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || !content}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 transition-colors',
        'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      title="Export as HTML"
    >
      {getIcon()}
    </button>
  );
}

export default HTMLExportButton;
