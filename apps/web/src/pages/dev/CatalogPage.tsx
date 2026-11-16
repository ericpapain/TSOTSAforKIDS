import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

interface PatientPreview {
  id: string;
  name: string;
  age: string;
  status: string;
  lastVisit: string;
}

export const CatalogPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [currentSpace, setCurrentSpace] = useState<"user" | "caregiver" | "admin">("caregiver");
  const [toggleActive, setToggleActive] = useState<boolean>(true);
  const [activeNav, setActiveNav] = useState<string>('/dev/catalog#dashboard');

  const sampleColumns: DataTableColumn<PatientPreview>[] = [
    { header: t('dev.catalog.colId'), accessor: 'id', width: '100px' },
    { header: t('dev.catalog.colPatient'), accessor: 'name' },
    { header: t('dev.catalog.colAge'), accessor: 'age', width: '100px' },
    { header: t('dev.catalog.colStatus'), accessor: (p) => <Chip label={p.status} variant="care" /> },
    { header: t('dev.catalog.colLastVisit'), accessor: 'lastVisit', width: '160px' },
  ];

  const samplePatients: PatientPreview[] = [
    { id: '#A-014', name: 'Hamadou N.', age: '24 m', status: t('dev.catalog.statusActive'), lastVisit: '2026-04-12' },
    { id: '#A-015', name: 'Koffi B.', age: '18 m', status: t('dev.catalog.statusPending'), lastVisit: '2026-04-10' },
    { id: '#A-016', name: 'Fatou D.', age: '36 m', status: t('dev.catalog.statusClosed'), lastVisit: '2026-03-28' },
  ];

  const sampleNavItems: NavItem[] = [
    { label: t('dev.catalog.navDashboard'), path: '/dev/catalog#dashboard', iconName: 'dashboard' },
    { label: t('dev.catalog.navPatients'), path: '/dev/catalog#patients', iconName: 'patients', badge: 3 },
    { label: t('dev.catalog.navFoods'), path: '/dev/catalog#foods', iconName: 'foods' },
    { label: t('dev.catalog.navSettings'), path: '/dev/catalog#settings', iconName: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-canvas font-sans pb-16">
      <AppHeader
        space={currentSpace}
        userName="Prof. Félicité Ngeufack"
        unreadNotifications={3}
      />

      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('dev.catalog.title')}
            </h1>
            <p className="text-text-secondary text-sm">
              {t('dev.catalog.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            {(["user", "caregiver", "admin"] as const).map((sp) => (
              <Button
                key={sp}
                variant={currentSpace === sp ? (sp === 'user' ? 'primary' : sp) : 'solid'}
                outline={currentSpace !== sp}
                size="sm"
                onClick={() => setCurrentSpace(sp)}
              >
                {t('dev.catalog.spaceBtn', { space: sp })}
              </Button>
            ))}
          </div>
        </header>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec1')}</h2>
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
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec2')}</h2>
          <Card className="flex flex-wrap gap-4 p-6">
            <Button variant="primary">{t('dev.catalog.btnUserSolid')}</Button>
            <Button variant="care">{t('dev.catalog.btnCareSolid')}</Button>
            <Button variant="admin">{t('dev.catalog.btnAdminSolid')}</Button>
            <Button variant="danger">{t('dev.catalog.btnDangerSolid')}</Button>
            <Button variant="care" outline>{t('dev.catalog.btnCareOutline')}</Button>
            <Button variant="admin" outline>{t('dev.catalog.btnAdminOutline')}</Button>
            <Button variant="primary" disabled>{t('dev.catalog.btnDisabled')}</Button>
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec3')}</h2>
          <Card className="flex flex-wrap items-center gap-6 p-6">
            <Chip label={t('dev.catalog.chipPrimary')} variant="primary" />
            <Chip label={t('dev.catalog.chipCare')} variant="care" />
            <Chip label={t('dev.catalog.chipAdmin')} variant="admin" />
            <Chip label={t('dev.catalog.chipWarning')} variant="warning" />
            <Chip label={t('dev.catalog.chipDanger')} variant="danger" />
            <div className="flex items-center gap-3 ml-6 border-l pl-6">
              <span className="text-sm font-medium">{t('dev.catalog.activeMode')}</span>
              <Toggle checked={toggleActive} onChange={setToggleActive} space={currentSpace} />
            </div>
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec4')}</h2>
          <div className="space-y-3">
            <Notice variant="warning">
              {t('dev.catalog.noticeWarning')}
            </Notice>
            <Notice variant="danger">
              {t('dev.catalog.noticeDanger')}
            </Notice>
            <Notice variant="info">
              {t('dev.catalog.noticeInfo')}
            </Notice>
          </div>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec5')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard title={t('dev.catalog.kpi1Title')} value={42} space="care" subtitle={t('dev.catalog.kpi1Sub')} />
            <KpiCard title={t('dev.catalog.kpi2Title')} value={3} space="care" subtitle={t('dev.catalog.kpi2Sub')} />
            <KpiCard title={t('dev.catalog.kpi3Title')} value="88 %" space="primary" subtitle={t('dev.catalog.kpi3Sub')} />
          </div>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec6')}</h2>
          <DataTable
            columns={sampleColumns}
            data={samplePatients}
            keyExtractor={(p) => p.id}
            space={currentSpace}
          />
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec7')}</h2>
          <Card className="p-6">
            <ZScoreChart
              points={[
                { date: '15/01', zScore: -2.8, label: 'J0' },
                { date: '29/01', zScore: -2.3, label: 'S2' },
                { date: '12/02', zScore: -1.7, label: 'S4' },
                { date: '26/02', zScore: -1.2, label: 'S6' },
                { date: '12/03', zScore: -0.6, label: 'S8' },
              ]}
              title={t('dev.catalog.chartTitle')}
            />
          </Card>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-bold text-text-primary border-b pb-2">{t('dev.catalog.sec8')}</h2>
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

