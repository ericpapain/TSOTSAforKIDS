import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Toggle, Notice } from "../../components";
import { initialPersonSettings } from "../../features/caregiver/caregiverData";
import type { PersonNotificationSettings } from "../../features/caregiver/types";

interface ChannelSetting {
  id: string;
  label: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export function NotificationSettingsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [channelSettings, setChannelSettings] = useState<ChannelSetting[]>([
    {
      id: "missed-intake",
      label: "Prise sautée (3 rappels sans confirmation)",
      inApp: true,
      email: true,
      sms: true,
    },
    {
      id: "stagnation",
      label: "Stagnation pondérale (14 jours sans gain)",
      inApp: true,
      email: true,
      sms: false,
    },
    {
      id: "due-eval",
      label: "Évaluation périodique échue",
      inApp: true,
      email: false,
      sms: false,
    },
    {
      id: "confirmed-intake",
      label: "Prise confirmée par le parent",
      inApp: true,
      email: false,
      sms: false,
    },
  ]);

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [personSettings, setPersonSettings] =
    useState<PersonNotificationSettings[]>(initialPersonSettings);

  const handleToggleChannel = (id: string, channel: "inApp" | "email" | "sms", val: boolean) => {
    setChannelSettings((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [channel]: val } : c))
    );
  };

  const handleTogglePerson = (personId: string, enabled: boolean) => {
    setPersonSettings((prev) =>
      prev.map((p) => (p.personId === personId ? { ...p, enabled } : p))
    );
  };

  const handleFrequencyChange = (
    personId: string,
    frequency: "Immédiat" | "Résumé quotidien" | "Jamais"
  ) => {
    setPersonSettings((prev) =>
      prev.map((p) => (p.personId === personId ? { ...p, frequency } : p))
    );
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="notification-settings-page">
      {savedSuccess && (
        <Notice variant="success" title="Préférences enregistrées" testID="settings-saved-notice">
          Vos préférences de notifications ont été enregistrées avec succès.
        </Notice>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-12 text-text-muted mb-1">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate("/soignant/notifications")}
            >
              Notifications
            </span>{" "}
            › Réglages
          </nav>
          <h1 className="text-24 font-bold text-text">Réglages des notifications soignant</h1>
          <p className="text-14 text-text-muted mt-1">
            Canaux de réception et règles d'alerte pour les personnes suivies
          </p>
        </div>
        <Button
          variant="primary"
          space="care"
          size="md"
          data-testid="save-settings-btn"
          onClick={handleSave}
        >
          Enregistrer les préférences
        </Button>
      </div>

      {/* Channel Matrix */}
      <Card title="Canaux de notification par type d'événement">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-13 border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-12 font-bold text-text-muted">
                <th className="py-2.5 px-3">Type d'événement</th>
                <th className="py-2.5 px-3 text-center">In-App / Web</th>
                <th className="py-2.5 px-3 text-center">E-mail</th>
                <th className="py-2.5 px-3 text-center">SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {channelSettings.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 px-3 font-medium text-text">{row.label}</td>
                  <td className="py-3 px-3 text-center">
                    <Toggle
                      checked={row.inApp}
                      onChange={(val) => handleToggleChannel(row.id, "inApp", val)}
                      testID={`toggle-${row.id}-inapp`}
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Toggle
                      checked={row.email}
                      onChange={(val) => handleToggleChannel(row.id, "email", val)}
                      testID={`toggle-${row.id}-email`}
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Toggle
                      checked={row.sms}
                      onChange={(val) => handleToggleChannel(row.id, "sms", val)}
                      testID={`toggle-${row.id}-sms`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quiet Hours Card */}
      <Card title="Plage des heures calmes">
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="font-bold text-text block">
              Activer les heures calmes (21h00 – 07h00)
            </span>
            <span className="text-12 text-text-muted">
              Aucun SMS ou e-mail ne sera envoyé la nuit, les alertes restent visibles dans l'application.
            </span>
          </div>
          <Toggle
            checked={quietHoursEnabled}
            onChange={setQuietHoursEnabled}
            testID="toggle-quiet-hours"
          />
        </div>
      </Card>

      {/* Per person alerts */}
      <Card title="Préférences individuelles par personne suivie">
        <div className="flex flex-col divide-y divide-border">
          {personSettings.map((p) => (
            <div key={p.personId} className="flex items-center justify-between py-3">
              <div>
                <span className="font-bold text-14 text-text">{p.personName}</span>
                <span className="font-mono text-12 text-text-muted ml-2">{p.personCode}</span>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={p.frequency}
                  onChange={(e) =>
                    handleFrequencyChange(
                      p.personId,
                      e.target.value as "Immédiat" | "Résumé quotidien" | "Jamais"
                    )
                  }
                  data-testid={`freq-select-${p.personId}`}
                  className="rounded-input border border-border bg-white px-2.5 py-1 text-12 text-text"
                >
                  <option value="Immédiat">Immédiat</option>
                  <option value="Résumé quotidien">Résumé quotidien</option>
                  <option value="Jamais">Jamais</option>
                </select>
                <Toggle
                  checked={p.enabled}
                  onChange={(val) => handleTogglePerson(p.personId, val)}
                  testID={`toggle-person-${p.personId}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

