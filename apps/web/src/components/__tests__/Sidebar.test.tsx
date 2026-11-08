import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

const items = [
  { key: 'home', label: 'Accueil', path: '/', icon: 'dashboard' },
  { key: 'patients', label: 'Patients', path: '/soignant/personnes', icon: 'patients', badge: 2 },
];

describe('Sidebar', () => {
  it('renders navigation items and badges', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar items={items} spaceTheme="care" />
      </MemoryRouter>
    );
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('sets active link style according to current route', () => {
    render(
      <MemoryRouter initialEntries={['/soignant/personnes']}>
        <Sidebar items={items} spaceTheme="care" />
      </MemoryRouter>
    );
    const link = screen.getByTestId('sidebar-item-patients');
    expect(link).toHaveAttribute('href', '/soignant/personnes');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('bg-care-50');
    expect(link).toHaveClass('text-care');
  });
});
