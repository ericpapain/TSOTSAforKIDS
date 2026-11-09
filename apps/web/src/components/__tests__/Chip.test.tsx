import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chip } from '../Chip';

describe('Chip', () => {
  it('renders label correctly', () => {
    render(<Chip label="Statut actif" />);
    expect(screen.getByText('Statut actif')).toBeInTheDocument();
  });

  it('renders children if label is omitted', () => {
    render(<Chip>En attente</Chip>);
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('supports variants and custom colors', () => {
    const { rerender } = render(<Chip label="Admin" variant="admin" />);
    expect(screen.getByText('Admin')).toHaveStyle({ backgroundColor: 'rgb(238, 241, 245)' });

    rerender(<Chip label="Danger" variant="danger" />);
    expect(screen.getByText('Danger')).toHaveStyle({ backgroundColor: 'rgb(253, 236, 236)' });

    rerender(<Chip label="Warning" variant="warning" />);
    expect(screen.getByText('Warning')).toHaveStyle({ backgroundColor: 'rgb(255, 244, 214)' });

    rerender(
      <Chip
        label="Custom"
        backgroundColor="#E8F0FA"
        textColor="#1F5FA8"
      />
    );
    expect(screen.getByText('Custom')).toHaveStyle({ backgroundColor: 'rgb(232, 240, 250)' });
  });
});
