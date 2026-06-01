import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { Vehicle } from "@/store/vehicleStore";

type VehicleCardProps = {
  vehicle: Vehicle;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text">{vehicle.nickname}</Text>
          <Text className="mt-1 text-sm text-muted">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </Text>
        </View>
        <Text className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white">
          {vehicle.plate}
        </Text>
      </View>
      <Text className="text-sm text-text">{vehicle.currentKm.toLocaleString("pt-BR")} km</Text>
    </Card>
  );
}
