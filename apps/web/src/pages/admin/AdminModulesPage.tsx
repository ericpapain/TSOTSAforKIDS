import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaAppleAlt, FaHeartbeat, FaTint } from "react-icons/fa";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Toggle } from "../../components/Toggle";
import { useAdminStore } from "../../features/admin/useAdminStore";

export function AdminModulesPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("admin");
  const navigate = useNavigate();
  const { modules, toggleModule } = useAdminStore();

  useEffect(() => {
    document.title = t("modules.pageTitle");
  }, [t, i18n.language]);

  const getModuleIcon = (id: string, active: boolean): React.JSX.Element => {
    const color = active ? "text-primary" : "text-text-subtle";
    if (id === "nutrition") return <FaAppleAlt size={46} className={color} />;
    if (id === "hta") return <FaHeartbeat size={46} className={color} />;
    return <FaTint size={46} className={color} />;
  };

  return (
    <div
      data-testid="admin-modules-page"
      className="p-[29px] max-w-[1200px] flex flex-col gap-6"
    >
      <h1 className="text-29 font-bold text-text">{t("modules.title")}</h1>

      <div className="flex flex-col gap-4">
        {modules.map((m) => {
          const name = t(`modules.items.${m.id}.name` as never);
          const subtitle = m.active
            ? t(`modules.items.${m.id}.activeSub` as never)
            : t(`modules.items.${m.id}.inactiveSub` as never);
          return (
            <Card
              key={m.id}
              testID={`module-card-${m.id}`}
              className="p-6 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-6">
                <div className="w-[50px] flex items-center justify-center shrink-0">
                  {getModuleIcon(m.id, m.active)}
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-22 font-bold text-text">{name}</h2>
                  <p
                    data-testid={`module-subtitle-${m.id}`}
                    className="text-16 text-text-muted"
                  >
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <Toggle
                  checked={m.active}
                  onChange={() => toggleModule(m.id)}
                  testID={`toggle-module-${m.id}`}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4">
        <Button
          variant="primary"
          testID="btn-see-user-modules"
          onClick={() => navigate("/nutrition/produits/plumpy-nut")}
          className="h-[57px] text-17 font-bold px-8"
        >
          {t("modules.seeUserEffectBtn")}
        </Button>
      </div>
    </div>
  );
}

export default AdminModulesPage;


