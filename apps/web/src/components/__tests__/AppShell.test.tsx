import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../AppShell';

describe('AppShell', () => {
  it('renders header, sidebar and children', () => {
    render(
      <MemoryRouter>
        <AppShell
          space="care"
          userName="Dr. Test"
          unreadNotifications={1}
          navItems={[{ key: 'patients', label: 'Patients', path: '/patients' }]}
        >
          <div>Contenu Principal</div>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('Contenu Principal')).toBeInTheDocument();
  });
});
