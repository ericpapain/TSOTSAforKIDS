import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { colors } from "../../theme/colors";
import { Card } from "../Card";

describe("Card", () => {
  it("renders children with 1px border and radius 9", () => {
    const { getByTestId, getByText } = render(
      <Card>
        <Text>Contenu de carte</Text>
      </Card>
    );

    const card = getByTestId("card");
    expect(getByText("Contenu de carte")).toBeTruthy();
    expect(card.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: colors.white,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 9,
        }),
      ])
    );
  });
});

