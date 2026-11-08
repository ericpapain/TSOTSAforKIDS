import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ZScoreChart } from '../ZScoreChart';

describe('ZScoreChart', () => {
  const points = [
    { date: 'J0', zScore: -2.5, label: 'Visite 1' },
    { date: 'J14', zScore: -1.8, label: 'Visite 2' },
    { date: 'J28', zScore: -0.9, label: 'Visite 3' },
  ];

  it('renders chart bands', () => {
    render(<ZScoreChart points={points} />);
    expect(screen.getByTestId('zscore-chart')).toBeInTheDocument();
    expect(screen.getByTestId('band-normal')).toBeInTheDocument();
    expect(screen.getByTestId('band-warning')).toBeInTheDocument();
    expect(screen.getByTestId('band-danger')).toBeInTheDocument();
    expect(screen.getByTestId('line-z0')).toBeInTheDocument();
  });

  it('renders chart points and values', () => {
    render(<ZScoreChart points={points} />);
    expect(screen.getByTestId('zscore-point-0')).toBeInTheDocument();
    expect(screen.getByTestId('zscore-point-1')).toBeInTheDocument();
    expect(screen.getByTestId('zscore-point-2')).toBeInTheDocument();
    expect(screen.getByText('-2.5')).toBeInTheDocument();
    expect(screen.getByText('-1.8')).toBeInTheDocument();
    expect(screen.getByText('-0.9')).toBeInTheDocument();
    expect(screen.getByTestId('zscore-curve')).toBeInTheDocument();
  });

  it('handles single point and positive z-score', () => {
    render(<ZScoreChart points={[{ date: 'J0', zScore: 1.2 }]} />);
    expect(screen.getByText('+1.2')).toBeInTheDocument();
  });
});
