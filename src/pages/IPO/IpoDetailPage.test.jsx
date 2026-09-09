import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import IpoDetailPage from './IpoDetailPage';
import { api } from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  api: {
    getIpoById: vi.fn(),
  },
}));

vi.mock('../../hooks/usePageScrollRestoration', () => ({
  default: () => ({ current: null }),
}));

vi.mock('../../components/ipo/IpoGmpHistoryChart', () => ({
  default: () => <div data-testid="gmp-history-chart">Chart</div>,
}));

describe('IpoDetailPage Component', () => {
  const mockIpo = {
    id: 'test-ipo-123',
    name: 'Premier Energies Ltd',
    category: 'Mainboard IPO',
    status: 'Open',
    statusBadge: 'Open',
    gmpAmount: 390,
    gmpPercent: 86.67,
    priceStr: '450',
    priceNum: 450,
    lotSize: 33,
    minInvestment: 14850,
    expectedProfit: 12870,
    ipoSize: '₹2,830 Cr',
    subscription: '74.38x',
    subscriptionDetails: {
      total: '74.38x',
      totalNum: 74.38,
      qib: '216.67x',
      nii: '50.04x',
      shni: '38.2x',
      bhni: '56.0x',
      rii: '7.68x',
      anchorAvailable: true,
    },
    openDate: '27 Aug 2024',
    closeDate: '29 Aug 2024',
    boaDate: '30 Aug 2024',
    listingDate: '03 Sep 2024',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then renders detail content without crashing', async () => {
    api.getIpoById.mockResolvedValueOnce(mockIpo);

    render(
      <MemoryRouter initialEntries={['/ipo/test-ipo-123']}>
        <Routes>
          <Route path="/ipo/:id" element={<IpoDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial loading indicator
    expect(screen.getByText(/Loading IPO details/i)).toBeInTheDocument();

    // Wait for content to appear
    await waitFor(() => {
      expect(screen.getAllByText('Premier Energies Ltd').length).toBeGreaterThanOrEqual(1);
    });

    // Verify sHNI & bHNI calculation rendered
    expect(screen.getByText(/Application Categories & Minimum Bids/i)).toBeInTheDocument();
    expect(screen.getByText(/Small HNI \(sHNI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Big HNI \(bHNI\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Retail \(RII\)/i).length).toBeGreaterThanOrEqual(1);

    // Verify sHNI min calculation: 14 lots (462 shares @ 14,850 = ₹2,07,900)
    expect(screen.getByText(/Select sHNI Min \(14 Lots\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Select bHNI Min \(68 Lots\)/i)).toBeInTheDocument();
  });
});
