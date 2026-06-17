import {
  getMaintenanceAlert,
  getMaintenanceEventStatus,
  type MaintenanceAlert,
  type MaintenanceEventStatus,
} from "@/features/vehicles/rules/maintenanceEventList";
import type {
  KmRecord,
  MaintenanceEvent,
  MaintenanceExecution,
  Vehicle,
} from "@/features/vehicles/stores/vehicleStore";

export type VehicleOverviewEvent = {
  event: MaintenanceEvent;
  status: MaintenanceEventStatus;
  alert: MaintenanceAlert;
};

export type VehicleOverviewSummary = {
  totalEvents: number;
  alertEvents: number;
  overdueEvents: number;
};

export type VehicleOverview = {
  vehicle: Vehicle;
  modelDescription: string;
  lastEventKm?: number;
  summary: VehicleOverviewSummary;
  upcomingEvents: VehicleOverviewEvent[];
};

const STATUS_PRIORITY: Record<MaintenanceEventStatus, number> = {
  overdue: 0,
  alert: 1,
  pending: 2,
};

const ALERT_PRIORITY: Record<VehicleOverviewEvent["alert"]["level"], number> = {
  red: 0,
  orange: 1,
  green: 2,
  neutral: 3,
};

function compareOptionalDistance(left: number | undefined, right: number | undefined): number {
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return left - right;
}

function getVehicleEventIds(vehicleId: string, events: MaintenanceEvent[]): Set<string> {
  return new Set(events.filter((event) => event.vehicleId === vehicleId).map((event) => event.id));
}

export function getLastVehicleEventKm(
  vehicleId: string,
  events: MaintenanceEvent[],
  executionHistory: MaintenanceExecution[],
  kmRecords: KmRecord[],
): number | undefined {
  const vehicleEventIds = getVehicleEventIds(vehicleId, events);
  const [lastExecution] = executionHistory
    .filter((execution) => vehicleEventIds.has(execution.vehicleEventId))
    .sort((left, right) => Date.parse(right.executionDate) - Date.parse(left.executionDate));

  if (lastExecution) {
    return lastExecution.executionKm;
  }

  const [lastKmRecord] = kmRecords
    .filter((record) => record.vehicleId === vehicleId)
    .sort((left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt));

  return lastKmRecord?.km;
}

export function buildVehicleOverview(input: {
  vehicle: Vehicle;
  maintenanceEvents: MaintenanceEvent[];
  executionHistory: MaintenanceExecution[];
  kmRecords: KmRecord[];
  now?: Date;
}): VehicleOverview {
  const now = input.now ?? new Date();
  const vehicleEvents = input.maintenanceEvents.filter(
    (event) => event.vehicleId === input.vehicle.id,
  );
  const overviewEvents = vehicleEvents.map<VehicleOverviewEvent>((event) => {
    const alert = getMaintenanceAlert(event, input.vehicle.currentKm, now);
    return {
      event,
      alert,
      status: getMaintenanceEventStatus(event, input.vehicle.currentKm, now),
    };
  });
  const upcomingEvents = [...overviewEvents].sort((left, right) => {
    const statusDiff = STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    const alertDiff = ALERT_PRIORITY[left.alert.level] - ALERT_PRIORITY[right.alert.level];
    if (alertDiff !== 0) {
      return alertDiff;
    }

    const kmDiff = compareOptionalDistance(left.alert.remainingKm, right.alert.remainingKm);
    if (kmDiff !== 0) {
      return kmDiff;
    }

    const dayDiff = compareOptionalDistance(left.alert.remainingDays, right.alert.remainingDays);
    if (dayDiff !== 0) {
      return dayDiff;
    }

    return left.event.name.localeCompare(right.event.name, "pt-BR");
  });

  return {
    vehicle: input.vehicle,
    modelDescription: [input.vehicle.model, String(input.vehicle.year)].filter(Boolean).join(" "),
    lastEventKm: getLastVehicleEventKm(
      input.vehicle.id,
      input.maintenanceEvents,
      input.executionHistory,
      input.kmRecords,
    ),
    summary: {
      totalEvents: vehicleEvents.length,
      alertEvents: overviewEvents.filter((item) => item.status === "alert").length,
      overdueEvents: overviewEvents.filter((item) => item.status === "overdue").length,
    },
    upcomingEvents,
  };
}
