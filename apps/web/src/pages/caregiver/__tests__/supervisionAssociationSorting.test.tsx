import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "../../../i18n/setup";
import { SupervisionAssociationPage } from "../SupervisionAssociationPage";
import * as personsApi from "../../../api/persons";

const mockPatients: personsApi.NetworkPatient[] = [
  {
    id: "p-001",
    code: "#B-002",
    first_name: "Amina",
    birth_date: "2021-01-01",
    age: "3 ans",
    gender: "F",
    region: "Centre",
    facility: "CMA Elig-Essono",
    status: "Validé",
    assignedDoctorId: "doc-kamga",
    assignedDoctorName: "Dr. Paul Kamga",
  },
  {
    id: "p-002",
    code: "#A-001",
    first_name: "Zack",
    birth_date: "2020-01-01",
    age: "4 ans",
    gender: "M",
    region: "Littoral",
    facility: "Hôpital Laquintinie",
    status: "Validé",
    assignedDoctorId: null,
    assignedDoctorName: null,
  },
  {
    id: "p-003",
    code: "#C-003",
    first_name: "Boris",
    birth_date: "2022-01-01",
    age: "2 ans",
    gender: "M",
    region: "Ouest",
    facility: "Dispensaire Bafoussam",
    status: "Validé",
    assignedDoctorId: "doc-ngo",
    assignedDoctorName: "Dr. Sarah Ngo",
  },
];

const mockDoctors: personsApi.DoctorUser[] = [
  {
    id: "doc-kamga",
    name: "Dr. Paul Kamga",
    email: "kamga@tsotsa-for-kids.com",
    specialty: "Pédiatre",
    facility: "CMA Elig-Essono",
    is_super_caregiver: false,
    canReadAll: true,
    canAssign: true,
    canValidateStaff: false,
  },
  {
    id: "doc-ngo",
    name: "Dr. Sarah Ngo",
    email: "ngo@tsotsa-for-kids.com",
    specialty: "Nutritionniste",
    facility: "Dispensaire Bafoussam",
    is_super_caregiver: true,
    canReadAll: true,
    canAssign: true,
    canValidateStaff: true,
  },
];

describe("SupervisionAssociationPage Sorting and Filtering", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(personsApi, "listAllNetworkPatients").mockResolvedValue(mockPatients);
    vi.spyOn(personsApi, "listActiveDoctors").mockResolvedValue(mockDoctors);
  });

  it("affiche la liste des patients et les contrôles de tri et filtre", async () => {
    render(
      <BrowserRouter>
        <SupervisionAssociationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("supervision-association-page")).toBeInTheDocument();
      expect(screen.getByTestId("association-search-input")).toBeInTheDocument();
      expect(screen.getByTestId("association-sort-select")).toBeInTheDocument();
      expect(screen.getByTestId("toggle-sort-order-btn")).toBeInTheDocument();
    });

    // Default sorted by code asc (#A-001 before #B-002 before #C-003)
    const rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("#A-001");
    expect(rows[1]).toHaveTextContent("#B-002");
    expect(rows[2]).toHaveTextContent("#C-003");
  });

  it("trie les patients par ordre décroissant au clic sur le bouton d'inversion", async () => {
    render(
      <BrowserRouter>
        <SupervisionAssociationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId(/^data-table-row-/)).toHaveLength(3);
    });

    const toggleBtn = screen.getByTestId("toggle-sort-order-btn");
    fireEvent.click(toggleBtn);

    const rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows[0]).toHaveTextContent("#C-003");
    expect(rows[1]).toHaveTextContent("#B-002");
    expect(rows[2]).toHaveTextContent("#A-001");
  });

  it("trie par prénom lors de la sélection du champ Prénom", async () => {
    render(
      <BrowserRouter>
        <SupervisionAssociationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId(/^data-table-row-/)).toHaveLength(3);
    });

    const sortSelect = screen.getByTestId("association-sort-select");
    fireEvent.change(sortSelect, { target: { value: "first_name" } });

    // Amina (#B-002) -> Boris (#C-003) -> Zack (#A-001)
    const rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows[0]).toHaveTextContent("Amina");
    expect(rows[1]).toHaveTextContent("Boris");
    expect(rows[2]).toHaveTextContent("Zack");
  });

  it("trie en cliquant directement sur l'en-tête de colonne", async () => {
    render(
      <BrowserRouter>
        <SupervisionAssociationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId(/^data-table-row-/)).toHaveLength(3);
    });

    const thFirstName = screen.getByTestId("th-sort-firstname");
    fireEvent.click(thFirstName);

    let rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows[0]).toHaveTextContent("Amina");

    // Click again to toggle desc
    fireEvent.click(thFirstName);
    rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows[0]).toHaveTextContent("Zack");
  });

  it("filtre les dossiers par le champ de recherche textuelle", async () => {
    render(
      <BrowserRouter>
        <SupervisionAssociationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId(/^data-table-row-/)).toHaveLength(3);
    });

    const searchInput = screen.getByTestId("association-search-input");
    fireEvent.change(searchInput, { target: { value: "Kamga" } });

    const rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Dr. Paul Kamga");
    expect(rows[0]).toHaveTextContent("Amina");
  });

  it("filtre par statut d'attribution (Assignés / Non assignés)", async () => {
    render(
      <BrowserRouter>
        <SupervisionAssociationPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTestId(/^data-table-row-/)).toHaveLength(3);
    });

    // Click Non assignés
    const unassignedBtn = screen.getByTestId("filter-assignment-unassigned");
    fireEvent.click(unassignedBtn);

    let rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("#A-001");
    expect(rows[0]).toHaveTextContent("Non assigné");

    // Click Assignés
    const assignedBtn = screen.getByTestId("filter-assignment-assigned");
    fireEvent.click(assignedBtn);

    rows = screen.getAllByTestId(/^data-table-row-/);
    expect(rows).toHaveLength(2);
  });
});
