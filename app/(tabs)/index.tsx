import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { useVehicleStore } from "@/store/vehicleStore";

export default function DashboardScreen() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const totalKm = vehicles.reduce((sum, vehicle) => sum + vehicle.currentKm, 0);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <View>
        <Text className="text-3xl font-bold text-text">Dashboard</Text>
        <Text className="mt-1 text-base text-muted">Resumo local dos seus veiculos.</Text>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-sm text-muted">Veiculos</Text>
          <Text className="mt-2 text-3xl font-bold text-primary">{vehicles.length}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-sm text-muted">Km total</Text>
          <Text className="mt-2 text-3xl font-bold text-primary">
            {totalKm.toLocaleString("pt-BR")}
          </Text>
        </Card>
      </View>

      <Card className="gap-2">
        <Text className="text-lg font-semibold text-text">Proxima revisao</Text>
        <Text className="text-sm text-muted">
          A regra de alertas por quilometragem e data sera conectada aos eventos do Drizzle.
        </Text>
        <Link className="mt-2 text-base font-semibold text-accent" href="/(tabs)/vehicles">
          Ver veiculos
        </Link>
      </Card>
    </ScrollView>
  );
}
