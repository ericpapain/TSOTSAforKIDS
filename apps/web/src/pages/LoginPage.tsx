import React, { useState } from 'react';
import { useAuth } from '../api/authContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BrandLogo } from '../components/BrandLogo';
import type { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { setSession } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('caregiver');

  const handleQuickLogin = (role: UserRole) => {
    setSession(
      {
        id: 'usr-1',
        name: role === 'caregiver' ? 'Dr. Marc Eto\'o' : role === 'admin' ? 'Admin TSOTSA' : 'Parent Amina',
        role,
        isVerifiedCaregiver: role === 'caregiver',
      },
      'token-session',
      'refresh-session'
    );
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 font-sans">
      <Card className="w-full max-w-[420px] p-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo variant="light" size={48} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Connexion TSOTSA Kids</h1>
        <p className="text-sm text-text-secondary mb-6">
          Connectez-vous par téléphone, e-mail ou Google.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {(['user', 'caregiver', 'admin'] as UserRole[]).map((r) => (
              <Button
                key={r}
                variant={selectedRole === r ? (r === 'user' ? 'primary' : r) : 'solid'}
                outline={selectedRole !== r}
                size="sm"
                onClick={() => setSelectedRole(r)}
              >
                {r === 'caregiver' ? 'Soignant' : r === 'admin' ? 'Admin' : 'Utilisateur'}
              </Button>
            ))}
          </div>

          <Button
            variant={selectedRole === 'user' ? 'primary' : selectedRole}
            className="w-full"
            onClick={() => handleQuickLogin(selectedRole)}
          >
            Accéder à l'espace {selectedRole}
          </Button>
        </div>

        <div className="text-xs text-text-muted">
          Connexion sécurisée · Chiffrement de bout en bout
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
