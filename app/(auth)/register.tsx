import { router } from "expo-router";
import { styled } from "styled-components/native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AppText, Column, Title } from "@/components/ui/styled";

const AuthScreen = styled.View`
  flex: 1;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  background-color: ${({ theme }) => theme.background};
`;

export default function RegisterScreen() {
  return (
    <AuthScreen>
      <Column $gap={8}>
        <Title>Criar conta</Title>
        <AppText $color="muted" $size={16}>
          A autenticacao local e offline-first sera conectada ao Secure Store.
        </AppText>
      </Column>

      <Card $gap={16}>
        <Button title="Criar conta local" onPress={() => router.replace("/(tabs)")} />
        <Button title="Voltar para login" variant="ghost" onPress={() => router.back()} />
      </Card>
    </AuthScreen>
  );
}
