import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IpoListItem from './IpoListItem';

describe('IpoListItem', () => {
  const mockIpo = {
    id: 'test-ipo-1',
    name: 'Tata Technologies Ltd',
    category: 'Mainboard',
    gmpPercent: 85.5,
    gmpAmount: 425,
    subscription: '69.43x',
  };

  it('renders company name, GMP %, GMP amount, and subscription', () => {
    render(<IpoListItem ipo={mockIpo} />);

    expect(screen.getByText('Tata Technologies Ltd')).toBeInTheDocument();
    expect(screen.getByText('+85.50%')).toBeInTheDocument();
    expect(screen.getByText('+₹425')).toBeInTheDocument();
    expect(screen.getByText('69.43x')).toBeInTheDocument();
  });

  it('triggers onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<IpoListItem ipo={mockIpo} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles negative GMP gracefully with minus sign', () => {
    const negativeIpo = {
      ...mockIpo,
      gmpPercent: -5.2,
      gmpAmount: -20,
    };

    render(<IpoListItem ipo={negativeIpo} />);
    expect(screen.getByText('-5.20%')).toBeInTheDocument();
    expect(screen.getByText('₹-20')).toBeInTheDocument();
  });

  it('handles fallback subscription from subscriptionDetails.total', () => {
    const fallbackIpo = {
      ...mockIpo,
      subscription: null,
      subscriptionDetails: { total: '14.2' },
    };

    render(<IpoListItem ipo={fallbackIpo} />);
    expect(screen.getByText('14.2x')).toBeInTheDocument();
  });

  it('renders issue size for desktop view when provided', () => {
    const ipoWithSize = {
      ...mockIpo,
      ipoSize: '₹3,042.51 Cr',
    };

    render(<IpoListItem ipo={ipoWithSize} />);
    expect(screen.getByText('₹3,042.51 Cr')).toBeInTheDocument();
  });

  it('renders open and close dates formatted with calendar icon', () => {
    const ipoWithDates = {
      ...mockIpo,
      openDate: '10-Sep',
      closeDate: '15-Sep',
    };

    render(<IpoListItem ipo={ipoWithDates} />);
    expect(screen.getByText('10-Sep – 15-Sep')).toBeInTheDocument();
  });

  it('handles snake_case open_date and close_date', () => {
    const ipoWithSnakeDates = {
      ...mockIpo,
      open_date: '10-Sep',
      close_date: '15-Sep',
    };

    render(<IpoListItem ipo={ipoWithSnakeDates} />);
    expect(screen.getByText('10-Sep – 15-Sep')).toBeInTheDocument();
  });

  it('handles identical open and close dates gracefully', () => {
    const singleDayIpo = {
      ...mockIpo,
      openDate: '10-Sep',
      closeDate: '10-Sep',
    };

    render(<IpoListItem ipo={singleDayIpo} />);
    expect(screen.getByText('10-Sep')).toBeInTheDocument();
  });

  it('falls back to "Dates TBA" when no dates are provided', () => {
    render(<IpoListItem ipo={mockIpo} />);
    expect(screen.getByText('Dates TBA')).toBeInTheDocument();
  });

  it('formats ISO dates correctly', () => {
    const isoIpo = {
      ...mockIpo,
      openDate: '2026-09-10',
      closeDate: '2026-09-15',
    };

    render(<IpoListItem ipo={isoIpo} />);
    expect(screen.getByText('10-Sep – 15-Sep')).toBeInTheDocument();
  });
});
