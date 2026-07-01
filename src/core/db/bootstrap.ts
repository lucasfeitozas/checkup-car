import type * as SQLite from "expo-sqlite";

export type SystemEventTypeSeed = {
  id: string;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
};

export const SYSTEM_EVENT_TYPE_SEEDS: readonly SystemEventTypeSeed[] = [
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

function sqlValue(value: string | number | undefined): string {
  if (typeof value === "number") {
    return String(value);
  }

  if (value === undefined) {
    return "NULL";
  }

  return `'${value.replace(/'/g, "''")}'`;
}

const systemEventTypeSeedSql = SYSTEM_EVENT_TYPE_SEEDS.map(
  (type) =>
    `(${sqlValue(type.id)}, ${sqlValue(type.name)}, ${sqlValue(type.intervalKm)}, ${sqlValue(
      type.intervalMonths,
    )}, 'sistema')`,
).join(",\n");

export const DATABASE_BOOTSTRAP_SQL = `
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
  ano_fim INTEGER,
  UNIQUE (marca, modelo, ano_inicio)
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
  FOREIGN KEY (modelo_id) REFERENCES modelos_carro(id),
  UNIQUE (usuario_id, placa)
);

CREATE TABLE IF NOT EXISTS tipos_evento (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  intervalo_km INTEGER,
  intervalo_meses INTEGER,
  origem TEXT NOT NULL DEFAULT 'sistema' CHECK (origem IN ('sistema', 'usuario')),
  UNIQUE (nome, origem)
);

CREATE TABLE IF NOT EXISTS eventos_carro (
  id TEXT PRIMARY KEY NOT NULL,
  carro_id TEXT NOT NULL,
  tipo_evento_id TEXT NOT NULL,
  ultima_km_execucao INTEGER,
  ultima_data_execucao TEXT,
  proxima_km INTEGER,
  proxima_data TEXT,
  FOREIGN KEY (carro_id) REFERENCES carros(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_evento_id) REFERENCES tipos_evento(id)
);

CREATE TABLE IF NOT EXISTS registros_km (
  id TEXT PRIMARY KEY NOT NULL,
  carro_id TEXT NOT NULL,
  km INTEGER NOT NULL,
  data_registro TEXT NOT NULL,
  FOREIGN KEY (carro_id) REFERENCES carros(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historico_execucao (
  id TEXT PRIMARY KEY NOT NULL,
  evento_carro_id TEXT NOT NULL,
  km_execucao INTEGER NOT NULL,
  data_execucao TEXT NOT NULL,
  valor REAL,
  local TEXT,
  FOREIGN KEY (evento_carro_id) REFERENCES eventos_carro(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS carros_usuario_id_idx ON carros(usuario_id);
CREATE INDEX IF NOT EXISTS carros_modelo_id_idx ON carros(modelo_id);
CREATE UNIQUE INDEX IF NOT EXISTS carros_usuario_id_placa_unique ON carros(usuario_id, placa);
CREATE UNIQUE INDEX IF NOT EXISTS modelos_carro_marca_modelo_ano_inicio_unique
  ON modelos_carro(marca, modelo, ano_inicio);
CREATE UNIQUE INDEX IF NOT EXISTS tipos_evento_nome_origem_unique ON tipos_evento(nome, origem);
CREATE INDEX IF NOT EXISTS eventos_carro_carro_id_idx ON eventos_carro(carro_id);
CREATE INDEX IF NOT EXISTS eventos_carro_tipo_evento_id_idx ON eventos_carro(tipo_evento_id);
CREATE INDEX IF NOT EXISTS registros_km_carro_id_idx ON registros_km(carro_id);
CREATE INDEX IF NOT EXISTS registros_km_carro_id_data_registro_idx
  ON registros_km(carro_id, data_registro);
CREATE INDEX IF NOT EXISTS historico_execucao_evento_carro_id_idx
  ON historico_execucao(evento_carro_id);
CREATE INDEX IF NOT EXISTS historico_execucao_evento_carro_id_data_execucao_idx
  ON historico_execucao(evento_carro_id, data_execucao);

INSERT OR IGNORE INTO tipos_evento (id, nome, intervalo_km, intervalo_meses, origem)
VALUES
${systemEventTypeSeedSql};
`;

export function initializeLocalDatabase(database: SQLite.SQLiteDatabase): void {
  try {
    database.execSync(DATABASE_BOOTSTRAP_SQL);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    throw new Error(`Não foi possível inicializar o banco de dados local. ${message}`);
  }
}
