export type MaintenanceEventTypeId =
  | "air-filter"
  | "oil-filter"
  | "spark-plugs"
  | "ignition-cables"
  | "wiper-blades"
  | "brake-check"
  | "brake-fluid"
  | "suspension"
  | "timing-belt"
  | "coolant"
  | "alignment-balancing"
  | "custom";

export type MaintenanceEventType = {
  id: MaintenanceEventTypeId;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
};

export type MaintenanceSchedule = {
  nextKm?: number;
  nextDate?: string;
};

export type MaintenanceDateValidationResult =
  | { isValid: true; date: Date }
  | { isValid: false; message: string };

const SYSTEM_MAINTENANCE_EVENT_TYPES: MaintenanceEventType[] = [
  { id: "alignment-balancing", name: "Alinhamento e balanceamento", intervalKm: 10000 },
  { id: "ignition-cables", name: "Cabos de ignição", intervalKm: 50000, intervalMonths: 36 },
  { id: "timing-belt", name: "Correia dentada", intervalKm: 15000 },
  { id: "air-filter", name: "Filtro de ar", intervalKm: 20000 },
  { id: "oil-filter", name: "Filtro de óleo" },
  { id: "brake-fluid", name: "Fluido de freio", intervalKm: 10000, intervalMonths: 12 },
  { id: "wiper-blades", name: "Limpador de para-brisa", intervalMonths: 12 },
  { id: "coolant", name: "Líquido de arrefecimento", intervalKm: 30000, intervalMonths: 12 },
  { id: "brake-check", name: "Revisão de freios", intervalKm: 15000 },
  { id: "suspension", name: "Suspensão", intervalKm: 40000 },
  { id: "spark-plugs", name: "Velas de ignição", intervalKm: 10000 },
];

export const CUSTOM_MAINTENANCE_EVENT_TYPE: MaintenanceEventType = {
  id: "custom",
  name: "Outro",
};

export const MAINTENANCE_EVENT_TYPES: MaintenanceEventType[] = [
  ...SYSTEM_MAINTENANCE_EVENT_TYPES,
  CUSTOM_MAINTENANCE_EVENT_TYPE,
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export function getMaintenanceEventType(
  typeId: MaintenanceEventTypeId,
): MaintenanceEventType | undefined {
  return MAINTENANCE_EVENT_TYPES.find((type) => type.id === typeId);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const originalDay = next.getDate();

  next.setMonth(next.getMonth() + months);

  if (next.getDate() < originalDay) {
    next.setDate(0);
  }

  return next;
}

export function calculateMaintenanceSchedule(
  typeId: MaintenanceEventTypeId,
  currentKm: number,
  baseDate: Date = new Date(),
): MaintenanceSchedule {
  const type = getMaintenanceEventType(typeId);
  if (!type || type.id === "custom") {
    return {};
  }

  return {
    nextKm:
      type.intervalKm !== undefined && Number.isFinite(currentKm)
        ? currentKm + type.intervalKm
        : undefined,
    nextDate:
      type.intervalMonths !== undefined
        ? addMonths(baseDate, type.intervalMonths).toISOString()
        : undefined,
  };
}

export function maskBrazilianDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

export function formatBrazilianDateInput(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function validateBrazilianFutureDateInput(
  value: string,
  today: Date = new Date(),
): MaintenanceDateValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, message: "Informe a data limite." };
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    return { isValid: false, message: "Informe a data no formato DD/MM/AAAA." };
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { isValid: false, message: "Informe uma data limite válida." };
  }

  if (startOfUtcDay(parsed).getTime() < startOfUtcDay(today).getTime()) {
    return { isValid: false, message: "Data limite não pode ser anterior à data atual." };
  }

  return { isValid: true, date: parsed };
}
