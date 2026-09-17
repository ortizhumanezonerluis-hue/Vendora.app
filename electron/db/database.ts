import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { SCHEMA_DDL } from './schema'
import { SEED_CATALOG_DATA } from './seedCatalog'

let dbInstance: Database.Database | null = null

export function getDatabasePath(): string {
  const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), '.vendora-data')
  const dbDir = path.join(userDataDir, 'database')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  return path.join(dbDir, 'vendora.sqlite')
}

export function initDatabase(): Database.Database {
  if (dbInstance) return dbInstance

  const dbPath = getDatabasePath()
  console.log(`[Database] Inicializando base de datos SQLite en: ${dbPath}`)

  const db = new Database(dbPath)

  // Activación de modo WAL para concurrencia y máxima velocidad
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  // Ejecutar esquema DDL
  db.exec(SCHEMA_DDL)

  // Seed inicial del catálogo maestro offline si está vacío
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM catalogo_maestro_offline')
  const result = countStmt.get() as { count: number }

  if (result.count === 0) {
    console.log('[Database] Precargando catálogo maestro offline con productos comunes...')
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO catalogo_maestro_offline (barcode, name, brand, category, default_iva, source)
      VALUES (@barcode, @name, @brand, @category, @default_iva, 'offline_seed')
    `)

    const insertMany = db.transaction((products) => {
      for (const prod of products) {
        insertStmt.run(prod)
      }
    })

    insertMany(SEED_CATALOG_DATA)
    console.log(`[Database] ${SEED_CATALOG_DATA.length} productos indexados en el catálogo local.`)
  }

  // Si no existe ningún negocio, crear negocio y usuario por defecto
  const negStmt = db.prepare('SELECT COUNT(*) as count FROM negocios')
  const negCount = (negStmt.get() as { count: number }).count
  if (negCount === 0) {
    const defaultNegocioId = 'negocio-local-principal'
    db.prepare(`
      INSERT INTO negocios (id, nombre, email_contacto, telefono, direccion)
      VALUES (?, 'Mi Comercio Local', 'contacto@comercio.local', '3000000000', 'Local Principal')
    `).run(defaultNegocioId)

    db.prepare(`
      INSERT INTO configuracion_negocio (id, negocio_id, moneda, impuesto_iva_defecto, habilitar_granel, unidad_medida_defecto, prefijo_factura, consecutivo_actual, tema, nombre_comercial)
      VALUES (?, ?, 'COP', 19, 1, 'kg', 'POS-', 1, 'light', 'Mi Comercio Local')
    `).run('config-local-principal', defaultNegocioId)

    db.prepare(`
      INSERT INTO usuarios (id, negocio_id, email, nombre, rol, pin_acceso, activo)
      VALUES (?, ?, 'admin@vendora.local', 'Administrador', 'admin', '1234', 1)
    `).run('usr-admin-principal', defaultNegocioId)
  }

  dbInstance = db
  return db
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    return initDatabase()
  }
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close()
      console.log('[Database] Conexión SQLite cerrada con éxito.')
    } catch (err) {
      console.error('[Database] Error al cerrar conexión SQLite:', err)
    }
    dbInstance = null
  }
}
