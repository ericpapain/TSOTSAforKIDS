import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Enregistrer</Button>);
    expect(screen.getByText('Enregistrer')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Action</Button>);
    fireEvent.click(screen.getByText('Action'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state and prevents click', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Désactivé</Button>);
    const btn = screen.getByText('Désactivé');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies solid and outline variants', () => {
    const { rerender } = render(<Button variant="solid" color="care">Soignant</Button>);
    expect(screen.getByText('Soignant')).toHaveClass('bg-care');

    rerender(<Button variant="outline" color="care">Soignant</Button>);
    expect(screen.getByText('Soignant')).toHaveClass('text-care');
  });
});
