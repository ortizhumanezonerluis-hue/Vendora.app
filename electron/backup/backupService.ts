import path from 'path'
import fs from 'fs'
import { app, dialog } from 'electron'
import JSZip from 'jszip'
import Database from 'better-sqlite3'
import { getDatabase, getDatabasePath, closeDatabase, initDatabase } from '../db/database'

export interface BackupManifest {
  version: string
  app: string
  createdAt: string
  businessName: string
  totalProducts: number
  totalSales: number
  totalCustomers: number
}

export async function exportBackup(customPath?: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = getDatabase()
    const tempDir = path.join(app.getPath('temp'), 'vendora_backup_temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempDbPath = path.join(tempDir, `snapshot_${Date.now()}.sqlite`)

    // 1. Snapshot seguro y consistente con VACUUM INTO
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath)
    db.prepare(`VACUUM INTO ?`).run(tempDbPath)

    // 2. Obtener estadísticas para el manifiesto
    const tempDb = new Database(tempDbPath)
    const productsCount = (tempDb.prepare('SELECT COUNT(*) as c FROM productos').get() as any)?.c || 0
    const salesCount = (tempDb.prepare('SELECT COUNT(*) as c FROM ventas').get() as any)?.c || 0
    const customersCount = (tempDb.prepare('SELECT COUNT(*) as c FROM clientes').get() as any)?.c || 0
    const businessName = (tempDb.prepare('SELECT nombre FROM negocios LIMIT 1').get() as any)?.nombre || 'Mi Comercio'
    tempDb.close()

    const manifest: BackupManifest = {
      version: '1.0.0',
      app: 'Vendora POS Desktop',
      createdAt: new Date().toISOString(),
      businessName,
      totalProducts: productsCount,
      totalSales: salesCount,
      totalCustomers: customersCount
    }

    // 3. Empaquetar en ZIP
    const zip = new JSZip()
    const dbBuffer = fs.readFileSync(tempDbPath)
    zip.file('vendora.sqlite', dbBuffer)
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    const zipContent = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

    // Limpiar archivo temporal de snapshot
    try { fs.unlinkSync(tempDbPath) } catch (_) {}

    // 4. Si no se especificó ruta, abrir diálogo de guardado
    let savePath = customPath
    if (!savePath) {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = `${now.getHours()}_${now.getMinutes()}`
      const defaultFilename = `Respaldo_Vendora_${dateStr}_${timeStr}.zip`

      const result = await dialog.showSaveDialog({
        title: 'Exportar Copia de Seguridad de Vendora',
        defaultPath: defaultFilename,
        filters: [
          { name: 'Copia de Seguridad Vendora (*.zip)', extensions: ['zip'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Exportación cancelada por el usuario' }
      }
      savePath = result.filePath
    }

    fs.writeFileSync(savePath, zipContent)
    console.log(`[Backup] Respaldo exportado exitosamente en: ${savePath}`)
    return { success: true, filePath: savePath }
  } catch (err: any) {
    console.error('[Backup] Error exportando respaldo:', err)
    return { success: false, error: err.message || 'Error desconocido al exportar respaldo' }
  }
}

export async function restoreBackup(customSourcePath?: string): Promise<{ success: boolean; manifest?: BackupManifest; error?: string }> {
  try {
    let sourcePath = customSourcePath

    // 1. Si no se especificó archivo, abrir diálogo de selección
    if (!sourcePath) {
      const result = await dialog.showOpenDialog({
        title: 'Seleccionar Copia de Seguridad de Vendora',
        properties: ['openFile'],
        filters: [
          { name: 'Copia de Seguridad (*.zip, *.sqlite)', extensions: ['zip', 'sqlite'] }
        ]
      })

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, error: 'Restauración cancelada por el usuario' }
      }
      sourcePath = result.filePaths[0]
    }

    const tempDir = path.join(app.getPath('temp'), 'vendora_restore_temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempExtractedDb = path.join(tempDir, `restored_${Date.now()}.sqlite`)
    let manifest: BackupManifest | undefined

    if (sourcePath.endsWith('.zip')) {
      const zipData = fs.readFileSync(sourcePath)
      const zip = await JSZip.loadAsync(zipData)

      const dbFile = zip.file('vendora.sqlite')
      if (!dbFile) {
        return { success: false, error: 'El archivo ZIP no contiene una base de datos válida de Vendora (vendora.sqlite).' }
      }

      const manifestFile = zip.file('manifest.json')
      if (manifestFile) {
        try {
          const manifestText = await manifestFile.async('text')
          manifest = JSON.parse(manifestText)
        } catch (_) {}
      }

      const dbBuffer = await dbFile.async('nodebuffer')
      fs.writeFileSync(tempExtractedDb, dbBuffer)
    } else {
      // Es un archivo .sqlite directo
      fs.copyFileSync(sourcePath, tempExtractedDb)
    }

    // 2. Validar integridad de SQLite en el archivo temporal
    try {
      const checkDb = new Database(tempExtractedDb)
      const checkResult = checkDb.pragma('integrity_check') as Array<{ integrity_check: string }>
      checkDb.close()

      if (!checkResult || checkResult[0]?.integrity_check !== 'ok') {
        return { success: false, error: 'El archivo de respaldo está dañado o no es una base de datos SQLite válida.' }
      }
    } catch (err: any) {
      return { success: false, error: `Error validando base de datos: ${err.message}` }
    }

    // 3. Cerrar base de datos actual
    closeDatabase()

    // 4. Copia de seguridad preventiva de la base actual
    const realDbPath = getDatabasePath()
    if (fs.existsSync(realDbPath)) {
      const backupOldPath = `${realDbPath}.bak`
      try {
        fs.copyFileSync(realDbPath, backupOldPath)
      } catch (_) {}
    }

    // 5. Reemplazar archivo
    fs.copyFileSync(tempExtractedDb, realDbPath)

    // Eliminar temporales
    try { fs.unlinkSync(tempExtractedDb) } catch (_) {}

    // 6. Reabrir base de datos
    initDatabase()
    console.log('[Backup] Restauración completada exitosamente.')

    return { success: true, manifest }
  } catch (err: any) {
    console.error('[Backup] Error restaurando respaldo:', err)
    // Intentar reabrir DB para no dejar la app rota
    try { initDatabase() } catch (_) {}
    return { success: false, error: err.message || 'Error desconocido al restaurar respaldo' }
  }
}
