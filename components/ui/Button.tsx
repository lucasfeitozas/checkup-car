import type { PressableProps } from "react-native";
import { styled } from "styled-components/native";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
};

const StyledButton = styled.Pressable<{ $variant: ButtonVariant; disabled?: boolean }>`
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 20px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  background-color: ${({ $variant, theme }) => {
    if ($variant === "secondary") return theme.accent;
    if ($variant === "ghost") return "transparent";
    return theme.primary;
  }};
  ${({ $variant, theme }) =>
    $variant === "ghost" ? `border-width: 1px; border-color: ${theme.border};` : ""}
`;

const ButtonText = styled.Text<{ $variant: ButtonVariant }>`
  color: ${({ $variant, theme }) => ($variant === "ghost" ? theme.text : "#FFFFFF")};
  font-family: PlusJakartaSans_700Bold;
  font-size: 16px;
`;

export function Button({ title, variant = "primary", disabled, ...props }: ButtonProps) {
  return (
    <StyledButton
      accessibilityRole="button"
      disabled={Boolean(disabled)}
      $variant={variant}
      {...props}
    >
      <ButtonText $variant={variant}>{title}</ButtonText>
    </StyledButton>
  );
}
