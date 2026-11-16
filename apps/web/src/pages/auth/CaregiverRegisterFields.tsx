import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getWebApiClient } from "../../api/client";

export interface FacilityOption {
  id: string;
  name: string;
}

export interface CaregiverRegisterFieldsProps {
  facilityId: string;
  onChangeFacilityId: (id: string) => void;
  specialty: string;
  onChangeSpecialty: (spec: string) => void;
  orderNumber: string;
  onChangeOrderNumber: (num: string) => void;
}

export const CaregiverRegisterFields: React.FC<CaregiverRegisterFieldsProps> = ({
  facilityId,
  onChangeFacilityId,
  specialty,
  onChangeSpecialty,
  orderNumber,
  onChangeOrderNumber,
}) => {
  const { t } = useTranslation("auth");
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const apiClient = getWebApiClient();
        const res = await apiClient.client.GET("/v1/organizations", {
          params: { query: { only_active: true } as never },
        });
        if (res.data && Array.isArray(res.data)) {
          const list = res.data.map((o: { id: string; name: string }) => ({
            id: o.id,
            name: o.name,
          }));
          setFacilities(list);
          if (list.length > 0 && !facilityId) {
            onChangeFacilityId(list[0].id);
          }
        }
      } catch {
        // Optional fallback
      }
    };
    void fetchFacilities();
  }, [facilityId, onChangeFacilityId]);

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          {t("login.form.facility")} *
        </label>
        <select
          required
          data-testid="register-facility-select"
          value={facilityId}
          onChange={(e) => onChangeFacilityId(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary bg-white"
        >
          {facilities.length > 0 ? (
            facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))
          ) : (
            <option value="">{t("login.form.facilityPlaceholder")}</option>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.specialty")} *
          </label>
          <input
            type="text"
            required
            data-testid="register-specialty-input"
            value={specialty}
            onChange={(e) => onChangeSpecialty(e.target.value)}
            placeholder={t("login.form.specialtyPlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.orderNumber")}
          </label>
          <input
            type="text"
            data-testid="register-order-number-input"
            value={orderNumber}
            onChange={(e) => onChangeOrderNumber(e.target.value)}
            placeholder={t("login.form.orderNumberPlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </>
  );
};
