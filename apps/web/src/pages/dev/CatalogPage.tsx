import React, { useState } from 'react';
import {
  BrandLogo,
  Button,
  Card,
  Chip,
  Notice,
  Toggle,
  KpiCard,
  DataTable,
  ZScoreChart,
  AppHeader,
  Sidebar,
  type DataTableColumn,
  type NavItem,
} from '../../components';
import type { SpaceTheme } from '../../types';

interface PatientPreview {
  id: string;
  name: string;
  age: string;
  status: string;
  lastVisit: string;
}

const sampleColumns: DataTableColumn<PatientPreview>[] = [
  { header: 'ID', accessor: 'id', width: '100px' },
  { header: 'Patient', accessor: 'name' },
  { header: 'Âge', accessor: 'age', width: '100px' },
  { header: 'Statut', accessor: (p) => <Chip label={p.status} variant="care" /> },
  { header: 'Dernière visite', accessor: 'lastVisit', width: '160px' },
];

const samplePatients: PatientPreview[] = [
  { id: '#A-014', name: 'Amina N.', age: '24 mois', status: 'Suivi actif', lastVisit: '2026-04-12' },
  { id: '#A-015', name: 'Koffi B.', age: '18 mois', status: 'En attente', lastVisit: '2026-04-10' },
  { id: '#A-016', name: 'Fatou D.', age: '36 mois', status: 'Clôturé', lastVisit: '2026-03-28' },
];

const sampleNavItems: NavItem[] = [
  { label: 'Tableau de bord', path: '/dev/catalog#dashboard', iconName: 'dashboard' },
  { label: 'Patients', path: '/dev/catalog#patients', iconName: 'patients', badge: 3 },
  { label: 'Base aliments', path: '/dev/catalog#foods', iconName: 'foods' },
  { label: 'Paramètres', path: '/dev/catalog#settings', iconName: 'settings' },
];

export const CatalogPage: React.FC = () => {
  const [currentSpace, setCurrentSpace] = useState<SpaceTheme>('caregiver');
  const [toggleActive, setToggleActive] = useState<boolean>(true);
  const [activeNav, setActiveNav] = useState<string>('/dev/catalog#dashboard');

  return (
    <div className="min-h-screen bg-canvas font-sans pb-16">
      <AppHeader
        space={currentSpace}
        userName="Dr. Marc Eto'o"
        unreadNotifications={3}
      />

      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Catalogue des composants partagés (Dev)
            </h1>
            <p className="text-text-secondary text-sm">
              Présentation des composants du système de design TSOTSA Kids.
            </p>
          </div>
          <div className="flex gap-2">
            {(['user', 'caregiver', 'admin'] as SpaceTheme[]).map((sp) => (
              <Button
                key={sp}
                variant={currentSpace === sp ? (sp === 'user' ? 'primary' : sp) : 'solid'}
                outline={currentSpace !== sp}
                size="sm"
                onClick={() => setCurrentSpace(sp)}
              >
                Espace {sp}
              </Button>
            ))}
          </div>
        </header>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">1. Logos</h2>
          <Card className="flex flex-wrap items-center gap-8 p-6">
            <div className="p-4 bg-primary rounded-card">
              <BrandLogo variant="dark" size="md" />
            </div>
            <div className="p-4 bg-care rounded-card">
              <BrandLogo variant="dark" size="md" />
            </div>
            <div className="p-4 bg-admin rounded-card">
              <BrandLogo variant="dark" size="md" />
            </div>
            <div className="p-4 bg-white rounded-card border">
              <BrandLogo variant="light" size="md" />
            </div>
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">2. Boutons</h2>
          <Card className="flex flex-wrap gap-4 p-6">
            <Button variant="primary">Utilisateur (Solid)</Button>
            <Button variant="care">Soignant (Solid)</Button>
            <Button variant="admin">Admin (Solid)</Button>
            <Button variant="danger">Danger (Solid)</Button>
            <Button variant="care" outline>Soignant (Outline)</Button>
            <Button variant="admin" outline>Admin (Outline)</Button>
            <Button variant="primary" disabled>Désactivé</Button>
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">3. Badges (Chips) et Interrupteurs (Toggles)</h2>
          <Card className="flex flex-wrap items-center gap-6 p-6">
            <Chip label="Primaire" variant="primary" />
            <Chip label="Soignant" variant="care" />
            <Chip label="Admin" variant="admin" />
            <Chip label="Attention" variant="warning" />
            <Chip label="Alerte" variant="danger" />
            <div className="flex items-center gap-3 ml-6 border-l pl-6">
              <span className="text-sm font-medium">Mode actif :</span>
              <Toggle checked={toggleActive} onChange={setToggleActive} space={currentSpace} />
            </div>
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">4. Alertes et Notifications (Notice)</h2>
          <div className="space-y-3">
            <Notice variant="warning">
              Vérification requise : 2 pesées dépassent l'écart type attendu pour ce groupe d'âge.
            </Notice>
            <Notice variant="danger">
              Alerte rouge : z-score P/T &lt; -3, orientation CREN recommandée immédiatement.
            </Notice>
            <Notice variant="info">
              Information : les nouvelles tables OMS 2026 sont actives.
            </Notice>
          </div>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">5. Indicateurs KPI (KpiCard)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard title="Patients suivis" value={42} space="care" subtitle="+4 ce mois" />
            <KpiCard title="Alertes en cours" value={3} space="care" subtitle="Nécessite action" />
            <KpiCard title="Taux de rémission" value="88 %" space="primary" subtitle="Objectif &gt; 80 %" />
          </div>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">6. Tableau de données (DataTable)</h2>
          <DataTable
            columns={sampleColumns}
            data={samplePatients}
            keyExtractor={(p) => p.id}
            space={currentSpace}
          />
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">7. Courbe de Z-Score OMS (ZScoreChart)</h2>
          <Card className="p-6">
            <ZScoreChart
              points={[
                { date: '15/01', zScore: -2.8, label: 'J0' },
                { date: '29/01', zScore: -2.3, label: 'S2' },
                { date: '12/02', zScore: -1.7, label: 'S4' },
                { date: '26/02', zScore: -1.2, label: 'S6' },
                { date: '12/03', zScore: -0.6, label: 'S8' },
              ]}
              title="Évolution P/T (Poids pour Taille) - Patient #A-014"
            />
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">8. Barre latérale (Sidebar)</h2>
          <div className="w-[262px] border rounded-card overflow-hidden">
            <Sidebar
              space={currentSpace}
              items={sampleNavItems}
              activePath={activeNav}
              onNavigate={setActiveNav}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CatalogPage;
