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

  it('toggles View All Sectors when more than 7 sectors exist', () => {
    const manySectors = Array.from({ length: 10 }, (_, i) => ({
      sector: `Sector ${i + 1}`,
      exposure: 100000 * (10 - i),
      allocation: 10 - i,
    }));

    render(
      <PrivacyProvider>
        <SectorDonutChart data={manySectors} />
      </PrivacyProvider>
    );

    // Initial state: Top 7 visible, 8th is not
    expect(screen.getByText('Sector 1')).toBeInTheDocument();
    expect(screen.getByText('Sector 7')).toBeInTheDocument();
    expect(screen.queryByText('Sector 8')).not.toBeInTheDocument();

    // Toggle button should be present
    const toggleBtn = screen.getByRole('button', { name: /View all 10 sectors/i });
    expect(toggleBtn).toBeInTheDocument();

    // Click toggle to expand
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Sector 8')).toBeInTheDocument();
    expect(screen.getByText('Sector 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Collapse to top 7 sectors/i })).toBeInTheDocument();
  });

  it('auto-expands when a sector beyond top 7 is selected', () => {
    const manySectors = Array.from({ length: 10 }, (_, i) => ({
      sector: `Sector ${i + 1}`,
      exposure: 100000 * (10 - i),
      allocation: 10 - i,
    }));

    render(
      <PrivacyProvider>
        <SectorDonutChart data={manySectors} selectedSector="Sector 9" />
      </PrivacyProvider>
    );

    // Should auto-expand so Sector 9 is in document (in filter badge, donut center, and list row)
    expect(screen.getAllByText('Sector 9').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Collapse to top 7 sectors/i })).toBeInTheDocument();
  });
});
