import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }
  }
}));

function TestConsumer() {
  const { user, isLoggedIn, loading, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="isLoggedIn">{isLoggedIn ? 'yes' : 'no'}</div>
      <div data-testid="userEmail">{user?.email || 'none'}</div>
      <button onClick={() => signInWithEmail('test@example.com', 'secret123')}>Sign In</button>
      <button onClick={() => signUpWithEmail('new@example.com', 'secret123')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'test@example.com' }
        }
      }
    });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() }
      }
    });
  });

  it('provides authenticated user session when logged in', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('loading').textContent).toBe('ready');
    expect(screen.getByTestId('isLoggedIn').textContent).toBe('yes');
    expect(screen.getByTestId('userEmail').textContent).toBe('test@example.com');
  });

  it('calls signInWithPassword on signInWithEmail', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });

    let rendered;
    await act(async () => {
      rendered = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    const signInBtn = screen.getByRole('button', { name: 'Sign In' });
    await act(async () => {
      signInBtn.click();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret123'
    });
  });

  it('calls signUp on signUpWithEmail', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    const signUpBtn = screen.getByRole('button', { name: 'Sign Up' });
    await act(async () => {
      signUpBtn.click();
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'secret123'
    });
  });
});
