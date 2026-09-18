import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DetailScreen from './DetailScreen';

vi.mock('../../context/PortfolioContext', () => ({
  usePortfolio: () => ({
    state: {
      stocks: { data: [] },
      mutualFunds: { data: [] },
      fds: { data: [] },
      etfs: { data: [] },
    },
  }),
}));

vi.mock('../../context/PrivacyContext', () => ({
  usePrivacy: () => ({
    isPrivacyMode: false,
  }),
}));

vi.mock('../../components/charts/CandlestickChart', () => ({
  default: () => <div data-testid="candlestick-chart">Chart</div>,
}));

vi.mock('../../components/portfolio/HoldingTradeHistory', () => ({
  default: () => <div data-testid="trade-history">Trade History</div>,
}));

vi.mock('../../components/portfolio/FundHoldingsBreakdown', () => ({
  default: () => <div data-testid="fund-breakdown">Fund Breakdown</div>,
}));

vi.mock('../../components/portfolio/HoldingActionModal', () => ({
  default: () => null,
}));

vi.mock('../../components/portfolio/FDActionModal', () => ({
  default: () => null,
}));

vi.mock('../News/CompanyReportsScreen', () => ({
  default: () => null,
}));

describe('DetailScreen Screener Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Screener button with correct URL for a stock holding', () => {
    const mockStockHolding = {
      assetId: 'stock-1',
      assetType: 'stocks',
      asset_type: 'STOCK',
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      sector: 'Energy',
      quantity: 10,
      currentPrice: 2800,
      investedValue: 25000,
      currentValue: 28000,
      dayChange: 25,
      dayChangePercent: 0.9,
    };

    render(
      <MemoryRouter>
        <DetailScreen holding={mockStockHolding} />
      </MemoryRouter>
    );

    const screenerLink = screen.getByRole('link', { name: /View RELIANCE on Screener.in/i });
    expect(screenerLink).toBeInTheDocument();
    expect(screenerLink).toHaveAttribute('href', 'https://www.screener.in/company/RELIANCE/');
    expect(screenerLink).toHaveAttribute('target', '_blank');
    expect(screenerLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sanitizes symbol with NSE: prefix and .NS suffix for Screener URL', () => {
    const mockStockHolding = {
      assetId: 'stock-2',
      assetType: 'stocks',
      asset_type: 'STOCK',
      symbol: 'NSE:TCS.NS',
      name: 'Tata Consultancy Services',
      sector: 'Technology',
      quantity: 5,
      currentPrice: 3500,
      investedValue: 15000,
      currentValue: 17500,
    };

    render(
      <MemoryRouter>
        <DetailScreen holding={mockStockHolding} />
      </MemoryRouter>
    );

    const screenerLink = screen.getByRole('link', { name: /View TCS on Screener.in/i });
    expect(screenerLink).toBeInTheDocument();
    expect(screenerLink).toHaveAttribute('href', 'https://www.screener.in/company/TCS/');
  });

  it('does NOT render Screener button for Fixed Deposit holdings', () => {
    const mockFdHolding = {
      assetId: 'fd-1',
      assetType: 'fds',
      asset_type: 'FD',
      symbol: 'HDFC_FD_01',
      name: 'HDFC Bank FD',
      principal: 100000,
      currentValue: 105000,
      interestRate: 7.25,
    };

    render(
      <MemoryRouter>
        <DetailScreen holding={mockFdHolding} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /Screener/i })).not.toBeInTheDocument();
  });

  it('does NOT render Screener button for Mutual Fund holdings', () => {
    const mockMfHolding = {
      assetId: 'mf-1',
      assetType: 'mutualFunds',
      asset_type: 'MF',
      category: 'Mutual Fund',
      symbol: '119551',
      name: 'Parag Parikh Flexi Cap Fund',
      currentNAV: 85.5,
      quantity: 500,
      investedValue: 35000,
      currentValue: 42750,
    };

    render(
      <MemoryRouter>
        <DetailScreen holding={mockMfHolding} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /Screener/i })).not.toBeInTheDocument();
  });
});
