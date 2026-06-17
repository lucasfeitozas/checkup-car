import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { MaintenanceEvent, Vehicle } from "@/features/vehicles/stores/vehicleStore";
import {
  buildKmReminderNotificationBody,
  normalizeKmReminderPreference,
  type VehicleKmReminderPreference,
} from "@/features/vehicles/rules/kmReminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelVehicleKmReminder(notificationId: string | undefined) {
  if (!notificationId || Platform.OS === "web") {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function scheduleVehicleKmReminder(input: {
  vehicle: Vehicle;
  preference: VehicleKmReminderPreference;
  maintenanceEvents: MaintenanceEvent[];
}): Promise<string | undefined> {
  const preference = normalizeKmReminderPreference(input.preference);

  if (!preference.enabled || Platform.OS === "web") {
    await cancelVehicleKmReminder(preference.notificationId);
    return undefined;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error("Permissão de notificação não concedida.");
  }

  await cancelVehicleKmReminder(preference.notificationId);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Hora de atualizar a km",
      body: buildKmReminderNotificationBody(input.vehicle, input.maintenanceEvents),
      data: {
        vehicleId: input.vehicle.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: preference.hour,
      minute: preference.minute,
    },
  });
}
