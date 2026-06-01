import { createContext, useContext, type PropsWithChildren } from "react";
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import * as schema from "@/db/schema";

// No ambiente Web, o SharedArrayBuffer é necessário para o wa-sqlite.
// Se não estiver disponível, o SQLite.openDatabaseSync falhará.
const sqlite =
  Platform.OS === "web" && typeof SharedArrayBuffer === "undefined"
    ? null
    : SQLite.openDatabaseSync("checkup-car.db", {
        enableChangeListener: true,
      });

export const db = sqlite ? drizzle(sqlite, { schema }) : null;

type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

const DatabaseContext = createContext<AppDatabase | null>(null);

export function DatabaseProvider({ children }: PropsWithChildren) {
  if (!db) {
    // Você pode retornar um fallback amigável aqui se o DB não carregar na Web
    return <>{children}</>;
  }
  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const database = useContext(DatabaseContext);

  if (!database) {
    throw new Error("useDatabase must be used inside DatabaseProvider");
  }

  return database;
}
