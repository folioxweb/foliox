import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StockLookthroughDrawer from './StockLookthroughDrawer';
import { PrivacyProvider } from '../../context/PrivacyContext';
import { api } from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  api: {
    getStockLookthrough: vi.fn(),
  },
}));

describe('StockLookthroughDrawer', () => {
  const mockStock = {
    name: 'HDFC Bank Ltd',
    sector: 'Financial Services',
    marketCap: 'Large Cap',
    exposure: 250000,
    allocation: 12.5,
    directValue: 150000,
    indirectValue: 100000,
  };

  const mockApiData = {
    stock_name: 'HDFC Bank Ltd',
    total_exposure: 250000,
    direct_value: 150000,
    indirect_value: 100000,
    direct_holding: {
      quantity: 100,
      average_price: 1400,
      current_price: 1500,
      current_value: 150000,
      pnl: 10000,
      pnl_percentage: 7.14,
    },
    fund_holdings: [
      {
        fund_name: 'Parag Parikh Flexi Cap Fund',
        scheme_category: 'Flexi Cap',
        weight_percentage: 7.8,
        user_exposure: 65000,
      },
      {
        fund_name: 'Mirae Asset Large Cap Fund',
        scheme_category: 'Large Cap',
        weight_percentage: 8.5,
        user_exposure: 35000,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <PrivacyProvider>
        <StockLookthroughDrawer stock={mockStock} isOpen={false} onClose={vi.fn()} />
      </PrivacyProvider>
    );

    expect(screen.queryByText('HDFC Bank Ltd')).not.toBeInTheDocument();
  });

  it('renders stock details and fetches lookthrough breakdown when open', async () => {
    api.getStockLookthrough.mockResolvedValueOnce(mockApiData);

    const handleClose = vi.fn();
    render(
      <PrivacyProvider>
        <StockLookthroughDrawer stock={mockStock} isOpen={true} onClose={handleClose} />
      </PrivacyProvider>
    );

    // Initial stock header
    expect(screen.getByText('HDFC Bank Ltd')).toBeInTheDocument();
    expect(screen.getByText('Financial Services')).toBeInTheDocument();

    // Verify API called
    expect(api.getStockLookthrough).toHaveBeenCalledWith('HDFC Bank Ltd');

    // Wait for lookthrough data to populate
    await waitFor(() => {
      expect(screen.getByText('Parag Parikh Flexi Cap Fund')).toBeInTheDocument();
      expect(screen.getByText('Mirae Asset Large Cap Fund')).toBeInTheDocument();
    });

    // Check direct Demat details
    expect(screen.getByText(/Direct Demat/i)).toBeInTheDocument();
    expect(screen.getByText(/100 shares/i)).toBeInTheDocument();
    expect(screen.getByText(/7\.14%/i)).toBeInTheDocument();

    // Test close button
    const closeBtn = screen.getByLabelText('Close drawer');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
