import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HoldingsFilterBar from './HoldingsFilterBar';

describe('HoldingsFilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    sourceFilter: 'all',
    onSourceFilterChange: vi.fn(),
    selectedSector: null,
    onSectorChange: vi.fn(),
    sectors: ['Financial Services', 'Technology', 'Consumer Goods'],
    selectedCap: null,
    onCapChange: vi.fn(),
    sortBy: 'exposure',
    onSortByChange: vi.fn(),
    sortDirection: 'desc',
    onSortDirectionChange: vi.fn(),
    onExportCsv: vi.fn(),
    counts: { all: 100, direct: 20, funds: 80, overlap: 15 },
  };

  it('renders search input and triggers search change', () => {
    render(<HoldingsFilterBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search across 100 holdings/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Tata' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('Tata');
  });

  it('renders source chips and triggers source change', () => {
    render(<HoldingsFilterBar {...defaultProps} />);

    const directChip = screen.getByRole('button', { name: /Direct Demat/i });
    fireEvent.click(directChip);

    expect(defaultProps.onSourceFilterChange).toHaveBeenCalledWith('direct');
  });

  it('renders sector options and triggers sector change', () => {
    render(<HoldingsFilterBar {...defaultProps} />);

    const selectEls = screen.getAllByRole('combobox');
    // First select is Sector
    fireEvent.change(selectEls[0], { target: { value: 'Technology' } });

    expect(defaultProps.onSectorChange).toHaveBeenCalledWith('Technology');
  });

  it('renders market cap options and triggers cap change', () => {
    render(<HoldingsFilterBar {...defaultProps} />);

    const selectEls = screen.getAllByRole('combobox');
    // Second select is Market Cap
    fireEvent.change(selectEls[1], { target: { value: 'Large Cap' } });

    expect(defaultProps.onCapChange).toHaveBeenCalledWith('Large Cap');
  });

  it('calls onExportCsv when Export CSV button is clicked', () => {
    render(<HoldingsFilterBar {...defaultProps} />);

    const exportBtn = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportBtn);

    expect(defaultProps.onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('opens sort modal when clicking sort button', () => {
    render(<HoldingsFilterBar {...defaultProps} />);

    const sortBtn = screen.getByLabelText('Open sorting options');
    fireEvent.click(sortBtn);

    expect(screen.getByText('Sort Holdings')).toBeInTheDocument();
    expect(screen.getByText('Sort Criteria')).toBeInTheDocument();
  });
});
