import { render, screen } from "@testing-library/react-native";

import { Button } from "@/components/common/Button";

describe("Button", () => {
  it("renders the provided title", () => {
    render(<Button title="Entrar" />);

    expect(screen.getByText("Entrar")).toBeOnTheScreen();
  });
});
