import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppHeader } from '../AppHeader';

describe('AppHeader', () => {
  it('renders header with user space by default', () => {
    render(<AppHeader userName="Amina N." />);
    expect(screen.getByTestId('app-header')).toHaveClass('bg-primary');
    expect(screen.getByText('Amina N.')).toBeInTheDocument();
    expect(screen.getByText(/Espace utilisateur/)).toBeInTheDocument();
  });

  it('renders caregiver space with bell and notification badge', () => {
    const handleNotif = vi.fn();
    render(
      <AppHeader
        spaceTheme="care"
        userName="Dr. Marc Eto'o"
        notificationCount={4}
        onNotificationClick={handleNotif}
      />
    );
    expect(screen.getByTestId('app-header')).toHaveClass('bg-care');
    expect(screen.getByText(/Espace soignant/)).toBeInTheDocument();
    expect(screen.getByTestId('header-notification-badge')).toHaveTextContent('4');

    fireEvent.click(screen.getByTestId('header-notification-btn'));
    expect(handleNotif).toHaveBeenCalledTimes(1);
  });

  it('renders logout button when onLogout is provided', () => {
    const handleLogout = vi.fn();
    render(<AppHeader onLogout={handleLogout} />);
    const logoutBtn = screen.getByText('Déconnexion');
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
