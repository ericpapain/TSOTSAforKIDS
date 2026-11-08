import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataTable, type DataTableColumn } from "../../components";
import { initialFollowedPersons } from "../../features/caregiver/caregiverData";
import type { FollowedPerson } from "../../features/caregiver/types";

export function FollowedPersonsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    return initialFollowedPersons.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const columns: DataTableColumn<FollowedPerson>[] = [
    {
      key: "code",
      header: "Identifiant",
      width: "120px",
      render: (row) => <span className="font-mono font-bold text-care">{row.code}</span>,
    },
    {
      key: "name",
      header: "Prénom",
      width: "140px",
      render: (row) => <span className="font-bold text-text">{row.name}</span>,
    },
    {
      key: "age",
      header: "Âge / Sexe",
      width: "130px",
      render: (row) => (
        <span>
          {row.age} · {row.gender}
        </span>
      ),
    },
    {
      key: "facility",
      header: "Région / Établissement",
      render: (row) => (
        <span className="text-13">
          {row.region} · {row.facility}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut nutritionnel",
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
              {row.status}
            </span>
            <span className="text-12 text-text-muted">
              PB {row.pb} mm · z = {row.zScore.toString().replace(".", ",")}
            </span>
          </div>
        );
      },
    },
    {
      key: "lastEvaluation",
      header: "Dernière évaluation",
      width: "140px",
      accessor: "lastEvaluation",
    },
    {
      key: "actions",
      header: "Actions",
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
          Dossier ›
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="caregiver-followed-persons-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-text">Personnes suivies ({filteredData.length})</h1>
          <p className="text-14 text-text-muted mt-1">Registre actif des enfants suivis pour malnutrition</p>
        </div>
        <Button variant="primary" space="care" size="md">
          + Nouvelle admission
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            data-testid="search-person-input"
            placeholder="Rechercher par identifiant ou prénom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text placeholder-text-muted focus:border-care focus:outline-none"
          />
        </div>
        <select
          data-testid="status-filter-select"
          aria-label="Filtrer par statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-input border border-border bg-white px-3 py-2 text-13 text-text font-medium"
        >
          <option value="all">Statut : Tous ▾</option>
          <option value="MAM">MAM</option>
          <option value="MAS">MAS</option>
          <option value="Suivi post-MAS">Suivi post-MAS</option>
        </select>
        <span className="px-3 py-2 text-13 bg-surface-2 border border-border rounded-input text-text-muted cursor-pointer select-none">
          Région ▾
        </span>
        <span className="px-3 py-2 text-13 bg-surface-2 border border-border rounded-input text-text-muted cursor-pointer select-none">
          Établissement ▾
        </span>
        <span className="px-3 py-2 text-13 bg-surface-2 border border-border rounded-input text-text-muted cursor-pointer select-none">
          Âge ▾
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

