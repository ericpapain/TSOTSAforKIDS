import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth, ProtectedRoute } from '../authContext';

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

