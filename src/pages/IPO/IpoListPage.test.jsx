import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IpoListPage from './IpoListPage';
import { api } from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  api: {
    getIpos: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    updateAlertPreferences: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePageScrollRestoration', () => ({
  default: () => ({ current: null }),
}));

describe('IpoListPage Filter & Sort Persistence', () => {
  const mockIpos = [
    {
      id: 'ipo-1',
      name: 'Alpha Tech Ltd',
      status: 'Open',
      gmpPercent: 50,
      gmpAmount: 100,
      openDate: '10-Sep',
      closeDate: '15-Sep',
      ipoSize: '₹500 Cr',
    },
    {
      id: 'ipo-2',
      name: 'Beta Motors Ltd',
      status: 'Upcoming',
      gmpPercent: 20,
      gmpAmount: 50,
      openDate: '20-Sep',
      closeDate: '25-Sep',
      ipoSize: '₹300 Cr',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    api.getIpos.mockResolvedValue(mockIpos);
  });

  it('restores activeTab, sortBy, and sortDirection from localStorage on load', async () => {
    localStorage.setItem('ipo_active_tab', 'upcoming');
    localStorage.setItem('ipo_sort_by', 'issue_size');
    localStorage.setItem('ipo_sort_direction', 'asc');

    render(
      <MemoryRouter>
        <IpoListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Highest Issue Size/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Low → High/i)).toBeInTheDocument();
  });

  it('updates localStorage when a tab is selected', async () => {
    render(
      <MemoryRouter>
        <IpoListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tech Ltd')).toBeInTheDocument();
    });

    const upcomingTabBtn = screen.getByRole('button', { name: /Upcoming/i });
    fireEvent.click(upcomingTabBtn);

    expect(localStorage.getItem('ipo_active_tab')).toBe('upcoming');
    expect(sessionStorage.getItem('ipo_active_tab')).toBe('upcoming');
  });

  it('updates localStorage when sort option is changed in bottom sheet', async () => {
    render(
      <MemoryRouter>
        <IpoListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Tech Ltd')).toBeInTheDocument();
    });

    // Open sort modal
    const sortBtn = screen.getByLabelText('Open sort and filter');
    fireEvent.click(sortBtn);

    // Click 'Est. Profit'
    const profitOption = screen.getByRole('button', { name: /Est. Profit/i });
    fireEvent.click(profitOption);

    expect(localStorage.getItem('ipo_sort_by')).toBe('profit');

    // Click 'Low -> High'
    const lowToHighBtn = screen.getByRole('button', { name: /Low → High/i });
    fireEvent.click(lowToHighBtn);

    expect(localStorage.getItem('ipo_sort_direction')).toBe('asc');
  });
});
