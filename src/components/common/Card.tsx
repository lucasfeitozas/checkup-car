import type { ViewProps } from "react-native";
import { styled } from "styled-components/native";

type CardProps = ViewProps & {
  padded?: boolean;
  $gap?: number;
};

export const Card = styled.View.attrs({
  style: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
})<CardProps>`
  background-color: ${({ theme }) => theme.surface};
  border-radius: 12px;
  ${({ padded = true }) => (padded ? "padding: 16px;" : "")}
  ${({ $gap = 0 }) => ($gap > 0 ? `gap: ${$gap}px;` : "")}
`;
