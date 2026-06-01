import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  name: text("nome").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("senha_hash"),
  googleId: text("google_id"),
  photoUrl: text("foto_url"),
  createdAt: text("criado_em")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const carModels = sqliteTable("modelos_carro", {
  id: text("id").primaryKey(),
  brand: text("marca").notNull(),
  model: text("modelo").notNull(),
  startYear: integer("ano_inicio").notNull(),
  endYear: integer("ano_fim"),
});

export const vehicles = sqliteTable("carros", {
  id: text("id").primaryKey(),
  userId: text("usuario_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  modelId: text("modelo_id").references(() => carModels.id),
  plate: text("placa").notNull(),
  nickname: text("nome_apelido").notNull(),
  year: integer("ano").notNull(),
  currentKm: integer("km_atual").notNull().default(0),
  createdAt: text("criado_em")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const eventTypes = sqliteTable("tipos_evento", {
  id: text("id").primaryKey(),
  name: text("nome").notNull(),
  intervalKm: integer("intervalo_km"),
  intervalMonths: integer("intervalo_meses"),
  origin: text("origem", { enum: ["sistema", "usuario"] })
    .notNull()
    .default("sistema"),
});

export const vehicleEvents = sqliteTable("eventos_carro", {
  id: text("id").primaryKey(),
  vehicleId: text("carro_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  eventTypeId: text("tipo_evento_id")
    .notNull()
    .references(() => eventTypes.id),
  lastExecutionKm: integer("ultima_km_execucao"),
  lastExecutionDate: text("ultima_data_execucao"),
  nextKm: integer("proxima_km"),
  nextDate: text("proxima_data"),
});

export const kmRecords = sqliteTable("registros_km", {
  id: text("id").primaryKey(),
  vehicleId: text("carro_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  km: integer("km").notNull(),
  recordDate: text("data_registro").notNull(),
});

export const executionHistory = sqliteTable("historico_execucao", {
  id: text("id").primaryKey(),
  vehicleEventId: text("evento_carro_id")
    .notNull()
    .references(() => vehicleEvents.id, { onDelete: "cascade" }),
  executionKm: integer("km_execucao").notNull(),
  executionDate: text("data_execucao").notNull(),
  value: real("valor"),
  location: text("local"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DbVehicle = typeof vehicles.$inferSelect;
export type NewDbVehicle = typeof vehicles.$inferInsert;
