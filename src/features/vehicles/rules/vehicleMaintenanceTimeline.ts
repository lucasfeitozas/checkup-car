import type {
  MaintenanceEvent,
  MaintenanceExecution,
} from "@/features/vehicles/stores/vehicleStore";

export type VehicleMaintenanceTimelineFilter = {
  eventTypeId?: string;
  startDate?: string;
  endDate?: string;
};

export type VehicleMaintenanceTimelineItem = {
  execution: MaintenanceExecution;
  event: MaintenanceEvent;
};

export type VehicleMaintenanceTimelineGroup = {
  id: string;
  label: string;
  totalPaid: number;
  items: VehicleMaintenanceTimelineItem[];
};

export type VehicleMaintenanceTimeline = {
  totalPaid: number;
  groups: VehicleMaintenanceTimelineGroup[];
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(value: string): number {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function endOfUtcDay(value: string): number {
  return startOfUtcDay(value) + DAY_IN_MS - 1;
}

function getMonthGroupId(value: string): string {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthGroupLabel(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function isInsidePeriod(executionDate: string, filter: VehicleMaintenanceTimelineFilter): boolean {
  const executionTime = Date.parse(executionDate);

  if (filter.startDate && executionTime < startOfUtcDay(filter.startDate)) {
    return false;
  }

  if (filter.endDate && executionTime > endOfUtcDay(filter.endDate)) {
    return false;
  }

  return true;
}

export function buildVehicleMaintenanceTimeline(
  vehicleId: string,
  events: MaintenanceEvent[],
  executions: MaintenanceExecution[],
  filter: VehicleMaintenanceTimelineFilter = {},
): VehicleMaintenanceTimeline {
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const items = executions
    .map((execution) => {
      const event = eventsById.get(execution.vehicleEventId);
      return event ? { execution, event } : undefined;
    })
    .filter((item): item is VehicleMaintenanceTimelineItem => Boolean(item))
    .filter(({ event }) => event.vehicleId === vehicleId)
    .filter(({ event }) => !filter.eventTypeId || event.typeId === filter.eventTypeId)
    .filter(({ execution }) => isInsidePeriod(execution.executionDate, filter))
    .sort(
      (left, right) =>
        Date.parse(right.execution.executionDate) - Date.parse(left.execution.executionDate),
    );

  const groupsById = new Map<string, VehicleMaintenanceTimelineGroup>();

  for (const item of items) {
    const id = getMonthGroupId(item.execution.executionDate);
    const currentGroup = groupsById.get(id);
    const value = item.execution.value ?? 0;

    if (currentGroup) {
      currentGroup.items.push(item);
      currentGroup.totalPaid += value;
    } else {
      groupsById.set(id, {
        id,
        label: getMonthGroupLabel(item.execution.executionDate),
        totalPaid: value,
        items: [item],
      });
    }
  }

  const groups = [...groupsById.values()].sort((left, right) => right.id.localeCompare(left.id));
  const totalPaid = groups.reduce((total, group) => total + group.totalPaid, 0);

  return { totalPaid, groups };
}
