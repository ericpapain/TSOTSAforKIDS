import React from "react";
import { render } from "@testing-library/react-native";

import { colors } from "../../theme/colors";
import { Notice } from "../Notice";

describe("Notice", () => {
  it("renders warning text with warning-50 background and warning-900 color", () => {
    const message = "Attention : aucun changement possible après validation.";
    const { getByTestId } = render(<Notice message={message} />);

    const notice = getByTestId("notice");
    const text = getByTestId("notice-text");

    expect(text.props.children).toBe(message);
    expect(notice.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: colors.warning50,
          borderRadius: 7,
        }),
      ])
    );
    expect(text.props.style).toMatchObject({
      color: colors.warning900,
      fontSize: 13,
    });
  });
});

