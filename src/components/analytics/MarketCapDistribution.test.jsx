import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketCapDistribution from './MarketCapDistribution';
import { PrivacyProvider } from '../../context/PrivacyContext';

describe('MarketCapDistribution', () => {
  const mockStocks = [
    { name: 'Reliance Industries', marketCap: 'Large Cap', exposure: 500000 },
    { name: 'Tata Motors Ltd', marketCap: 'Large Cap', exposure: 300000 },
    { name: 'Polycab India Ltd', marketCap: 'Mid Cap', exposure: 200000 },
    { name: 'CDSL', marketCap: 'Small Cap', exposure: 100000 },
  ];

  it('renders progress bar and cap cards with calculated percentages', () => {
    render(
      <PrivacyProvider>
        <MarketCapDistribution stocksData={mockStocks} />
      </PrivacyProvider>
    );

    expect(screen.getByText('Market Cap Breakdown')).toBeInTheDocument();
    expect(screen.getByText(/SEBI Distribution/i)).toBeInTheDocument();

    // Large Cap: 800000 / 1100000 = ~72.7%
    // Mid Cap: 200000 / 1100000 = ~18.2%
    // Small Cap: 100000 / 1100000 = ~9.1%
    expect(screen.getAllByText('Large Cap').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mid Cap').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Small Cap').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('72.7%')).toBeInTheDocument();
    expect(screen.getByText('18.2%')).toBeInTheDocument();
    expect(screen.getByText('9.1%')).toBeInTheDocument();
  });

  it('calls onSelectCap when a cap card is clicked', () => {
    const handleSelectCap = vi.fn();
    render(
      <PrivacyProvider>
        <MarketCapDistribution
          stocksData={mockStocks}
          selectedCap={null}
          onSelectCap={handleSelectCap}
        />
      </PrivacyProvider>
    );

    const midCapCard = screen.getByRole('button', { name: /Filter by Mid Cap/i });
    fireEvent.click(midCapCard);

    expect(handleSelectCap).toHaveBeenCalledWith('Mid Cap');
  });

  it('toggles cap off when clicking an already selected cap card', () => {
    const handleSelectCap = vi.fn();
    render(
      <PrivacyProvider>
        <MarketCapDistribution
          stocksData={mockStocks}
          selectedCap="Large Cap"
          onSelectCap={handleSelectCap}
        />
      </PrivacyProvider>
    );

    const largeCapCard = screen.getByRole('button', { name: /Filter by Large Cap/i });
    fireEvent.click(largeCapCard);

    expect(handleSelectCap).toHaveBeenCalledWith(null);
  });
});
