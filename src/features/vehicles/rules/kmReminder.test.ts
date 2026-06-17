import {
  buildKmReminderNotificationBody,
  getNotificationAlertItems,
  getTomorrowSkipUntil,
  hasKmRecordForToday,
  shouldRequestDailyKmUpdate,
  shouldRequestKmUpdate,
} from "@/features/vehicles/rules/kmReminder";
import type { KmRecord, MaintenanceEvent, Vehicle } from "@/features/vehicles/stores/vehicleStore";

describe("kmReminder", () => {
  const now = new Date("2026-06-06T12:00:00.000Z");

  it("requests update when there is no previous prompt", () => {
    expect(shouldRequestKmUpdate(undefined, "daily", now)).toBe(true);
  });

  it("respects daily frequency", () => {
    expect(shouldRequestKmUpdate("2026-06-05T11:59:00.000Z", "daily", now)).toBe(true);
    expect(shouldRequestKmUpdate("2026-06-05T12:01:00.000Z", "daily", now)).toBe(false);
  });

  it("respects weekly frequency", () => {
    expect(shouldRequestKmUpdate("2026-05-30T11:59:00.000Z", "weekly", now)).toBe(true);
    expect(shouldRequestKmUpdate("2026-05-30T12:01:00.000Z", "weekly", now)).toBe(false);
  });

  it("requests update when stored prompt date is invalid", () => {
    expect(shouldRequestKmUpdate("invalid-date", "weekly", now)).toBe(true);
  });

  it("detects km records made on the local day", () => {
    const records: KmRecord[] = [
      {
        id: "km-1",
        vehicleId: "v-1",
        km: 1000,
        recordedAt: "2026-06-06T09:00:00.000Z",
      },
    ];

    expect(hasKmRecordForToday("v-1", records, now)).toBe(true);
    expect(hasKmRecordForToday("v-2", records, now)).toBe(false);
  });

  it("requests daily km update only when enabled, not recorded today and not skipped", () => {
    const records: KmRecord[] = [];

    expect(
      shouldRequestDailyKmUpdate("v-1", records, { enabled: true, hour: 8, minute: 0 }, now),
    ).toBe(true);
    expect(
      shouldRequestDailyKmUpdate("v-1", records, { enabled: false, hour: 8, minute: 0 }, now),
    ).toBe(false);
    expect(
      shouldRequestDailyKmUpdate(
        "v-1",
        [
          {
            id: "km-1",
            vehicleId: "v-1",
            km: 1000,
            recordedAt: "2026-06-06T08:00:00.000Z",
          },
        ],
        { enabled: true, hour: 8, minute: 0 },
        now,
      ),
    ).toBe(false);
    expect(
      shouldRequestDailyKmUpdate(
        "v-1",
        records,
        { enabled: true, hour: 8, minute: 0, skipUntil: getTomorrowSkipUntil(now) },
        now,
      ),
    ).toBe(false);
  });

  it("builds notification body with orange and red maintenance alerts", () => {
    const vehicle: Vehicle = {
      id: "v-1",
      nickname: "Corolla",
      brand: "Toyota",
      model: "Corolla",
      year: 2022,
      plate: "ABC-1234",
      currentKm: 10000,
    };
    const events: MaintenanceEvent[] = [
      {
        id: "maintenance-red",
        vehicleId: "v-1",
        typeId: "custom",
        name: "Óleo",
        intervalKm: 10000,
        nextKm: 10000,
        createdAt: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "maintenance-orange",
        vehicleId: "v-1",
        typeId: "custom",
        name: "Freios",
        intervalKm: 10000,
        nextKm: 10150,
        createdAt: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "maintenance-green",
        vehicleId: "v-1",
        typeId: "custom",
        name: "Pneus",
        intervalKm: 10000,
        nextKm: 10400,
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    ];

    expect(getNotificationAlertItems(vehicle, events, now)).toEqual([
      { id: "maintenance-red", name: "Óleo", level: "red" },
      { id: "maintenance-orange", name: "Freios", level: "orange" },
    ]);
    expect(buildKmReminderNotificationBody(vehicle, events, now)).toContain(
      "Óleo (vermelho), Freios (laranja)",
    );
  });
});
