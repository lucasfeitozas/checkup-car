import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getGoogleOAuthConfig } from "@/lib/auth";

export default function LoginScreen() {
  const oauthConfig = getGoogleOAuthConfig();
  const isGoogleConfigured = Boolean(
    oauthConfig.iosClientId || oauthConfig.androidClientId || oauthConfig.webClientId,
  );

  return (
    <View className="flex-1 justify-center gap-6 bg-background p-6">
      <View>
        <Text className="text-3xl font-bold text-text">CheckUp Car</Text>
        <Text className="mt-2 text-base text-muted">
          Controle local-first para revisoes e manutencoes.
        </Text>
      </View>

      <Card className="gap-4">
        <Button title="Entrar em modo local" onPress={() => router.replace("/(tabs)")} />
        <Button
          title={isGoogleConfigured ? "Continuar com Google" : "Configurar Google OAuth"}
          variant="secondary"
          disabled={!isGoogleConfigured}
        />
        <Button
          title="Criar conta"
          variant="ghost"
          onPress={() => router.push("/(auth)/register")}
        />
      </Card>
    </View>
  );
}
