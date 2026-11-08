import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KpiCard } from '../KpiCard';

describe('KpiCard', () => {
  it('renders value and label', () => {
    render(<KpiCard value={42} label="Patients actifs" />);
    expect(screen.getByTestId('kpi-value')).toHaveTextContent('42');
    expect(screen.getByTestId('kpi-label')).toHaveTextContent('Patients actifs');
  });

  it('renders with space color and icon', () => {
    render(
      <KpiCard
        value="88 %"
        label="Taux"
        color="care"
        icon={<span>Icone</span>}
      />
    );
    expect(screen.getByTestId('kpi-left-bar')).toHaveClass('bg-care');
    expect(screen.getByTestId('kpi-value')).toHaveClass('text-care');
    expect(screen.getByText('Icone')).toBeInTheDocument();
  });

  it('handles click event and keyboard Enter navigation', () => {
    const handleClick = vi.fn();
    render(
      <KpiCard
        value={10}
        label="Alertes"
        subtitle="3 nouvelles"
        onClick={handleClick}
      />
    );
    const card = screen.getByTestId('kpi-card');
    expect(screen.getByText('3 nouvelles')).toBeInTheDocument();

    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
