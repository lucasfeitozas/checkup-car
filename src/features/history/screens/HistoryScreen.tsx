import { Card } from "@/components/common/Card";
import { AppText, Screen, Title } from "@/components/common/styled";
import { useAppTheme } from "@/theme/ThemeProvider";

export default function HistoryScreen() {
  const { isDark } = useAppTheme();

  return (
    <Screen style={{ backgroundColor: isDark ? "#353935" : "#ECEFF1" }}>
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
