import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders switch in checked state', () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).toHaveClass('bg-primary');
  });

  it('renders switch in unchecked state', () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveClass('bg-toggle-off');
  });

  it('triggers onChange with inverted state when clicked', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('does not trigger onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} disabled />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports color props', () => {
    render(<Toggle checked={true} onChange={vi.fn()} color="care" />);
    expect(screen.getByRole('switch')).toHaveClass('bg-care');
  });
});
