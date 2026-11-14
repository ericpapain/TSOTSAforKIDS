import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogo } from '../BrandLogo';

describe('BrandLogo', () => {
  it('renders the brand logo with TSOTSA and KIDS text', () => {
    render(<BrandLogo variant="light" size={34} />);
    expect(screen.getByText('TSOTSA')).toBeInTheDocument();
    expect(screen.getByText('4KIDS')).toBeInTheDocument();
  });

  it('renders in dark variant', () => {
    const { container } = render(<BrandLogo variant="dark" size={34} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('TSOTSA')).toHaveStyle({ color: '#FFFFFF' });
  });

  it('renders symbol only', () => {
    render(<BrandLogo variant="light" mode="symbol" />);
    expect(screen.getByTestId('brand-logo-symbol')).toBeInTheDocument();
    expect(screen.queryByText('TSOTSA')).toBeNull();
  });

  it('renders wordmark only', () => {
    render(<BrandLogo variant="light" mode="word" />);
    expect(screen.getByText('TSOTSA')).toBeInTheDocument();
    expect(screen.getByText('4KIDS')).toBeInTheDocument();
    expect(screen.queryByTestId('brand-logo-symbol')).toBeNull();
  });
});