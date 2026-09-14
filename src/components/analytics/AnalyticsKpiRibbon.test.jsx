import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsKpiRibbon from './AnalyticsKpiRibbon';
import { PrivacyProvider } from '../../context/PrivacyContext';

describe('AnalyticsKpiRibbon', () => {
  const mockStocks = [
    { name: 'HDFC Bank Ltd', exposure: 250000, allocation: 25, directValue: 200000, indirectValue: 50000 },
    { name: 'ICICI Bank Ltd', exposure: 150000, allocation: 15, directValue: 150000, indirectValue: 0 },
    { name: 'TCS Ltd', exposure: 100000, allocation: 10, directValue: 0, indirectValue: 100000 },
    { name: 'Infosys Ltd', exposure: 80000, allocation: 8, directValue: 50000, indirectValue: 30000 },
    { name: 'Reliance Industries', exposure: 70000, allocation: 7, directValue: 70000, indirectValue: 0 },
    { name: 'L&T Ltd', exposure: 50000, allocation: 5, directValue: 0, indirectValue: 50000 },
  ];

  it('renders Total Equity, Top 5 Weight, Top 10 Weight, and Overlap correctly', () => {
    render(
      <PrivacyProvider>
        <AnalyticsKpiRibbon stocksData={mockStocks} />
      </PrivacyProvider>
    );

    // Total Count
    expect(screen.getByText('6 Unique Constituents')).toBeInTheDocument();

    // Top 5 sum: 25 + 15 + 10 + 8 + 7 = 65% (High Risk)
    expect(screen.getByText('65.0%')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();

    // Overlap count: HDFC Bank (direct + indirect) & Infosys (direct + indirect) = 2
    expect(screen.getByText('2 Companies')).toBeInTheDocument();
  });

  it('assigns Balanced badge when top 5 concentration is low', () => {
    const balancedStocks = [
      { name: 'A', exposure: 50, allocation: 5, directValue: 50, indirectValue: 0 },
      { name: 'B', exposure: 50, allocation: 5, directValue: 50, indirectValue: 0 },
      { name: 'C', exposure: 50, allocation: 5, directValue: 50, indirectValue: 0 },
      { name: 'D', exposure: 50, allocation: 5, directValue: 50, indirectValue: 0 },
      { name: 'E', exposure: 50, allocation: 5, directValue: 50, indirectValue: 0 },
    ];

    render(
      <PrivacyProvider>
        <AnalyticsKpiRibbon stocksData={balancedStocks} />
      </PrivacyProvider>
    );

    // Sum is 25% -> Balanced
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });
});
