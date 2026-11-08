import React, { useState } from "react";
import { Card } from "../../components/Card";
import { Toggle } from "../../components/Toggle";
import {
  initialChannels,
  initialMessageTemplates,
  initialDefaultRules,
} from "../../features/admin/adminData";
import { useAdminStore } from "../../features/admin/useAdminStore";

export function AdminNotificationsPage(): React.JSX.Element {
  const { notificationsActive, toggleNotifications } = useAdminStore();
  const [channels] = useState(initialChannels);
  const [templates] = useState(initialMessageTemplates);
  const [rules] = useState(initialDefaultRules);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  return (
    <div
      data-testid="admin-notifications-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">
          Notifications · réglages de la plateforme
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-17 font-bold text-text">
            Notifications activées
          </span>
          <Toggle
            checked={notificationsActive}
            onChange={toggleNotifications}
            testID="toggle-platform-notifications"
          />
        </div>
      </div>

      {/* Tableau des canaux */}
      <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
        <table className="w-full text-left border-collapse" data-testid="channels-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-4 py-2 w-[251px]">Canal</th>
              <th className="px-4 py-2 w-[342px]">Service</th>
              <th className="px-4 py-2 w-[182px]">État</th>
              <th className="px-4 py-2 w-[160px]">Envoyées (7 j)</th>
              <th className="px-4 py-2 w-[114px]">Échecs</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, index) => (
              <tr
                key={ch.canal}
                data-testid={`channel-row-${index}`}
                className={`h-[51px] text-16 border-t border-border ${
                  index % 2 === 0 ? "bg-surface-2" : "bg-white"
                }`}
              >
                <td className="px-4 py-3 font-bold text-text">{ch.canal}</td>
                <td className="px-4 py-3 text-text-muted">{ch.service}</td>
                <td className="px-4 py-3 text-warning font-bold">{ch.etat}</td>
                <td className="px-4 py-3 text-text-muted">{ch.envoyees7j}</td>
                <td className="px-4 py-3 text-text-muted">{ch.echecs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deux colonnes : Modèles et Règles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Modèles de messages */}
        <div className="lg:col-span-7">
          <Card testID="templates-card" className="p-6 flex flex-col gap-4">
            <h2 className="text-21 font-bold text-text">Modèles de messages (FR / EN)</h2>
            <div className="flex flex-col divide-y divide-border">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-16 font-normal text-text">{tpl.text}</span>
                  <button
                    type="button"
                    data-testid={`btn-edit-template-${tpl.id}`}
                    onClick={() =>
                      setEditingTemplate(
                        editingTemplate === tpl.id ? null : tpl.id
                      )
                    }
                    className="text-14 font-bold text-admin hover:underline shrink-0"
                  >
                    Modifier
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Règles par défaut */}
        <div className="lg:col-span-5">
          <Card testID="rules-card" className="p-6 bg-admin-50 border-0 flex flex-col gap-4">
            <h2 className="text-21 font-bold text-text">Règles par défaut</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-16 text-text">Relance après</span>
                <span className="text-16 font-bold text-text">{rules.relanceApres}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-16 text-text">Heures calmes</span>
                <span className="text-16 font-bold text-text">{rules.heuresCalmes}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-16 text-text">Résumé soignant</span>
                <span className="text-16 font-bold text-text">{rules.resumeSoignant}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-16 text-text">Rappel local (hors ligne)</span>
                <span className="text-16 font-bold text-text">{rules.rappelLocal}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminNotificationsPage;

