import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { styled } from "styled-components/native";

import { Card } from "@/components/common/Card";
import { AppText, Column, Row } from "@/components/common/styled";
import type { VehicleListItem } from "@/features/vehicles/stores/vehicleStore";

export type VehicleCardProps = {
  vehicle: VehicleListItem;
  onPress?: () => void;
};

const PlateBadge = styled(AppText).attrs({
  $color: "white",
  $size: 12,
  $weight: 700,
})`
  align-self: flex-start;
  background-color: ${({ theme }) => theme.primary};
  border-radius: 6px;
  padding: 4px 8px;
`;

export function VehicleCard({ vehicle, onPress }: VehicleCardProps): ReactElement {
  const description = [vehicle.brand, vehicle.model, String(vehicle.year)]
    .filter(Boolean)
    .join(" ");

  const content = (
    <Card $gap={12}>
      <Row $align="flex-start" $justify="space-between" $gap={12}>
        <Column $flex={1} $gap={4}>
          <AppText $size={18} $weight={600}>
            {vehicle.nickname}
          </AppText>
          <AppText $color="muted">{description}</AppText>
        </Column>
        <PlateBadge>{vehicle.plate}</PlateBadge>
      </Row>
      <AppText $weight={600}>{vehicle.currentKm.toLocaleString("pt-BR")} km</AppText>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}
