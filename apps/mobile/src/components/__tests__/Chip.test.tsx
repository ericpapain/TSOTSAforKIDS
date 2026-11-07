import React from "react";
import { render } from "@testing-library/react-native";

import { colors } from "../../theme/colors";
import { Chip } from "../Chip";

describe("Chip", () => {
  it("renders label and applies default pill shape", () => {
    const { getByTestId } = render(<Chip label="Actif" />);

    const chip = getByTestId("chip");
    const label = getByTestId("chip-label");

    expect(label.props.children).toBe("Actif");
    expect(chip.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          height: 28,
          borderRadius: 14,
        }),
      ])
    );
  });

  it("applies custom background and text colors", () => {
    const { getByTestId } = render(
      <Chip
        label="Urgent"
        backgroundColor={colors.danger50}
        textColor={colors.danger}
      />
    );

    const chip = getByTestId("chip");
    const label = getByTestId("chip-label");

    expect(chip.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.danger50 }),
      ])
    );
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: colors.danger }),
      ])
    );
  });
});

