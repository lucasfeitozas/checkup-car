import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { useAppTheme } from "@/components/ThemeProvider";
import type { Vehicle } from "@/store/vehicleStore";

type VehicleCardProps = {
  vehicle: Vehicle;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { isDark } = useAppTheme();
  const description = [vehicle.brand, vehicle.model, String(vehicle.year)]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className={`gap-3 ${isDark ? "" : "bg-white"}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text">{vehicle.nickname}</Text>
          <Text className="mt-1 text-sm text-muted">{description}</Text>
        </View>
        <Text className="rounded-md border border-accent bg-white px-2 py-1 text-xs font-bold text-accent">
          {vehicle.plate}
        </Text>
      </View>
      <Text className="text-sm text-text">{vehicle.currentKm.toLocaleString("pt-BR")} km</Text>
    </Card>
  );
}
