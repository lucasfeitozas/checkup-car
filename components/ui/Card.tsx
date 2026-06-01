import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ padded = true, className, ...props }: CardProps) {
  return (
    <View
      className={`rounded-xl bg-surface shadow-sm ${padded ? "p-4" : ""} ${className ?? ""}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
      {...props}
    />
  );
}
