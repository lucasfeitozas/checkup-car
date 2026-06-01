import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import * as schema from "@/db/schema";

const LOCAL_USER_ID = "local-user";
const LOCAL_USER_EMAIL = "local@checkup.car";

let sqliteDbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

async function initSqliteDb(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT,
      google_id TEXT,
      foto_url TEXT,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modelos_carro (
      id TEXT PRIMARY KEY NOT NULL,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      ano_inicio INTEGER NOT NULL,
      ano_fim INTEGER
    );

    CREATE TABLE IF NOT EXISTS carros (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      modelo_id TEXT,
      placa TEXT NOT NULL,
      nome_apelido TEXT NOT NULL,
      ano INTEGER NOT NULL,
      km_atual INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (modelo_id) REFERENCES modelos_carro(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS carros_usuario_placa_unique
      ON carros (usuario_id, placa);

    INSERT OR IGNORE INTO usuarios (id, nome, email)
      VALUES ('${LOCAL_USER_ID}', 'Usuário local', '${LOCAL_USER_EMAIL}');
  `);
}

export async function getSqliteDb() {
  if (sqliteDbPromise) {
    return await sqliteDbPromise;
  }

  sqliteDbPromise = (async () => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
      if (typeof SharedArrayBuffer === "undefined") return null;
    }

    const database = await SQLite.openDatabaseAsync("checkup-car.db");
    await initSqliteDb(database);
    return database;
  })();

  return await sqliteDbPromise;
}

type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

const DatabaseContext = createContext<AppDatabase | null>(null);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [database, setDatabase] = useState<AppDatabase | null>(null);

  useEffect(() => {
    void (async () => {
      const sqliteDb = await getSqliteDb();
      if (!sqliteDb) return;
      setDatabase(drizzle(sqliteDb, { schema }));
    })();
  }, []);

  if (!database) {
    return <>{children}</>;
  }

  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const database = useContext(DatabaseContext);

  if (!database) {
    throw new Error("useDatabase must be used inside DatabaseProvider");
  }

  return database;
}
