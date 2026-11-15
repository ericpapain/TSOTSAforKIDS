import React from "react";
import { render } from "@testing-library/react-native";
import i18n from "i18next";
import WelcomeScreen from "../../../../app/u-welcome";
import GoogleScreen from "../../../../app/u-google";
import PhoneScreen from "../../../../app/u-signup";
import EmailScreen from "../../../../app/u-email";
import OtpScreen from "../../../../app/u-otp";
import ModulesScreen from "../../../../app/u-modules";
import SoonScreen from "../../../../app/u-soon";
import PersonsScreen from "../../../../app/u-persons";
import AddPersonScreen from "../../../../app/u-addperson";
import ConsentScreen from "../../../../app/u-consent";
import ProfileScreen from "../../../../app/u-profile";

describe("Mobile screens M01–M11 (English)", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  afterAll(async () => {
    await i18n.changeLanguage("fr");
  });

  it("M01 renders in English without French text", () => {
    const { getByText, queryByText } = render(<WelcomeScreen />);
    expect(getByText("Nourish well, track well.")).toBeTruthy();
    expect(getByText("Continue with Google")).toBeTruthy();
    expect(getByText("Continue with my phone")).toBeTruthy();
    expect(getByText("Continue with my email")).toBeTruthy();
    expect(getByText("A single account for the whole family.")).toBeTruthy();
    expect(queryByText("Bien nourrir, bien suivre.")).toBeNull();
  });

  it("M02 renders in English", () => {
    const { getByText, queryByText } = render(<GoogleScreen />);
    expect(getByText("Choose an account")).toBeTruthy();
    expect(getByText("Sign in with Google")).toBeTruthy();
    expect(queryByText("Choisir un compte")).toBeNull();
  });

  it("M03 renders in English", () => {
    const { getByText, queryByText } = render(<PhoneScreen />);
    expect(getByText("I am signing up:")).toBeTruthy();
    expect(getByText("For myself or a loved one")).toBeTruthy();
    expect(getByText("I am a caregiver")).toBeTruthy();
    expect(queryByText("Saisissez votre numéro de téléphone")).toBeNull();
  });

  it("M04 renders in English", () => {
    const { getByText, queryByText } = render(<EmailScreen />);
    expect(getByText("Sign in")).toBeTruthy();
    expect(getByText("Create account")).toBeTruthy();
    expect(getByText("Email address")).toBeTruthy();
    expect(queryByText("Se connecter")).toBeNull();
  });

  it("M05 renders in English", () => {
    const { getByText, queryByText } = render(<OtpScreen />);
    expect(getByText("Validate")).toBeTruthy();
    expect(queryByText("Code de confirmation")).toBeNull();
  });

  it("M06 renders in English", () => {
    const { getByText, queryByText } = render(<ModulesScreen />);
    expect(getByText("What do you want to track?")).toBeTruthy();
    expect(getByText("Nutrition")).toBeTruthy();
    expect(queryByText("Choisir un module")).toBeNull();
  });

  it("M07 renders in English", () => {
    const { getByText, queryByText } = render(<SoonScreen />);
    expect(getByText("Coming soon")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Bientôt disponible")).toBeNull();
  });

  it("M08 renders in English", () => {
    const { getByText, queryByText } = render(<PersonsScreen />);
    expect(getByText("For whom?")).toBeTruthy();
    expect(getByText("Add a person")).toBeTruthy();
    expect(queryByText("Pour qui est ce suivi ?")).toBeNull();
  });

  it("M09 renders in English", () => {
    const { getByText, queryByText } = render(<AddPersonScreen />);
    expect(getByText("Add a person")).toBeTruthy();
    expect(getByText("First name")).toBeTruthy();
    expect(queryByText("Ajouter une personne")).toBeNull();
  });

  it("M10 renders in English", () => {
    const { getByText, queryByText } = render(<ConsentScreen />);
    expect(getByText("Your agreement")).toBeTruthy();
    expect(getByText("I agree")).toBeTruthy();
    expect(queryByText("Votre accord")).toBeNull();
  });

  it("M11 renders in English", () => {
    const { getByText, queryByText } = render(<ProfileScreen />);
    expect(getByText("Give a product")).toBeTruthy();
    expect(getByText("My intakes")).toBeTruthy();
    expect(queryByText("Donner un produit")).toBeNull();
  });
});
