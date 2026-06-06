import { Card } from "@/components/ui/Card";
import { AppText, Screen, Title } from "@/components/ui/styled";

export default function HistoryScreen() {
  return (
    <Screen>
      <Title>Histórico</Title>
      <Card $gap={8}>
        <AppText $size={18} $weight={600}>
          Linha do tempo
        </AppText>
        <AppText $color="muted">
          Os registros de manutenção serão carregados de historico_execucao.
        </AppText>
      </Card>
    </Screen>
  );
}
