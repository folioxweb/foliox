import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from './AnalyticsPage';
import { PrivacyProvider } from '../../context/PrivacyContext';

// Mock usePortfolio hook
const mockStocksData = [
  { name: 'HDFC Bank Ltd', sector: 'Financial Services', exposure: 250000, allocation: 25, directValue: 150000, indirectValue: 100000 },
  { name: 'TCS Ltd', sector: 'Technology', exposure: 150000, allocation: 15, directValue: 150000, indirectValue: 0 },
  { name: 'ITC Ltd', sector: 'Consumer Goods', exposure: 100000, allocation: 10, directValue: 0, indirectValue: 100000 },
];

const mockSectorData = [
  { sector: 'Financial Services', exposure: 250000, allocation: 50 },
  { sector: 'Technology', exposure: 150000, allocation: 30 },
  { sector: 'Consumer Goods', exposure: 100000, allocation: 20 },
];

vi.mock('../../context/PortfolioContext', () => ({
  usePortfolio: () => ({
    state: {
      overallSectorAllocation: { data: mockSectorData, loading: false },
      stocksAllocation: { data: mockStocksData, loading: false },
    },
    refreshAll: vi.fn(),
    refreshing: false,
  }),
}));

vi.mock('../../hooks/usePageScrollRestoration', () => ({
  default: () => ({ current: null }),
}));

describe('AnalyticsPage Modernized Terminal', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders Analytics header, concentration KPIs, sector allocation, and holdings explorer', () => {
    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getAllByText(/Total Equity/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sector Allocation')).toBeInTheDocument();
    expect(screen.getByText(/Holdings Explorer/i)).toBeInTheDocument();

    // Verify all 3 stocks exist
    expect(screen.getAllByText('HDFC Bank Ltd').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TCS Ltd').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ITC Ltd').length).toBeGreaterThanOrEqual(1);
  });

  it('filters holdings by source chip (Direct Only)', () => {
    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    // Click Direct Demat filter chip
    const directChip = screen.getByRole('button', { name: /Direct Demat/i });
    fireEvent.click(directChip);

    // HDFC Bank (has direct) and TCS (has direct) should be visible
    expect(screen.getAllByText('HDFC Bank Ltd').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TCS Ltd').length).toBeGreaterThanOrEqual(1);
    // ITC (only via funds, directValue = 0) should NOT be visible
    expect(screen.queryByText('ITC Ltd')).not.toBeInTheDocument();
  });

  it('filters holdings by search input', () => {
    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search across 3 holdings/i);
    fireEvent.change(searchInput, { target: { value: 'TCS' } });

    expect(screen.getAllByText('TCS Ltd').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('HDFC Bank Ltd')).not.toBeInTheDocument();
  });
});
