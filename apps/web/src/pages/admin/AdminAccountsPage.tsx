import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Toggle } from "../../components/Toggle";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";
import type { UserRole, AccountItem } from "../../features/admin/types";

type FilterTabKey = "Tous" | "Utilisateurs" | "Soignants" | "Administrateurs";

export function AdminAccountsPage(): React.JSX.Element {
  const { t } = useTranslation("admin");
  const { t: tErrors } = useTranslation("errors");
  const { accounts, addAccount } = useAdminStore();
  const [activeFilter, setActiveFilter] = useState<FilterTabKey>("Tous");
  const [selectedRole, setSelectedRole] = useState<UserRole>("caregiver");
  const [contactInput, setContactInput] = useState<string>("");
  const [facility, setFacility] = useState<string>("CMA de démo");
  const [verifiedByDefault, setVerifiedByDefault] = useState<boolean>(true);
  const [sendInvitation, setSendInvitation] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("accounts.pageTitle");
  }, [t]);

  const filterTabs: FilterTabKey[] = ["Tous", "Utilisateurs", "Soignants", "Administrateurs"];

  const filteredAccounts = accounts.filter((acc) => {
    if (activeFilter === "Utilisateurs") return acc.role === "user";
    if (activeFilter === "Soignants") return acc.role === "caregiver";
    if (activeFilter === "Administrateurs") return acc.role === "admin";
    return true;
  });

  const getRoleLabel = (role: UserRole): string => t(`accounts.roles.${role}`);

  const getStatusColor = (status: string): string => {
    if (status === "active") return "text-primary font-bold";
    if (status === "pending_verification") return "text-warning font-bold";
    return "text-care font-bold";
  };

  const getLocalizedAccountName = (acc: AccountItem): string => {
    if (acc.name === "Compte parent (démo)") return t("accounts.data.demoParent");
    if (acc.name === "Équipe TSOTSA") return t("nav.shortTeamName");
    return acc.name;
  };

  const getLocalizedFacility = (fac?: string): string => {
    if (!fac) return "—";
    if (fac === "CMA de démo") return t("accounts.data.demoFacility");
    if (fac === "Hôpital de district de Dschang") return t("accounts.data.dschangHospital");
    return fac;
  };

  const handleCreateAccount = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!contactInput.trim()) {
      setFeedback(tErrors("accounts.ERR_CONTACT_REQUIRED"));
      return;
    }
    const isEmail = contactInput.includes("@");
    const name = isEmail ? contactInput : t("accounts.data.userPhonePrefix", { contact: contactInput });
    const status = verifiedByDefault ? "active" : "pending_verification";
    const finalStatus = sendInvitation ? "invited" : status;

    addAccount({
      name,
      authProvider: isEmail ? "E-mail" : "Téléphone",
      role: selectedRole,
      facility: selectedRole === "caregiver" ? facility : undefined,
      status: finalStatus,
      statusLabel: t(`accounts.statuses.${finalStatus}`),
    });

    setFeedback(t("accounts.createdFeedback", { name }));
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
          <h1 className="text-29 font-bold text-text">{t("accounts.title")}</h1>

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
                  {t(`accounts.filters.${tab}`)}
                </button>
              );
            })}
          </div>

          {/* Tableau des comptes */}
          <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
            <table className="w-full text-left border-collapse" data-testid="accounts-table">
              <thead>
                <tr className="bg-admin text-white text-14 font-bold h-[41px]">
                  <th className="px-4 py-2 w-[200px]">{t("accounts.columns.account")}</th>
                  <th className="px-4 py-2 w-[114px]">{t("accounts.columns.provider")}</th>
                  <th className="px-4 py-2 w-[114px]">{t("accounts.columns.role")}</th>
                  <th className="px-4 py-2 w-[137px]">{t("accounts.columns.facility")}</th>
                  <th className="px-4 py-2 w-[114px]">{t("accounts.columns.status")}</th>
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
                    <td className="px-4 py-3 font-bold text-text">{getLocalizedAccountName(acc)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {t(`accounts.providers.${acc.authProvider}`)}
                    </td>
                    <td className="px-4 py-3 text-text">{getRoleLabel(acc.role)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {getLocalizedFacility(acc.facility)}
                    </td>
                    <td className={`px-4 py-3 ${getStatusColor(acc.status)}`}>
                      {t(`accounts.statuses.${acc.status}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-14 italic text-text-muted">
            {t("accounts.footnote")}
          </p>
        </div>

        {/* Colonne droite : création de compte */}
        <div className="xl:col-span-4">
          <Card
            testID="create-account-card"
            className="p-6 bg-admin-50 border-0 flex flex-col gap-5"
          >
            <h2 className="text-22 font-bold text-text">{t("accounts.createCardTitle")}</h2>

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
                      {getRoleLabel(role)}
                    </button>
                  );
                })}
              </div>

              {/* Champ contact */}
              <div className="flex flex-col gap-1.5">
                <label className="text-14 font-bold text-text-muted">
                  {t("accounts.contactLabel")}
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
                    {t("accounts.facilityLabel")}
                  </label>
                  <select
                    data-testid="select-facility"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text focus:outline-none focus:border-admin"
                  >
                    <option value="CMA de démo">{t("accounts.data.demoFacility")}</option>
                    <option value="Hôpital de district de Dschang">
                      {t("accounts.data.dschangHospital")}
                    </option>
                  </select>
                </div>
              )}

              {/* Toggle soignant vérifié */}
              {selectedRole === "caregiver" && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-16 text-text">{t("accounts.verifiedByDefaultLabel")}</span>
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
                  {t("accounts.sendInvitationLabel")}
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
                {t("accounts.createBtn")}
              </Button>
            </form>

            <p className="text-14 text-text-muted">
              {t("accounts.createNotice")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminAccountsPage;

