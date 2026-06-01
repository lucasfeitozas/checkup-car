import { ScrollView, Text } from "react-native";

import { Card } from "@/components/ui/Card";

export default function HistoryScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-5">
      <Text className="text-3xl font-bold text-text">Historico</Text>
      <Card className="gap-2">
        <Text className="text-lg font-semibold text-text">Linha do tempo</Text>
        <Text className="text-sm text-muted">
          Os registros de manutencao serao carregados de historico_execucao.
        </Text>
      </Card>
    </ScrollView>
  );
}
