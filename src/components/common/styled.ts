import { styled } from "styled-components/native";

import type { AppTheme } from "@/theme/theme";

type TextProps = {
  $size?: number;
  $lineHeight?: number;
  $weight?: 400 | 500 | 600 | 700;
  $color?: "text" | "muted" | "primary" | "accent" | "white" | "success";
  $uppercase?: boolean;
};

function fontFamily(weight: TextProps["$weight"]): string {
  switch (weight) {
    case 700:
      return "PlusJakartaSans_700Bold";
    case 600:
      return "PlusJakartaSans_600SemiBold";
    case 500:
      return "PlusJakartaSans_500Medium";
    default:
      return "PlusJakartaSans_400Regular";
  }
}

function textColor(color: TextProps["$color"], theme: AppTheme): string {
  if (color === "white") return "#FFFFFF";
  if (color === "success") return "#16A34A";
  return theme[color ?? "text"];
}

export const Screen = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: {
    gap: 20,
    padding: 20,
    paddingBottom: 128,
  },
  style: { backgroundColor: theme.background },
}))``;

export const ScreenContent = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.background};
`;

export const Column = styled.View<{ $gap?: number; $flex?: number }>`
  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : "")}
  gap: ${({ $gap = 0 }) => $gap}px;
`;

export const Row = styled.View<{
  $gap?: number;
  $align?: "flex-start" | "center" | "flex-end" | "stretch";
  $justify?: "flex-start" | "center" | "space-between";
  $flex?: number;
}>`
  ${({ $flex }) => ($flex !== undefined ? `flex: ${$flex};` : "")}
  flex-direction: row;
  align-items: ${({ $align = "center" }) => $align};
  justify-content: ${({ $justify = "flex-start" }) => $justify};
  gap: ${({ $gap = 0 }) => $gap}px;
`;

export const AppText = styled.Text<TextProps>`
  color: ${({ $color, theme }) => textColor($color, theme)};
  font-family: ${({ $weight }) => fontFamily($weight)};
  font-size: ${({ $size = 14 }) => $size}px;
  ${({ $lineHeight }) => ($lineHeight ? `line-height: ${$lineHeight}px;` : "")}
  ${({ $uppercase }) => ($uppercase ? "text-transform: uppercase;" : "")}
`;

export const Title = styled(AppText).attrs({
  $size: 30,
  $weight: 700,
})``;

export const SectionTitle = styled(AppText).attrs({
  $size: 20,
  $weight: 700,
})``;

export const MutedText = styled(AppText).attrs({
  $color: "muted",
})``;

export const Surface = styled.View<{ $padding?: number; $radius?: number }>`
  background-color: ${({ theme }) => theme.surface};
  border-radius: ${({ $radius = 12 }) => $radius}px;
  padding: ${({ $padding = 16 }) => $padding}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.border};
`;

export const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.border};
`;

export const Bullet = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.muted};
`;
