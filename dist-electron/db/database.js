"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabasePath = getDatabasePath;
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const schema_1 = require("./schema");
const seedCatalog_1 = require("./seedCatalog");
let dbInstance = null;
function getDatabasePath() {
    const userDataDir = electron_1.app ? electron_1.app.getPath('userData') : path_1.default.join(process.cwd(), '.vendora-data');
    const dbDir = path_1.default.join(userDataDir, 'database');
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    return path_1.default.join(dbDir, 'vendora.sqlite');
}
function initDatabase() {
    if (dbInstance)
        return dbInstance;
    const dbPath = getDatabasePath();
    console.log(`[Database] Inicializando base de datos SQLite en: ${dbPath}`);
    const db = new better_sqlite3_1.default(dbPath);
    // Activación de modo WAL para concurrencia y máxima velocidad
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    // Ejecutar esquema DDL
    db.exec(schema_1.SCHEMA_DDL);
    // Seed inicial del catálogo maestro offline si está vacío
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM catalogo_maestro_offline');
    const result = countStmt.get();
    if (result.count === 0) {
        console.log('[Database] Precargando catálogo maestro offline con productos comunes...');
        const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO catalogo_maestro_offline (barcode, name, brand, category, default_iva, source)
      VALUES (@barcode, @name, @brand, @category, @default_iva, 'offline_seed')
    `);
        const insertMany = db.transaction((products) => {
            for (const prod of products) {
                insertStmt.run(prod);
            }
        });
        insertMany(seedCatalog_1.SEED_CATALOG_DATA);
        console.log(`[Database] ${seedCatalog_1.SEED_CATALOG_DATA.length} productos indexados en el catálogo local.`);
    }
    // Si no existe ningún negocio, crear negocio y usuario por defecto
    const negStmt = db.prepare('SELECT COUNT(*) as count FROM negocios');
    const negCount = negStmt.get().count;
    if (negCount === 0) {
        const defaultNegocioId = 'negocio-local-principal';
        db.prepare(`
      INSERT INTO negocios (id, nombre, email_contacto, telefono, direccion)
      VALUES (?, 'Mi Comercio Local', 'contacto@comercio.local', '3000000000', 'Local Principal')
    `).run(defaultNegocioId);
        db.prepare(`
      INSERT INTO configuracion_negocio (id, negocio_id, moneda, impuesto_iva_defecto, habilitar_granel, unidad_medida_defecto, prefijo_factura, consecutivo_actual, tema, nombre_comercial)
      VALUES (?, ?, 'COP', 19, 1, 'kg', 'POS-', 1, 'light', 'Mi Comercio Local')
    `).run('config-local-principal', defaultNegocioId);
        db.prepare(`
      INSERT INTO usuarios (id, negocio_id, email, nombre, rol, pin_acceso, activo)
      VALUES (?, ?, 'admin@vendora.local', 'Administrador', 'admin', '1234', 1)
    `).run('usr-admin-principal', defaultNegocioId);
    }
    dbInstance = db;
    return db;
}
function getDatabase() {
    if (!dbInstance) {
        return initDatabase();
    }
    return dbInstance;
}
function closeDatabase() {
    if (dbInstance) {
        try {
            dbInstance.close();
            console.log('[Database] Conexión SQLite cerrada con éxito.');
        }
        catch (err) {
            console.error('[Database] Error al cerrar conexión SQLite:', err);
        }
        dbInstance = null;
    }
}
