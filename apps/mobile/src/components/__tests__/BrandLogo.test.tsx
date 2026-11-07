import React from "react";
import { render } from "@testing-library/react-native";

import { colors } from "../../theme/colors";
import { BrandLogo } from "../BrandLogo";

describe("BrandLogo", () => {
  it("renders light variant with dark text and brand pill", () => {
    const { getByTestId, queryByTestId } = render(
      <BrandLogo size={44} variant="light" />
    );

    expect(getByTestId("brand-logo")).toBeTruthy();
    const word = getByTestId("brand-logo-text");
    expect(word.props.children).toBe("TSOTSA");
    expect(word.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: colors.text }),
      ])
    );

    const pill = getByTestId("brand-logo-pill");
    expect(pill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.brand }),
      ])
    );

    // Light variant should not have the white background disk
    expect(queryByTestId("brand-logo-dark-disk")).toBeNull();
  });

  it("renders dark variant with white text, white pill and white disk", () => {
    const { getByTestId } = render(
      <BrandLogo size={44} variant="dark" />
    );

    const disk = getByTestId("brand-logo-dark-disk");
    expect(disk).toBeTruthy();
    // 1.24 * 44 ≈ 55
    expect(disk.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: colors.white,
        }),
        expect.objectContaining({
          width: 55,
          height: 55,
        }),
      ])
    );

    const word = getByTestId("brand-logo-text");
    expect(word.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: colors.white }),
      ])
    );

    const pill = getByTestId("brand-logo-pill");
    expect(pill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.white }),
      ])
    );
  });

  it("scales with custom size", () => {
    const { getByTestId } = render(<BrandLogo size={100} variant="light" />);
    const word = getByTestId("brand-logo-text");
    // word font size = 0.6 * 100 = 60
    expect(word.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 60 }),
      ])
    );
  });
});

