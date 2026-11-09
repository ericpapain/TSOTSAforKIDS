import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders content with card styling', () => {
    render(<Card>Contenu de test</Card>);
    const cardEl = screen.getByText('Contenu de test');
    expect(cardEl).toBeInTheDocument();
    expect(cardEl).toHaveClass('bg-white');
    expect(cardEl).toHaveClass('rounded-card');
  });

  it('merges custom className', () => {
    render(<Card className="p-8">Custom</Card>);
    expect(screen.getByText('Custom')).toHaveClass('p-8');
  });
});

