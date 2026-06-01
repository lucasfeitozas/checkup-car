import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { VehicleCard } from "@/components/features/VehicleCard";
import { useVehicleStore } from "@/store/vehicleStore";

export default function VehiclesScreen() {
  const vehicles = useVehicleStore((state) => state.vehicles);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <View>
        <Text className="text-3xl font-bold text-text">Veiculos</Text>
        <Text className="mt-1 text-base text-muted">Cadastro e acompanhamento da frota.</Text>
      </View>

      {vehicles.map((vehicle) => (
        <Link href={{ pathname: "/vehicle/[id]", params: { id: vehicle.id } }} key={vehicle.id}>
          <VehicleCard vehicle={vehicle} />
        </Link>
      ))}
    </ScrollView>
  );
}
