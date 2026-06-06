import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { VehicleListItem } from "@/store/vehicleStore";

export type VehicleCardProps = {
  vehicle: VehicleListItem;
  onPress?: () => void;
};

export function VehicleCard({ vehicle, onPress }: VehicleCardProps): ReactElement {
  const description = [vehicle.brand, vehicle.model, String(vehicle.year)]
    .filter(Boolean)
    .join(" ");

  const content = (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text">{vehicle.nickname}</Text>
          <Text className="mt-1 text-sm text-muted">{description}</Text>
        </View>
        <Text className="rounded-md bg-primary px-2 py-1 text-xs font-bold text-white">
          {vehicle.plate}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-text">
        {vehicle.currentKm.toLocaleString("pt-BR")} km
      </Text>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      {content}
    </Pressable>
  );
}
