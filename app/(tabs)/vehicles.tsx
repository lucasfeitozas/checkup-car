import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { VehicleCard } from "@/components/features/VehicleCard";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehiclesScreen() {
  const vehicles = useVehicleStore((state) => state.vehicles);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <View>
        <Text className="font-jakarta text-2xl font-bold text-text">Veículos</Text>
        <Text className="font-jakarta mt-1 text-base text-muted">Gerencie sua frota.</Text>
      </View>

      {vehicles.map((vehicle) => (
        <Link href={{ pathname: "/vehicle/[id]", params: { id: vehicle.id } }} key={vehicle.id}>
          <VehicleCard vehicle={vehicle} />
        </Link>
      ))}
    </ScrollView>
  );
}
