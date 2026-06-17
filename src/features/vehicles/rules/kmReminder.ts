import type { KmRecord, MaintenanceEvent, Vehicle } from "@/features/vehicles/stores/vehicleStore";
import {
  getMaintenanceAlert,
  type MaintenanceAlertLevel,
} from "@/features/vehicles/rules/maintenanceEventList";

export type KmPromptFrequency = "daily" | "weekly";

export type VehicleKmReminderPreference = {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId?: string;
  skipUntil?: string;
};

export type MaintenanceNotificationItem = {
  id: string;
  name: string;
  level: Extract<MaintenanceAlertLevel, "orange" | "red">;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_KM_REMINDER_PREFERENCE: VehicleKmReminderPreference = {
  enabled: true,
  hour: 8,
  minute: 0,
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return startOfLocalDay(left).getTime() === startOfLocalDay(right).getTime();
}

function getTomorrowStart(now: Date): Date {
  const tomorrow = startOfLocalDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function getTomorrowSkipUntil(now: Date = new Date()): string {
  return getTomorrowStart(now).toISOString();
}

export function normalizeKmReminderPreference(
  preference: Partial<VehicleKmReminderPreference> | undefined,
): VehicleKmReminderPreference {
  const hour =
    preference?.hour !== undefined && Number.isInteger(preference.hour)
      ? preference.hour
      : DEFAULT_KM_REMINDER_PREFERENCE.hour;
  const minute =
    preference?.minute !== undefined && Number.isInteger(preference.minute)
      ? preference.minute
      : DEFAULT_KM_REMINDER_PREFERENCE.minute;

  return {
    enabled: preference?.enabled ?? DEFAULT_KM_REMINDER_PREFERENCE.enabled,
    hour: Math.min(Math.max(hour ?? DEFAULT_KM_REMINDER_PREFERENCE.hour, 0), 23),
    minute: Math.min(Math.max(minute ?? DEFAULT_KM_REMINDER_PREFERENCE.minute, 0), 59),
    notificationId: preference?.notificationId,
    skipUntil: preference?.skipUntil,
  };
}

export function hasKmRecordForToday(
  vehicleId: string,
  records: KmRecord[],
  now: Date = new Date(),
): boolean {
  return records.some((record) => {
    if (record.vehicleId !== vehicleId) {
      return false;
    }

    const recordedAt = new Date(record.recordedAt);
    return !Number.isNaN(recordedAt.getTime()) && isSameLocalDay(recordedAt, now);
  });
}

export function shouldRequestDailyKmUpdate(
  vehicleId: string,
  records: KmRecord[],
  preference: VehicleKmReminderPreference | undefined,
  now: Date = new Date(),
): boolean {
  const normalizedPreference = normalizeKmReminderPreference(preference);
  if (!normalizedPreference.enabled) {
    return false;
  }

  if (hasKmRecordForToday(vehicleId, records, now)) {
    return false;
  }

  if (normalizedPreference.skipUntil) {
    const skipUntil = Date.parse(normalizedPreference.skipUntil);
    if (!Number.isNaN(skipUntil) && skipUntil > now.getTime()) {
      return false;
    }
  }

  return true;
}

function compareNotificationItem(
  left: MaintenanceNotificationItem,
  right: MaintenanceNotificationItem,
): number {
  if (left.level !== right.level) {
    return left.level === "red" ? -1 : 1;
  }

  return left.name.localeCompare(right.name, "pt-BR");
}

export function getNotificationAlertItems(
  vehicle: Vehicle,
  events: MaintenanceEvent[],
  now: Date = new Date(),
): MaintenanceNotificationItem[] {
  return events
    .filter((event) => event.vehicleId === vehicle.id)
    .map((event) => ({
      id: event.id,
      name: event.name,
      level: getMaintenanceAlert(event, vehicle.currentKm, now).level,
    }))
    .filter(
      (event): event is MaintenanceNotificationItem =>
        event.level === "orange" || event.level === "red",
    )
    .sort(compareNotificationItem);
}

export function buildKmReminderNotificationBody(
  vehicle: Vehicle,
  events: MaintenanceEvent[],
  now: Date = new Date(),
): string {
  const alertItems = getNotificationAlertItems(vehicle, events, now);
  if (alertItems.length === 0) {
    return `Informe a km atual do ${vehicle.nickname}. Nenhuma manutenção urgente no momento.`;
  }

  const listedEvents = alertItems
    .slice(0, 3)
    .map((event) => `${event.name} (${event.level === "red" ? "vermelho" : "laranja"})`)
    .join(", ");
  const remainingCount = alertItems.length - 3;

  return `Informe a km atual do ${vehicle.nickname}. Alertas: ${listedEvents}${
    remainingCount > 0 ? ` e mais ${remainingCount}` : ""
  }.`;
}

export function shouldRequestKmUpdate(
  lastPromptAt: string | undefined,
  frequency: KmPromptFrequency,
  now: Date = new Date(),
): boolean {
  if (!lastPromptAt) {
    return true;
  }

  const lastPromptTime = Date.parse(lastPromptAt);
  if (Number.isNaN(lastPromptTime)) {
    return true;
  }

  const interval = frequency === "daily" ? DAY_IN_MS : 7 * DAY_IN_MS;
  return now.getTime() - lastPromptTime >= interval;
}
