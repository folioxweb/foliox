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
});
