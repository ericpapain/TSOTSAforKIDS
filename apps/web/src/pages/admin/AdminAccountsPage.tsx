import React, { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Toggle } from "../../components/Toggle";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";
import type { UserRole } from "../../features/admin/types";

export function AdminAccountsPage(): React.JSX.Element {
  const { accounts, addAccount } = useAdminStore();
  const [activeFilter, setActiveFilter] = useState<string>("Tous");
  const [selectedRole, setSelectedRole] = useState<UserRole>("caregiver");
  const [contactInput, setContactInput] = useState<string>("");
  const [facility, setFacility] = useState<string>("CMA de démo");
  const [verifiedByDefault, setVerifiedByDefault] = useState<boolean>(true);
  const [sendInvitation, setSendInvitation] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filterTabs = ["Tous", "Utilisateurs", "Soignants", "Administrateurs"];

  const filteredAccounts = accounts.filter((acc) => {
    if (activeFilter === "Utilisateurs") return acc.role === "user";
    if (activeFilter === "Soignants") return acc.role === "caregiver";
    if (activeFilter === "Administrateurs") return acc.role === "admin";
    return true;
  });

  const getRoleLabel = (role: UserRole): string => {
    if (role === "admin") return "Admin";
    if (role === "caregiver") return "Soignant";
    return "Utilisateur";
  };

  const getStatusColor = (status: string): string => {
    if (status === "active") return "text-primary font-bold";
    if (status === "pending_verification") return "text-warning font-bold";
    return "text-care font-bold";
  };

  const handleCreateAccount = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!contactInput.trim()) {
      setFeedback("Veuillez renseigner un numéro de téléphone ou un e-mail.");
      return;
    }
    const isEmail = contactInput.includes("@");
    const name = isEmail ? contactInput : `Utilisateur (${contactInput})`;
    const status = verifiedByDefault ? "active" : "pending_verification";
    const statusLabel = sendInvitation
      ? "Invité"
      : verifiedByDefault
      ? "Actif"
      : "À vérifier";

    addAccount({
      name,
      authProvider: isEmail ? "E-mail" : "Téléphone",
      role: selectedRole,
      facility: selectedRole === "caregiver" ? facility : undefined,
      status: sendInvitation ? "invited" : status,
      statusLabel,
    });

    setFeedback(`Compte ${name} créé et invitation préparée.`);
    setContactInput("");
  };

  return (
    <div
      data-testid="admin-accounts-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Colonne gauche : liste des comptes */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          <h1 className="text-29 font-bold text-text">Comptes</h1>

          {/* Filtres par pastille */}
          <div className="flex flex-wrap items-center gap-3">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  data-testid={`filter-tab-${tab}`}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-5 py-2 rounded-full text-14 font-bold transition-colors ${
                    isActive
                      ? "bg-admin text-white"
                      : "bg-neutral-100 text-text hover:bg-neutral-200"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tableau des comptes */}
          <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
            <table className="w-full text-left border-collapse" data-testid="accounts-table">
              <thead>
                <tr className="bg-admin text-white text-14 font-bold h-[41px]">
                  <th className="px-4 py-2 w-[200px]">Compte</th>
                  <th className="px-4 py-2 w-[114px]">Connexion</th>
                  <th className="px-4 py-2 w-[114px]">Rôle</th>
                  <th className="px-4 py-2 w-[137px]">Établissement</th>
                  <th className="px-4 py-2 w-[114px]">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc, index) => (
                  <tr
                    key={acc.id}
                    data-testid={`account-row-${acc.id}`}
                    className={`h-[55px] text-16 border-t border-border ${
                      index % 2 === 0 ? "bg-surface-2" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-text">{acc.name}</td>
                    <td className="px-4 py-3 text-text-muted">{acc.authProvider}</td>
                    <td className="px-4 py-3 text-text">{getRoleLabel(acc.role)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {acc.facility || "—"}
                    </td>
                    <td className={`px-4 py-3 ${getStatusColor(acc.status)}`}>
                      {acc.statusLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-14 italic text-text-muted">
            Personnes suivies rattachées à un compte : visibles dans le détail du compte.
          </p>
        </div>

        {/* Colonne droite : création de compte */}
        <div className="xl:col-span-4">
          <Card
            testID="create-account-card"
            className="p-6 bg-admin-50 border-0 flex flex-col gap-5"
          >
            <h2 className="text-22 font-bold text-text">Créer un compte</h2>

            {feedback && (
              <Notice variant="success" testID="account-feedback">
                {feedback}
              </Notice>
            )}

            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              {/* Rôles */}
              <div className="grid grid-cols-3 gap-2">
                {(["user", "caregiver", "admin"] as UserRole[]).map((role) => {
                  const isSelected = selectedRole === role;
                  const label =
                    role === "user"
                      ? "Utilisateur"
                      : role === "caregiver"
                      ? "Soignant"
                      : "Admin";
                  return (
                    <button
                      key={role}
                      type="button"
                      data-testid={`role-btn-${role}`}
                      onClick={() => setSelectedRole(role)}
                      className={`h-[41px] rounded-[6px] text-16 transition-colors border ${
                        isSelected
                          ? "bg-admin text-white border-admin font-bold"
                          : "bg-white text-text border-border font-normal hover:bg-surface-2"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Champ contact */}
              <div className="flex flex-col gap-1.5">
                <label className="text-14 font-bold text-text-muted">
                  Téléphone ou adresse e-mail (Google ou autre)
                </label>
                <input
                  type="text"
                  data-testid="input-contact"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  placeholder="+237 6XX XX XX XX"
                  className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text focus:outline-none focus:border-admin"
                />
              </div>

              {/* Champ établissement */}
              {selectedRole === "caregiver" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-14 font-bold text-text-muted">
                    Établissement
                  </label>
                  <select
                    data-testid="select-facility"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text focus:outline-none focus:border-admin"
                  >
                    <option value="CMA de démo">CMA de démo</option>
                    <option value="Hôpital de district de Dschang">
                      Hôpital de district de Dschang
                    </option>
                  </select>
                </div>
              )}

              {/* Toggle soignant vérifié */}
              {selectedRole === "caregiver" && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-16 text-text">Soignant vérifié d'office</span>
                  <Toggle
                    checked={verifiedByDefault}
                    onChange={setVerifiedByDefault}
                    testID="toggle-verified"
                  />
                </div>
              )}

              {/* Toggle invitation */}
              <div className="flex items-center justify-between py-1">
                <span className="text-16 text-text">
                  Envoyer une invitation (SMS ou e-mail)
                </span>
                <Toggle
                  checked={sendInvitation}
                  onChange={setSendInvitation}
                  testID="toggle-invitation"
                />
              </div>

              {/* Bouton créer */}
              <Button
                type="submit"
                variant="primary"
                className="!bg-admin hover:!bg-slate-800 h-[57px] text-19 font-bold w-full"
                testID="btn-create-account"
              >
                Créer et inviter
              </Button>
            </form>

            <p className="text-14 text-text-muted">
              La personne choisit elle-même sa connexion (Google, téléphone ou
              e-mail) en ouvrant l'invitation. Action tracée dans le journal
              d'audit.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminAccountsPage;

