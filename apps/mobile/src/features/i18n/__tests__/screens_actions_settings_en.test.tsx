import React from "react";
import { render } from "@testing-library/react-native";
import i18n from "i18next";
import ScreenM21 from "../../../../app/u-given";
import ScreenM22 from "../../../../app/u-history";
import ScreenM23 from "../../../../app/u-offline";
import AddProductScreen from "../../../../app/u-addproduct";
import MyProductEquivalentsScreen from "../../../../app/u-myproduct-eq";
import ScreenM26 from "../../../../app/u-lock";
import ScreenM27 from "../../../../app/u-notif-center";
import ScreenM28 from "../../../../app/u-notif-settings";
import ScreenM29 from "../../../../app/u-notif-off";
import ScreenM30 from "../../../../app/u-schedule";
import CaregiverPendingScreen from "../../../../app/s-pending";

describe("Mobile screens M21–M31 (English)", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  afterAll(async () => {
    await i18n.changeLanguage("fr");
  });

  it("M21 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM21 />);
    expect(getAllByText("Intake recorded").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M21\)/)).toBeTruthy();
    expect(queryByText("Prise enregistrée")).toBeNull();
  });

  it("M22 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM22 />);
    expect(getAllByText("Intake history").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M22\)/)).toBeTruthy();
    expect(queryByText("Historique des prises")).toBeNull();
  });

  it("M23 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM23 />);
    expect(getAllByText("Offline mode").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M23\)/)).toBeTruthy();
    expect(queryByText("Mode hors ligne")).toBeNull();
  });

  it("M24 renders in English", () => {
    const { getByText, queryByText } = render(<AddProductScreen />);
    expect(getByText("Add my product")).toBeTruthy();
    expect(getByText("Product name")).toBeTruthy();
    expect(getByText("See equivalents")).toBeTruthy();
    expect(queryByText("Ajouter mon produit")).toBeNull();
  });

  it("M25 renders in English", () => {
    const { getByText, queryByText } = render(<MyProductEquivalentsScreen />);
    expect(getByText("My product")).toBeTruthy();
    expect(getByText("Private · under review")).toBeTruthy();
    expect(getByText("Give to Amina")).toBeTruthy();
    expect(queryByText("Privé · en vérification")).toBeNull();
  });

  it("M26 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM26 />);
    expect(getAllByText("Scheduled reminder").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M26\)/)).toBeTruthy();
    expect(queryByText("Rappel à l'heure prévue")).toBeNull();
  });

  it("M27 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM27 />);
    expect(getAllByText("My notifications").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M27\)/)).toBeTruthy();
    expect(queryByText("Mes notifications")).toBeNull();
  });

  it("M28 renders in English with LanguageSelector", () => {
    const { getAllByText, getByText, getByTestId, queryByText } = render(<ScreenM28 />);
    expect(getAllByText("Settings").length).toBeGreaterThan(0);
    expect(getByText("Application language")).toBeTruthy();
    expect(getByTestId("language-selector-settings")).toBeTruthy();
    expect(queryByText("Réglages notifications")).toBeNull();
  });

  it("M29 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM29 />);
    expect(getAllByText("Reminders disabled").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M29\)/)).toBeTruthy();
    expect(queryByText("Rappels désactivés")).toBeNull();
  });

  it("M30 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM30 />);
    expect(getAllByText("Scheduled hours").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M30\)/)).toBeTruthy();
    expect(queryByText("Heures prévues")).toBeNull();
  });

  it("M31 renders in English", () => {
    const { getByText, queryByText } = render(<CaregiverPendingScreen />);
    expect(getByText("Caregiver account")).toBeTruthy();
    expect(getByText("Verification in progress")).toBeTruthy();
    expect(getByText("Understood")).toBeTruthy();
    expect(queryByText("Compte soignant")).toBeNull();
  });
});

