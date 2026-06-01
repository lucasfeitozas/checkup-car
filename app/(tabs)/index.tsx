import { useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useVehicleStore } from "@/store/vehicleStore";
import { useAppTheme } from "@/components/ThemeProvider";

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const totalKm = vehicles.reduce((sum, vehicle) => sum + vehicle.currentKm, 0);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-5 pb-10">
      {/* Header com Toggle */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-jakarta text-3xl font-bold text-text">Dashboard</Text>
          <Text className="font-jakarta mt-1 text-base text-muted">
            Resumo local dos seus veículos.
          </Text>
        </View>
        <ThemeToggle />
      </View>

      {/* Quick Look Section */}
      <View className="gap-4">
        <Text className="font-jakarta text-xl font-bold text-text">Quick Look</Text>
        <View className="flex-row gap-4">
          <Card className="flex-1 p-4" style={{ minHeight: 120 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Ionicons name="car-outline" size={18} color={isDark ? "#B0BEC5" : "#757575"} />
                <Text className="font-jakarta text-xs font-medium text-muted">Veículo Ativo:</Text>
              </View>
              <View className="rounded-full bg-green-500/10 px-2 py-0.5">
                <Text className="font-jakarta text-[10px] font-bold text-green-500">● online</Text>
              </View>
            </View>
            <Text className="font-jakarta mt-2 text-4xl font-bold text-text">
              {vehicles.length}
            </Text>
            <Text className="font-jakarta mt-auto text-[11px] text-muted">
              Frota Registrada: {vehicles.length}
            </Text>
          </Card>

          <Card className="flex-1 p-4" style={{ minHeight: 120 }}>
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="speedometer-outline"
                size={18}
                color={isDark ? "#B0BEC5" : "#757575"}
              />
              <Text className="font-jakarta text-xs font-medium text-muted">Km total:</Text>
            </View>
            <Text className="font-jakarta mt-2 text-3xl font-bold text-text">
              {totalKm.toLocaleString("pt-BR")}
            </Text>
            <View className="mt-auto flex-row items-center gap-1">
              <Text className="font-jakarta text-[11px] text-muted">Este Mês: +158 km</Text>
              <Ionicons name="trending-up" size={12} color={isDark ? "#2196F3" : "#E53935"} />
            </View>
          </Card>
        </View>
      </View>

      {/* Alerta de Próxima Revisão */}
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-jakarta text-xl font-bold text-text">Próxima revisão</Text>
          <Pressable onPress={() => router.push("/(tabs)/vehicles")}>
            <Text className="text-sm font-bold text-accent font-jakarta">Ver veículos</Text>
          </Pressable>
        </View>
        <Card className="p-0 overflow-hidden">
          <View
            className="flex-row items-center gap-2 px-4 py-3"
            style={{ backgroundColor: isDark ? "#2196F3" : "#E53935" }}
          >
            <Ionicons name={isDark ? "construct" : "alert-circle"} size={20} color="white" />
            <Text className="font-jakarta text-sm font-bold text-white uppercase tracking-wider">
              Manutenção Preventiva Pendente
            </Text>
          </View>

          <View className="p-5 gap-4">
            <Text className="font-jakarta text-sm font-bold text-text leading-relaxed">
              Atenção: A regra de quilometragem/data (via Drizzle) gerou um alerta.
            </Text>

            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-muted" />
                <Text className="font-jakarta text-sm text-text">
                  <Text className="font-bold">Próxima:</Text> Revisão de 45,000 km
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-muted" />
                <Text className="font-jakarta text-sm text-text">
                  <Text className="font-bold">Estimativa:</Text> Em 15 dias ou 842 km
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-muted" />
                <Text className="font-jakarta text-sm text-text">
                  <Text className="font-bold">Ação Recomendada:</Text> Verificar fluidos e filtros.
                </Text>
              </View>
            </View>

            <Pressable
              className="mt-2 flex-row items-center justify-center gap-2 rounded-xl py-4 shadow-lg"
              style={{
                backgroundColor: isDark ? "#2196F3" : "#E53935",
                shadowColor: isDark ? "#2196F3" : "#E53935",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text className="font-jakarta text-base font-bold text-white">
                Agendar Revisão Agora
              </Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
