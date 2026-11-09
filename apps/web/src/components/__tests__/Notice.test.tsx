import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Notice } from '../Notice';

describe('Notice', () => {
  it('renders notice text', () => {
    render(<Notice>Attention requise</Notice>);
    expect(screen.getByText('Attention requise')).toBeInTheDocument();
  });

  it('applies warning styling by default', () => {
    render(<Notice>Attention</Notice>);
    expect(screen.getByRole('alert')).toHaveClass('bg-warning-50');
  });

  it('supports danger and info variants', () => {
    const { rerender } = render(<Notice variant="danger">Alerte</Notice>);
    expect(screen.getByRole('alert')).toHaveClass('bg-danger-50');

    rerender(<Notice variant="info">Info</Notice>);
    expect(screen.getByRole('alert')).toHaveClass('bg-primary-50');
  });
});

