import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from './AnalyticsPage';
import { PrivacyProvider } from '../../context/PrivacyContext';

// Mock usePortfolio hook
const mockStocksData = [
  { name: 'HDFC Bank Ltd', sector: 'Financial Services', marketCap: 'Large Cap', exposure: 250000, allocation: 25, directValue: 150000, indirectValue: 100000 },
  { name: 'TCS Ltd', sector: 'Technology', marketCap: 'Large Cap', exposure: 150000, allocation: 15, directValue: 150000, indirectValue: 0 },
  { name: 'ITC Ltd', sector: 'Consumer Goods', marketCap: 'Mid Cap', exposure: 100000, allocation: 10, directValue: 0, indirectValue: 100000 },
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

vi.mock('../../services/apiClient', () => ({
  api: {
    getStockLookthrough: vi.fn().mockResolvedValue({
      stock_name: 'HDFC Bank Ltd',
      total_exposure: 250000,
      direct_value: 150000,
      indirect_value: 100000,
      direct_holding: null,
      fund_holdings: [],
    }),
  },
}));

describe('AnalyticsPage Modernized Terminal', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders Analytics header, concentration KPIs, market cap gauge, sector allocation, and holdings explorer', () => {
    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getAllByText(/Total Equity/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Market Cap Breakdown')).toBeInTheDocument();
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

  it('filters holdings by Market Cap selection', () => {
    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    // Click Mid Cap card in the Market Cap breakdown
    const midCapCard = screen.getByRole('button', { name: /Filter by Mid Cap/i });
    fireEvent.click(midCapCard);

    // ITC is Mid Cap
    expect(screen.getAllByText('ITC Ltd').length).toBeGreaterThanOrEqual(1);
    // HDFC Bank and TCS are Large Cap
    expect(screen.queryByText('HDFC Bank Ltd')).not.toBeInTheDocument();
    expect(screen.queryByText('TCS Ltd')).not.toBeInTheDocument();
  });

  it('opens Look-Through Drawer when clicking on a stock row', async () => {
    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    // Click on HDFC Bank Ltd row
    const stockRow = screen.getAllByText('HDFC Bank Ltd')[0];
    fireEvent.click(stockRow);

    // Lookthrough drawer should open
    await waitFor(() => {
      expect(screen.getByLabelText('Close drawer')).toBeInTheDocument();
      expect(screen.getByText('Zerodha Console Look-Through X-Ray')).toBeInTheDocument();
    });
  });

  it('triggers CSV export without errors', () => {
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    render(
      <MemoryRouter>
        <PrivacyProvider>
          <AnalyticsPage />
        </PrivacyProvider>
      </MemoryRouter>
    );

    const exportBtn = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();

    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
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
