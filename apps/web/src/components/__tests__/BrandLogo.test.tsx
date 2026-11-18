import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogo } from '../BrandLogo';

describe('BrandLogo', () => {
  it('renders the brand logo with TSOTSA for KIDS in Bleu Nuit and Orange', () => {
    render(<BrandLogo variant="light" size={34} />);
    const tsotsa = screen.getByText('TSOTSA');
    expect(tsotsa).toBeInTheDocument();
    expect(tsotsa).toHaveStyle({ color: '#092D73' });

    const forElement = screen.getByText('for');
    expect(forElement).toBeInTheDocument();
    expect(forElement).toHaveStyle({ color: '#F38B1F' });

    const kids = screen.getByText('KIDS');
    expect(kids).toBeInTheDocument();
    expect(kids).toHaveStyle({ color: '#092D73' });
  });

  it('renders in dark variant with white text and disk', () => {
    const { container } = render(<BrandLogo variant="dark" size={34} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('TSOTSA')).toHaveStyle({ color: '#FFFFFF' });
    expect(screen.getByText('for')).toHaveStyle({ color: '#FFFFFF' });
    expect(screen.getByText('KIDS')).toHaveStyle({ color: '#FFFFFF' });
  });

  it('renders symbol only', () => {
    render(<BrandLogo variant="light" mode="symbol" />);
    expect(screen.getByTestId('brand-logo-symbol')).toBeInTheDocument();
    expect(screen.queryByText('TSOTSA')).toBeNull();
  });

  it('renders wordmark only', () => {
    render(<BrandLogo variant="light" mode="word" />);
    expect(screen.getByText('TSOTSA')).toBeInTheDocument();
    expect(screen.getByText('for')).toBeInTheDocument();
    expect(screen.getByText('KIDS')).toBeInTheDocument();
    expect(screen.queryByTestId('brand-logo-symbol')).toBeNull();
  });

  it('renders full image mode', () => {
    render(<BrandLogo mode="image" size={48} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/logo.png');
  });
});