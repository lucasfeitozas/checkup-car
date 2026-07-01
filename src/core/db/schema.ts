import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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

export const carModels = sqliteTable(
  "modelos_carro",
  {
    id: text("id").primaryKey(),
    brand: text("marca").notNull(),
    model: text("modelo").notNull(),
    startYear: integer("ano_inicio").notNull(),
    endYear: integer("ano_fim"),
  },
  (table) => [
    uniqueIndex("modelos_carro_marca_modelo_ano_inicio_unique").on(
      table.brand,
      table.model,
      table.startYear,
    ),
  ],
);

export const vehicles = sqliteTable(
  "carros",
  {
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
  },
  (table) => [
    index("carros_usuario_id_idx").on(table.userId),
    index("carros_modelo_id_idx").on(table.modelId),
    uniqueIndex("carros_usuario_id_placa_unique").on(table.userId, table.plate),
  ],
);

export const eventTypes = sqliteTable(
  "tipos_evento",
  {
    id: text("id").primaryKey(),
    name: text("nome").notNull(),
    intervalKm: integer("intervalo_km"),
    intervalMonths: integer("intervalo_meses"),
    origin: text("origem", { enum: ["sistema", "usuario"] })
      .notNull()
      .default("sistema"),
  },
  (table) => [
    uniqueIndex("tipos_evento_nome_origem_unique").on(table.name, table.origin),
    check("tipos_evento_origem_check", sql`${table.origin} IN ('sistema', 'usuario')`),
  ],
);

export const vehicleEvents = sqliteTable(
  "eventos_carro",
  {
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
  },
  (table) => [
    index("eventos_carro_carro_id_idx").on(table.vehicleId),
    index("eventos_carro_tipo_evento_id_idx").on(table.eventTypeId),
  ],
);

export const kmRecords = sqliteTable(
  "registros_km",
  {
    id: text("id").primaryKey(),
    vehicleId: text("carro_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    km: integer("km").notNull(),
    recordDate: text("data_registro").notNull(),
  },
  (table) => [
    index("registros_km_carro_id_idx").on(table.vehicleId),
    index("registros_km_carro_id_data_registro_idx").on(table.vehicleId, table.recordDate),
  ],
);

export const executionHistory = sqliteTable(
  "historico_execucao",
  {
    id: text("id").primaryKey(),
    vehicleEventId: text("evento_carro_id")
      .notNull()
      .references(() => vehicleEvents.id, { onDelete: "cascade" }),
    executionKm: integer("km_execucao").notNull(),
    executionDate: text("data_execucao").notNull(),
    value: real("valor"),
    location: text("local"),
  },
  (table) => [
    index("historico_execucao_evento_carro_id_idx").on(table.vehicleEventId),
    index("historico_execucao_evento_carro_id_data_execucao_idx").on(
      table.vehicleEventId,
      table.executionDate,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CarModel = typeof carModels.$inferSelect;
export type NewCarModel = typeof carModels.$inferInsert;
export type DbVehicle = typeof vehicles.$inferSelect;
export type NewDbVehicle = typeof vehicles.$inferInsert;
export type EventType = typeof eventTypes.$inferSelect;
export type NewEventType = typeof eventTypes.$inferInsert;
export type VehicleEvent = typeof vehicleEvents.$inferSelect;
export type NewVehicleEvent = typeof vehicleEvents.$inferInsert;
export type DbKmRecord = typeof kmRecords.$inferSelect;
export type NewDbKmRecord = typeof kmRecords.$inferInsert;
export type DbExecutionHistory = typeof executionHistory.$inferSelect;
export type NewDbExecutionHistory = typeof executionHistory.$inferInsert;
