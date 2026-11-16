import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { FaCog, FaBell, FaMoon, FaGlobe, FaCheck } from "react-icons/fa";
import { AppHeader } from "../../components/AppHeader";
import { UserNavTabs } from "./UserNavTabs";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useUserStore } from "../../features/user/useUserStore";
import { useOptionalAuth } from "../../api/authContext";

export const UserSettingsPage: React.FC = () => {
  const { t } = useTranslation(["mobile", "common", "notifications"]);
  const navigate = useNavigate();
  const authContext = useOptionalAuth();
  const { settings, updateSettings, children } = useUserStore();

  const [reminders, setReminders] = useState(settings.remindersActive);
  const [quietStart, setQuietStart] = useState(settings.quietHoursStart);
  const [quietEnd, setQuietEnd] = useState(settings.quietHoursEnd);
  const [channel, setChannel] = useState(settings.preferredChannel);
  const [savedToast, setSavedToast] = useState(false);

  const handleLogout = () => {
    authContext?.logout();
    navigate("/connexion");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      remindersActive: reminders,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
      preferredChannel: channel,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader space="user" onLogout={handleLogout} />
      <UserNavTabs />

      <main className="mx-auto max-w-[800px] px-7 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <FaCog size={20} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#17302A]">
              {t("mobile:settings.title", "Réglages du compte & Notifications")}
            </h1>
            <p className="text-[13px] text-[#5B6B66]">
              {t("mobile:settings.subtitle", "Gérez vos rappels de prises alimentaires et vos préférences.")}
            </p>
          </div>
        </div>

        {savedToast && (
          <div
            data-testid="settings-saved-toast"
            className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold rounded-lg flex items-center gap-2"
          >
            <FaCheck />
            <span>{t("common:actions.saved", "Préférences enregistrées avec succès.")}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1 : Rappels automatiques */}
          <div className="rounded-xl border border-[#D5DEDA] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBell className="text-primary text-[18px]" />
                <div>
                  <h2 className="text-[15px] font-bold text-[#17302A]">
                    {t("mobile:settings.reminderSwitches", "Rappels automatiques de prises")}
                  </h2>
                  <p className="text-[12px] text-[#5B6B66]">
                    {t(
                      "mobile:settings.reminderDesc",
                      "Recevoir des notifications à chaque heure de prise (matin, midi, soir)."
                    )}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="reminders-toggle"
                  checked={reminders}
                  onChange={(e) => setReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#D5DEDA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Heures calmes M29 */}
            <div className="pt-4 border-t border-[#E5ECE9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FaMoon className="text-amber-600 text-[16px]" />
                <div>
                  <span className="text-[13px] font-bold text-[#17302A]">
                    {t("mobile:settings.quietHours", "Heures calmes")}
                  </span>
                  <p className="text-[11px] text-[#5B6B66]">
                    {t("mobile:settings.quietHoursDesc", "Aucune notification sonore durant cette période.")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="px-2.5 py-1.5 border border-[#D5DEDA] rounded-md text-[13px]"
                />
                <span className="text-[#5B6B66] text-[12px]">à</span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="px-2.5 py-1.5 border border-[#D5DEDA] rounded-md text-[13px]"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Langue et Canal */}
          <div className="rounded-xl border border-[#D5DEDA] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaGlobe className="text-primary text-[18px]" />
                <div>
                  <h2 className="text-[15px] font-bold text-[#17302A]">
                    {t("mobile:settings.languageChoice", "Langue de l'interface")}
                  </h2>
                  <p className="text-[12px] text-[#5B6B66]">
                    {t("mobile:settings.languageChoiceDesc", "Basculer entre Français et Anglais.")}
                  </p>
                </div>
              </div>

              <LanguageSwitcher testID="settings-language-switcher" />
            </div>

            <div className="pt-4 border-t border-[#E5ECE9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-[#17302A]">
                {t("mobile:settings.notificationChannel", "Canal de notification")} :
              </span>
              <div className="flex gap-2">
                {(["web", "sms", "email"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                      channel === ch
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-[#5B6B66] border-[#D5DEDA] hover:bg-[#F1F3F2]"
                    }`}
                  >
                    {ch.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3 : Enfants rattachés */}
          <div className="rounded-xl border border-[#D5DEDA] bg-white p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-[#17302A] mb-3">
              {t("mobile:settings.linkedChildren", "Enfants rattachés au compte")} ({children.length})
            </h2>
            <div className="divide-y divide-[#E5ECE9]">
              {children.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-[13px]">
                  <span className="font-bold text-[#17302A]">
                    {c.firstName} ({c.code})
                  </span>
                  <span className="text-[#5B6B66]">{c.birthDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              data-testid="save-user-settings-btn"
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors"
            >
              {t("common:actions.save", "Enregistrer les modifications")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default UserSettingsPage;
