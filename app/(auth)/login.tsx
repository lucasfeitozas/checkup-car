import { router } from "expo-router";
import { styled } from "styled-components/native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AppText, Column, Title } from "@/components/ui/styled";
import { getGoogleOAuthConfig } from "@/lib/auth";

const AuthScreen = styled.View`
  flex: 1;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  background-color: ${({ theme }) => theme.background};
`;

export default function LoginScreen() {
  const oauthConfig = getGoogleOAuthConfig();
  const isGoogleConfigured = Boolean(
    oauthConfig.iosClientId || oauthConfig.androidClientId || oauthConfig.webClientId,
  );

  return (
    <AuthScreen>
      <Column $gap={8}>
        <Title>CheckUp Car</Title>
        <AppText $color="muted" $size={16}>
          Controle local-first para revisoes e manutencoes.
        </AppText>
      </Column>

      <Card $gap={16}>
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
    </AuthScreen>
  );
}
