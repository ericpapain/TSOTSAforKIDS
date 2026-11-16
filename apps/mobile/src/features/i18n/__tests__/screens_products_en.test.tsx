import React from "react";
import { render } from "@testing-library/react-native";
import i18n from "i18next";
import ChooseScreen from "../../../../app/u-choose";
import DropdownScreen from "../../../../app/u-dropdown";
import F75Screen from "../../../../app/u-f75";
import ProductScreen from "../../../../app/u-product";
import RegionScreen from "../../../../app/u-region";
import EmptyScreen from "../../../../app/u-empty";
import FoodDetailScreen from "../../../../app/u-food";
import NutrientsScreen from "../../../../app/u-nutrients";
import ScreenM20 from "../../../../app/u-give";

describe("Mobile screens M12–M20 (English)", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  afterAll(async () => {
    await i18n.changeLanguage("fr");
  });

  it("M12 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ChooseScreen />);
    expect(getAllByText("Choose a product").length).toBeGreaterThan(0);
    expect(getByText("+ Add my product")).toBeTruthy();
    expect(queryByText("Choisir un produit")).toBeNull();
  });

  it("M13 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<DropdownScreen />);
    expect(getAllByText("Choose a product").length).toBeGreaterThan(0);
    expect(getByText("REFERENCE PRODUCTS")).toBeTruthy();
    expect(getByText("+ Add my product")).toBeTruthy();
    expect(queryByText("Produits nutritionnels de référence")).toBeNull();
  });

  it("M14 renders in English", () => {
    const { getByText, queryByText } = render(<F75Screen />);
    expect(getByText(/Therapeutic stabilization milk/)).toBeTruthy();
    expect(getByText("Composition per 100 ml")).toBeTruthy();
    expect(queryByText("Lait thérapeutique hospitalier")).toBeNull();
  });

  it("M15 renders in English", () => {
    const { getByText, queryByText } = render(<ProductScreen />);
    expect(getByText("Equivalent local foods")).toBeTruthy();
    expect(getByText("Give to Amina")).toBeTruthy();
    expect(queryByText("Aliments locaux équivalents")).toBeNull();
  });

  it("M16 renders in English", () => {
    const { getByText, queryByText } = render(<RegionScreen />);
    expect(getByText(/foods available in/)).toBeTruthy();
    expect(getByText("Give to Amina")).toBeTruthy();
    expect(queryByText("aliments disponibles dans l'")).toBeNull();
  });

  it("M17 renders in English", () => {
    const { getByText, queryByText } = render(<EmptyScreen />);
    expect(getByText("No local food has been documented for this region yet.")).toBeTruthy();
    expect(getByText("Show all regions")).toBeTruthy();
    expect(queryByText("Aucun aliment local n'est encore renseigné")).toBeNull();
  });

  it("M18 renders in English", () => {
    const { getByText, queryByText } = render(<FoodDetailScreen />);
    expect(getByText("Nutrient")).toBeTruthy();
    expect(getByText("★ essential target nutrient")).toBeTruthy();
    expect(getByText("Give to Amina")).toBeTruthy();
    expect(queryByText("★ nutriment essentiel recherché")).toBeNull();
  });

  it("M19 renders in English", () => {
    const { getByText, queryByText } = render(<NutrientsScreen />);
    expect(getByText("Essential nutrients")).toBeTruthy();
    expect(getByText("Apply")).toBeTruthy();
    expect(getByText("Protein")).toBeTruthy();
    expect(queryByText("Rétablir le choix par défaut")).toBeNull();
  });

  it("M20 renders in English", () => {
    const { getAllByText, getByText, queryByText } = render(<ScreenM20 />);
    expect(getAllByText("Confirm intake").length).toBeGreaterThan(0);
    expect(getByText(/Foundation screen \(M20\)/)).toBeTruthy();
    expect(queryByText("Confirmer la prise")).toBeNull();
  });
});
