import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute, getInMemoryAccessToken } from '../authContext';
import { getWebApiClient } from '../client';

const DummyProtected = () => <div>Page Protégée</div>;
const DummyLogin = () => <div>Page Connexion</div>;

const AuthController = () => {
  const { session, setSession, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="auth-user">{session?.name ?? ''}</span>
      <button
        onClick={() =>
          setSession(
            { id: '1', name: 'Dr. Test', role: 'caregiver' },
            'access-tok',
            'refresh-tok'
          )
        }
      >
        Login Caregiver
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext and ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('manages session and tokens in memory', () => {
    render(
      <AuthProvider>
        <AuthController />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');

    fireEvent.click(screen.getByText('Login Caregiver'));
    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    expect(screen.getByTestId('auth-user')).toHaveTextContent('Dr. Test');

    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
  });

  it('restores tokens and session from sessionStorage on reload', () => {
    sessionStorage.setItem(
      'tsotsa_session',
      JSON.stringify({ id: 'persisted-1', name: 'Dr. Persisted', role: 'caregiver' })
    );
    sessionStorage.setItem(
      'tsotsa_auth_tokens',
      JSON.stringify({ accessToken: 'persisted-access', refreshToken: 'persisted-refresh' })
    );

    render(
      <AuthProvider>
        <AuthController />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    expect(screen.getByTestId('auth-user')).toHaveTextContent('Dr. Persisted');
    expect(getInMemoryAccessToken()).toBe('persisted-access');
  });

  it('calls server logout to revoke refresh token when logging out', async () => {
    const apiClient = getWebApiClient();
    const logoutSpy = vi.spyOn(apiClient.client, 'POST').mockResolvedValueOnce({
      data: { message: 'Déconnexion effectuée avec succès.' },
      response: { status: 200 } as Response,
    } as never);

    render(
      <AuthProvider>
        <AuthController />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login Caregiver'));
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledWith('/v1/auth/logout', {
        body: { refresh_token: 'refresh-tok' },
      });
    });

    expect(sessionStorage.getItem('tsotsa_auth_tokens')).toBeNull();
    expect(sessionStorage.getItem('tsotsa_session')).toBeNull();
  });

  it('redirects unauthenticated user to /connexion', () => {
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/secret"
              element={
                <ProtectedRoute allowedRoles={['caregiver']}>
                  <DummyProtected />
                </ProtectedRoute>
              }
            />
            <Route path="/connexion" element={<DummyLogin />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Page Connexion')).toBeInTheDocument();
  });
});

