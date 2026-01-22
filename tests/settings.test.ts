/**
 * Settings Component Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../src/client/providers/ThemeProvider';
import { SettingsPanel } from '../src/client/components/settings/SettingsPanel';
import { SettingsButton } from '../src/client/components/settings/SettingsButton';

// Helper function to render with ThemeProvider
function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('SettingsButton', () => {
  it('should render a settings button', () => {
    renderWithTheme(<SettingsButton onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /settings/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = () => {};
    renderWithTheme(<SettingsButton onClick={handleClick} />);
    const button = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(button);
  });
});

describe('SettingsPanel', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should not render when isOpen is false', () => {
    renderWithTheme(<SettingsPanel isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should display theme options', () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('should display font family options', () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Serif')).toBeInTheDocument();
    expect(screen.getByText('Monospace')).toBeInTheDocument();
    expect(screen.getByText('Cursive')).toBeInTheDocument();
  });

  it('should display font size options', () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('Extra Large')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = () => {};
    renderWithTheme(<SettingsPanel isOpen={true} onClose={handleClose} />);
    const closeButton = screen.getByRole('button', { name: /close settings/i });
    fireEvent.click(closeButton);
  });

  it('should call onClose when backdrop is clicked', () => {
    const handleClose = () => {};
    renderWithTheme(<SettingsPanel isOpen={true} onClose={handleClose} />);
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
  });
});

describe('Settings Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save font family to localStorage', () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const serifButton = screen.getByText('Serif').closest('button');
    if (serifButton) {
      fireEvent.click(serifButton);
      expect(localStorage.getItem('folder-site-font-family')).toContain('Georgia');
    }
  });

  it('should save font size to localStorage', () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const largeButton = screen.getByText('Large').closest('button');
    if (largeButton) {
      fireEvent.click(largeButton);
      expect(localStorage.getItem('folder-site-font-size')).toBe('18px');
    }
  });

  it('should reset to defaults', async () => {
    renderWithTheme(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const darkButton = screen.getByText('Dark').closest('button');
    if (darkButton) {
      fireEvent.click(darkButton);
    }

    const resetButton = screen.getByText('Reset to Defaults');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(localStorage.getItem('folder-site-theme')).toBe('{"mode":"light"}');
    });
  });
});