import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatNumber, formatDate, normalizeLocale, DEFAULT_LOCALE } from "@tsotsa/i18n";
import "../../i18n/setup";
import { Button, DataTable, type DataTableColumn } from "../../components";
import { initialFollowedPersons } from "../../features/caregiver/caregiverData";
import { parseFrenchDate } from "../../features/caregiver/evaluationCalculator";
import type { FollowedPerson } from "../../features/caregiver/types";

export function FollowedPersonsPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("caregiver");
  const { t: tMedical } = useTranslation("medical");
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    document.title = t("persons.pageTitle");
  }, [t]);

  const filteredData = useMemo(() => {
    return initialFollowedPersons.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const formatAge = (rawAge: string): string => {
    const match = /^(\d+)/.exec(rawAge);
    if (match) {
      return t("persons.ageMonths", { months: formatNumber(parseInt(match[1], 10), locale) });
    }
    return rawAge;
  };

  const formatRegion = (region: string): string => {
    if (region === "Extrême-Nord") return t("persons.regions.farNorth");
    if (region === "Nord") return t("persons.regions.north");
    return region;
  };

  const formatFacility = (facility: string): string => {
    if (facility === "CMA de Kousséri") return t("persons.facilities.kousseri");
    if (facility === "Hôpital Régional de Maroua") return t("persons.facilities.maroua");
    if (facility === "Hôpital Régional de Garoua") return t("persons.facilities.garoua");
    return facility;
  };

  const formatStatus = (status: FollowedPerson["status"]): string => {
    if (status === "MAS") return tMedical("status.sam");
    if (status === "MAM") return tMedical("status.mam");
    return tMedical("status.postSam");
  };

  const columns: DataTableColumn<FollowedPerson>[] = [
    {
      key: "code",
      header: t("persons.columns.code"),
      width: "120px",
      render: (row) => <span className="font-mono font-bold text-care">{row.code}</span>,
    },
    {
      key: "name",
      header: t("persons.columns.name"),
      width: "140px",
      render: (row) => <span className="font-bold text-text">{row.name}</span>,
    },
    {
      key: "age",
      header: t("persons.columns.ageGender"),
      width: "130px",
      render: (row) => <span>{`${formatAge(row.age)} · ${row.gender}`}</span>,
    },
    {
      key: "facility",
      header: t("persons.columns.facility"),
      render: (row) => (
        <span className="text-13">
          {`${formatRegion(row.region)} · ${formatFacility(row.facility)}`}
        </span>
      ),
    },
    {
      key: "status",
      header: t("persons.columns.status"),
      render: (row) => {
        let badgeBg = "bg-primary-50 text-primary-700 border-primary-200";
        if (row.status === "MAS") {
          badgeBg = "bg-red-50 text-red-700 border-red-200";
        } else if (row.status === "MAM") {
          badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
        } else if (row.status === "Suivi post-MAS") {
          badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-block px-2 py-0.5 rounded text-12 font-bold border ${badgeBg}`}>
              {formatStatus(row.status)}
            </span>
            <span className="text-12 text-text-muted">
              {t("persons.muacShort", {
                pb: formatNumber(row.pb, locale),
                z: formatNumber(row.zScore, locale),
              })}
            </span>
          </div>
        );
      },
    },
    {
      key: "lastEvaluation",
      header: t("persons.columns.lastEvaluation"),
      width: "140px",
      render: (row) => (
        <span>
          {formatDate(parseFrenchDate(row.lastEvaluation), locale, {
            day: locale === "en" ? "numeric" : "2-digit",
            month: locale === "en" ? "numeric" : "2-digit",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("persons.columns.actions"),
      width: "110px",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          data-testid={`view-person-${row.id}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/soignant/personnes/${row.id}`);
          }}
        >
          {t("persons.recordBtn")}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="caregiver-followed-persons-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-text">
            {t("persons.title", { count: filteredData.length })}
          </h1>
          <p className="text-14 text-text-muted mt-1">{t("persons.subtitle")}</p>
        </div>
        <Button variant="primary" space="care" size="md">
          {t("persons.newAdmissionBtn")}
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            data-testid="search-person-input"
            placeholder={t("persons.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text placeholder-text-muted focus:border-care focus:outline-none"
          />
        </div>
        <select
          data-testid="status-filter-select"
          aria-label={t("persons.statusFilterAria")}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-input border border-border bg-white px-3 py-2 text-13 text-text font-medium"
        >
          <option value="all">{t("persons.statusAll")}</option>
          <option value="MAM">{tMedical("status.mam")}</option>
          <option value="MAS">{tMedical("status.sam")}</option>
          <option value="Suivi post-MAS">{tMedical("status.postSam")}</option>
        </select>
        <span className="px-3 py-2 text-13 bg-surface-2 border border-border rounded-input text-text-muted cursor-pointer select-none">
          {t("persons.regionFilter")}
        </span>
        <span className="px-3 py-2 text-13 bg-surface-2 border border-border rounded-input text-text-muted cursor-pointer select-none">
          {t("persons.facilityFilter")}
        </span>
        <span className="px-3 py-2 text-13 bg-surface-2 border border-border rounded-input text-text-muted cursor-pointer select-none">
          {t("persons.ageFilter")}
        </span>
      </div>

      <DataTable
        testID="followed-persons-table"
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        space="care"
        onRowClick={(row) => navigate(`/soignant/personnes/${row.id}`)}
      />
    </div>
  );
}
