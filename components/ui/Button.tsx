import { Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-accent",
  ghost: "bg-transparent border border-border",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  ghost: "text-text",
};

export function Button({ title, variant = "primary", disabled, className, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-12 items-center justify-center rounded-lg px-5 ${variantClasses[variant]} ${
        disabled ? "opacity-50" : "active:opacity-80"
      } ${className ?? ""}`}
      disabled={disabled}
      {...props}
    >
      <Text className={`font-jakarta text-base font-bold ${textClasses[variant]}`}>{title}</Text>
    </Pressable>
  );
}
