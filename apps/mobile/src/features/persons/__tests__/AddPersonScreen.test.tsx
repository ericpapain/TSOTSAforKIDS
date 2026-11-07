import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AddPersonScreen from "../../../../app/u-addperson";
import { createFamilyMember } from "../personsService";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock("../personsService", () => ({
  createFamilyMember: jest.fn().mockResolvedValue({
    data: {
      id: "person-new-789",
      first_name: "Amina",
      birth_date: "2024-12-12",
      sex: "F",
    },
  }),
}));

describe("AddPersonScreen (M09)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form elements conform to M09 specification", () => {
    const { getByText, getByTestId } = render(<AddPersonScreen />);

    expect(getByText("Ajouter une personne")).toBeTruthy();
    expect(getByText("Qui ?")).toBeTruthy();
    expect(getByText("Moi-même")).toBeTruthy();
    expect(getByText("Un enfant")).toBeTruthy();
    expect(getByText("Un proche")).toBeTruthy();
    expect(getByText("Prénom")).toBeTruthy();
    expect(getByText("Date de naissance")).toBeTruthy();
    expect(getByText("Sexe")).toBeTruthy();
    expect(getByText("Poids")).toBeTruthy();
    expect(getByText("Taille (couchée)")).toBeTruthy();
    expect(getByText("Périmètre brachial (facultatif)")).toBeTruthy();
    expect(
      getByText("Pas de compte à créer : la personne est suivie depuis le vôtre.")
    ).toBeTruthy();
    expect(getByText("Continuer")).toBeTruthy();

    expect(getByTestId("input-first-name")).toBeTruthy();
    expect(getByTestId("input-birth-date")).toBeTruthy();
    expect(getByTestId("input-weight")).toBeTruthy();
    expect(getByTestId("input-height")).toBeTruthy();
    expect(getByTestId("input-muac")).toBeTruthy();
    expect(getByTestId("btn-addperson-continue")).toBeTruthy();
  });

  it("changes person type when tapping choices", () => {
    const { getByTestId, getByText } = render(<AddPersonScreen />);

    fireEvent.press(getByTestId("btn-relation-self"));
    expect(getByText("Taille (debout)")).toBeTruthy();

    fireEvent.press(getByTestId("btn-relation-child"));
    expect(getByText("Taille (couchée)")).toBeTruthy();
  });

  it("shows error alert if required fields are missing", async () => {
    const { getByTestId } = render(<AddPersonScreen />);

    fireEvent.changeText(getByTestId("input-first-name"), "");
    fireEvent.press(getByTestId("btn-addperson-continue"));

    await waitFor(() => {
      expect(createFamilyMember).not.toHaveBeenCalled();
    });
  });

  it("submits valid form, calls createFamilyMember and navigates to u-consent", async () => {
    const { getByTestId } = render(<AddPersonScreen />);

    fireEvent.changeText(getByTestId("input-first-name"), "Amina");
    fireEvent.changeText(getByTestId("input-birth-date"), "12/12/2024");
    fireEvent.changeText(getByTestId("input-weight"), "7,0");
    fireEvent.changeText(getByTestId("input-height"), "76,0");
    fireEvent.changeText(getByTestId("input-muac"), "112");

    fireEvent.press(getByTestId("btn-addperson-continue"));

    await waitFor(() => {
      expect(createFamilyMember).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Amina",
          birth_date: "12/12/2024",
          sex: "F",
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/u-consent",
        params: { personId: "person-new-789", name: "Amina" },
      });
    });
  });

  it("navigates back when pressing back arrow", () => {
    const { getByTestId } = render(<AddPersonScreen />);

    fireEvent.press(getByTestId("app-bar-back-button"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-persons");
  });
});
