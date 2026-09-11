import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FundHoldingsBreakdown from './FundHoldingsBreakdown';
import { PrivacyProvider } from '../../context/PrivacyContext';
import * as apiModule from '../../services/apiClient';

const mockHolding = {
  assetId: 'fund-uuid-1',
  name: 'Parag Parikh Flexi Cap Fund',
  assetType: 'mutualFunds',
  category: 'Mutual Fund',
  isin: 'INF879O01019',
  currentValue: 100000,
  investedValue: 80000,
};

const mockFundData = {
  stocks: [
    { name: 'HDFC Bank Ltd.', weight: 8.5 },
    { name: 'ICICI Bank Ltd.', weight: 7.2 },
    { name: 'Infosys Ltd.', weight: 5.9 },
    { name: 'Reliance Industries Ltd.', weight: 5.3 },
    { name: 'Tata Consultancy Services', weight: 4.8 },
    { name: 'ITC Ltd.', weight: 4.1 },
  ],
  sectors: [
    { name: 'Financial Services', weight: 32.0 },
    { name: 'Technology', weight: 18.5 },
    { name: 'Energy', weight: 12.0 },
  ],
};

describe('FundHoldingsBreakdown', () => {
  beforeEach(() => {
    vi.spyOn(apiModule.api, 'getFundHoldings').mockResolvedValue(mockFundData);
    vi.spyOn(apiModule.api, 'syncFundHoldings').mockResolvedValue({ success: true, ...mockFundData });
  });

  it('renders header, title, and concentration metrics', async () => {
    render(
      <PrivacyProvider>
        <FundHoldingsBreakdown holding={mockHolding} />
      </PrivacyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fund Portfolio Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Underlying Assets')).toBeInTheDocument();
      expect(screen.getByText('Sector Allocation')).toBeInTheDocument();
    });

    // Top 5 sum = 8.5 + 7.2 + 5.9 + 5.3 + 4.8 = 31.7%
    expect(screen.getByText('31.7%')).toBeInTheDocument();
    // Constituents count
    expect(screen.getAllByText('6').length).toBeGreaterThan(0);
    // First stock
    expect(screen.getByText('HDFC Bank Ltd.')).toBeInTheDocument();
    expect(screen.getByText('8.50%')).toBeInTheDocument();
  });

  it('filters underlying assets based on search query', async () => {
    render(
      <PrivacyProvider>
        <FundHoldingsBreakdown holding={mockHolding} />
      </PrivacyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('HDFC Bank Ltd.')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search 6 underlying assets/i);
    fireEvent.change(searchInput, { target: { value: 'Infosys' } });

    expect(screen.getByText('Infosys Ltd.')).toBeInTheDocument();
    expect(screen.queryByText('HDFC Bank Ltd.')).not.toBeInTheDocument();
  });

  it('switches to Sector Allocation tab and displays sector cards', async () => {
    render(
      <PrivacyProvider>
        <FundHoldingsBreakdown holding={mockHolding} />
      </PrivacyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fund Portfolio Breakdown')).toBeInTheDocument();
    });

    const sectorTab = screen.getByText('Sector Allocation');
    fireEvent.click(sectorTab);

    expect(screen.getByText('Financial Services')).toBeInTheDocument();
    expect(screen.getByText('32.00%')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('18.50%')).toBeInTheDocument();
  });

  it('handles sync live button click', async () => {
    render(
      <PrivacyProvider>
        <FundHoldingsBreakdown holding={mockHolding} />
      </PrivacyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sync Live')).toBeInTheDocument();
    });

    const syncBtn = screen.getByText('Sync Live');
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(apiModule.api.syncFundHoldings).toHaveBeenCalledWith({
        assetId: 'fund-uuid-1',
        isin: 'INF879O01019',
      });
    });
  });
});
