import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HoldingsConsoleTable from './HoldingsConsoleTable';
import { PrivacyProvider } from '../../context/PrivacyContext';

describe('HoldingsConsoleTable', () => {
  const mockItems = [
    {
      name: 'HDFC Bank Ltd',
      sector: 'Financial Services',
      marketCap: 'Large Cap',
      exposure: 250000,
      allocation: 25.5,
      directValue: 150000,
      indirectValue: 100000,
    },
    {
      name: 'TCS Ltd',
      sector: 'Technology',
      marketCap: 'Large Cap',
      exposure: 180000,
      allocation: 18.2,
      directValue: 180000,
      indirectValue: 0,
    },
  ];

  it('renders table headers and row items on desktop', () => {
    render(
      <PrivacyProvider>
        <HoldingsConsoleTable items={mockItems} totalFilteredCount={2} />
      </PrivacyProvider>
    );

    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Direct Demat')).toBeInTheDocument();
    expect(screen.getByText('Total Exposure')).toBeInTheDocument();

    expect(screen.getAllByText('HDFC Bank Ltd').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TCS Ltd').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Large Cap').length).toBeGreaterThanOrEqual(2);
  });

  it('renders Direct + Funds overlap badge for dual exposure', () => {
    render(
      <PrivacyProvider>
        <HoldingsConsoleTable items={mockItems} totalFilteredCount={2} />
      </PrivacyProvider>
    );

    expect(screen.getAllByText('Direct + Funds').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Direct').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers onSelectStock when a row is clicked', () => {
    const handleSelectStock = vi.fn();
    render(
      <PrivacyProvider>
        <HoldingsConsoleTable
          items={mockItems}
          totalFilteredCount={2}
          onSelectStock={handleSelectStock}
        />
      </PrivacyProvider>
    );

    const hdfcRow = screen.getAllByText('HDFC Bank Ltd')[0];
    fireEvent.click(hdfcRow);

    expect(handleSelectStock).toHaveBeenCalledWith(mockItems[0]);
  });

  it('renders empty state when no items match', () => {
    render(
      <PrivacyProvider>
        <HoldingsConsoleTable items={[]} totalFilteredCount={0} />
      </PrivacyProvider>
    );

    expect(screen.getByText('No holdings found')).toBeInTheDocument();
  });

  it('calls onLoadMore when pagination button is clicked', () => {
    const handleLoadMore = vi.fn();
    render(
      <PrivacyProvider>
        <HoldingsConsoleTable
          items={mockItems}
          totalFilteredCount={100}
          displayCount={50}
          onLoadMore={handleLoadMore}
        />
      </PrivacyProvider>
    );

    const loadMoreBtn = screen.getByRole('button', { name: /Show Next 50 Holdings/i });
    fireEvent.click(loadMoreBtn);

    expect(handleLoadMore).toHaveBeenCalledTimes(1);
  });
});
