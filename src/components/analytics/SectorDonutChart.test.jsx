import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SectorDonutChart from './SectorDonutChart';
import { PrivacyProvider } from '../../context/PrivacyContext';

describe('SectorDonutChart', () => {
  const mockSectors = [
    { sector: 'Financial Services', exposure: 1400000, allocation: 28.5 },
    { sector: 'Technology', exposure: 900000, allocation: 18.2 },
    { sector: 'Consumer Goods', exposure: 600000, allocation: 12.1 },
  ];

  it('renders sector list and total equity center stats', () => {
    render(
      <PrivacyProvider>
        <SectorDonutChart data={mockSectors} />
      </PrivacyProvider>
    );

    expect(screen.getByText('Sector Allocation')).toBeInTheDocument();
    expect(screen.getByText('3 Sectors')).toBeInTheDocument();

    // Verify sector rows render
    expect(screen.getByText('Financial Services')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Consumer Goods')).toBeInTheDocument();

    expect(screen.getByText('28.5%')).toBeInTheDocument();
    expect(screen.getByText('18.2%')).toBeInTheDocument();
  });

  it('triggers onSelectSector when a sector row is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <PrivacyProvider>
        <SectorDonutChart data={mockSectors} onSelectSector={handleSelect} />
      </PrivacyProvider>
    );

    const techRow = screen.getByText('Technology');
    fireEvent.click(techRow);

    expect(handleSelect).toHaveBeenCalledWith('Technology');
  });

  it('renders filter badge and allows clearing filter when a sector is selected', () => {
    const handleSelect = vi.fn();
    render(
      <PrivacyProvider>
        <SectorDonutChart
          data={mockSectors}
          selectedSector="Technology"
          onSelectSector={handleSelect}
        />
      </PrivacyProvider>
    );

    const filterBadge = screen.getByRole('button', { name: /Clear Technology filter/i });
    expect(filterBadge).toBeInTheDocument();

    fireEvent.click(filterBadge);
    expect(handleSelect).toHaveBeenCalledWith(null);
  });
});
