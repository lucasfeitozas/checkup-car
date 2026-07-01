import {
  DATABASE_BOOTSTRAP_SQL,
  initializeLocalDatabase,
  SYSTEM_EVENT_TYPE_SEEDS,
} from "./bootstrap";

describe("database bootstrap", () => {
  it("declares every entity from the database model", () => {
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS usuarios");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS modelos_carro");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS carros");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS tipos_evento");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS eventos_carro");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS registros_km");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CREATE TABLE IF NOT EXISTS historico_execucao");
  });

  it("keeps local data integrity with foreign keys, cascade deletes and unique constraints", () => {
    expect(DATABASE_BOOTSTRAP_SQL).toContain("PRAGMA foreign_keys = ON");
    expect(DATABASE_BOOTSTRAP_SQL).toContain(
      "FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE",
    );
    expect(DATABASE_BOOTSTRAP_SQL).toContain(
      "FOREIGN KEY (carro_id) REFERENCES carros(id) ON DELETE CASCADE",
    );
    expect(DATABASE_BOOTSTRAP_SQL).toContain(
      "FOREIGN KEY (evento_carro_id) REFERENCES eventos_carro(id) ON DELETE CASCADE",
    );
    expect(DATABASE_BOOTSTRAP_SQL).toContain("UNIQUE (usuario_id, placa)");
    expect(DATABASE_BOOTSTRAP_SQL).toContain("CHECK (origem IN ('sistema', 'usuario'))");
  });

  it("seeds system event types used by maintenance rules", () => {
    expect(SYSTEM_EVENT_TYPE_SEEDS).toHaveLength(11);

    for (const type of SYSTEM_EVENT_TYPE_SEEDS) {
      expect(DATABASE_BOOTSTRAP_SQL).toContain(`'${type.id}'`);
      expect(DATABASE_BOOTSTRAP_SQL).toContain(`'${type.name}'`);
    }
  });

  it("executes the bootstrap SQL and wraps SQLite failures", () => {
    const execSync = jest.fn();

    initializeLocalDatabase({ execSync } as never);

    expect(execSync).toHaveBeenCalledWith(DATABASE_BOOTSTRAP_SQL);

    execSync.mockImplementationOnce(() => {
      throw new Error("disk is full");
    });

    expect(() => initializeLocalDatabase({ execSync } as never)).toThrow(
      /Não foi possível inicializar o banco de dados local. disk is full/,
    );
  });
});
