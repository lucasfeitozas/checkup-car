import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RegisterScreen() {
  return (
    <View className="flex-1 justify-center gap-6 bg-background p-6">
      <View>
        <Text className="text-3xl font-bold text-text">Criar conta</Text>
        <Text className="mt-2 text-base text-muted">
          A autenticacao local e offline-first sera conectada ao Secure Store.
        </Text>
      </View>

      <Card className="gap-4">
        <Button title="Criar conta local" onPress={() => router.replace("/(tabs)")} />
        <Button title="Voltar para login" variant="ghost" onPress={() => router.back()} />
      </Card>
    </View>
  );
}
