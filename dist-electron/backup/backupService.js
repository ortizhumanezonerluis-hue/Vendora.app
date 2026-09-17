"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportBackup = exportBackup;
exports.restoreBackup = restoreBackup;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const jszip_1 = __importDefault(require("jszip"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const database_1 = require("../db/database");
async function exportBackup(customPath) {
    try {
        const db = (0, database_1.getDatabase)();
        const tempDir = path_1.default.join(electron_1.app.getPath('temp'), 'vendora_backup_temp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        const tempDbPath = path_1.default.join(tempDir, `snapshot_${Date.now()}.sqlite`);
        // 1. Snapshot seguro y consistente con VACUUM INTO
        if (fs_1.default.existsSync(tempDbPath))
            fs_1.default.unlinkSync(tempDbPath);
        db.prepare(`VACUUM INTO ?`).run(tempDbPath);
        // 2. Obtener estadísticas para el manifiesto
        const tempDb = new better_sqlite3_1.default(tempDbPath);
        const productsCount = tempDb.prepare('SELECT COUNT(*) as c FROM productos').get()?.c || 0;
        const salesCount = tempDb.prepare('SELECT COUNT(*) as c FROM ventas').get()?.c || 0;
        const customersCount = tempDb.prepare('SELECT COUNT(*) as c FROM clientes').get()?.c || 0;
        const businessName = tempDb.prepare('SELECT nombre FROM negocios LIMIT 1').get()?.nombre || 'Mi Comercio';
        tempDb.close();
        const manifest = {
            version: '1.0.0',
            app: 'Vendora POS Desktop',
            createdAt: new Date().toISOString(),
            businessName,
            totalProducts: productsCount,
            totalSales: salesCount,
            totalCustomers: customersCount
        };
        // 3. Empaquetar en ZIP
        const zip = new jszip_1.default();
        const dbBuffer = fs_1.default.readFileSync(tempDbPath);
        zip.file('vendora.sqlite', dbBuffer);
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
        const zipContent = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
        // Limpiar archivo temporal de snapshot
        try {
            fs_1.default.unlinkSync(tempDbPath);
        }
        catch (_) { }
        // 4. Si no se especificó ruta, abrir diálogo de guardado
        let savePath = customPath;
        if (!savePath) {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const timeStr = `${now.getHours()}_${now.getMinutes()}`;
            const defaultFilename = `Respaldo_Vendora_${dateStr}_${timeStr}.zip`;
            const result = await electron_1.dialog.showSaveDialog({
                title: 'Exportar Copia de Seguridad de Vendora',
                defaultPath: defaultFilename,
                filters: [
                    { name: 'Copia de Seguridad Vendora (*.zip)', extensions: ['zip'] }
                ]
            });
            if (result.canceled || !result.filePath) {
                return { success: false, error: 'Exportación cancelada por el usuario' };
            }
            savePath = result.filePath;
        }
        fs_1.default.writeFileSync(savePath, zipContent);
        console.log(`[Backup] Respaldo exportado exitosamente en: ${savePath}`);
        return { success: true, filePath: savePath };
    }
    catch (err) {
        console.error('[Backup] Error exportando respaldo:', err);
        return { success: false, error: err.message || 'Error desconocido al exportar respaldo' };
    }
}
async function restoreBackup(customSourcePath) {
    try {
        let sourcePath = customSourcePath;
        // 1. Si no se especificó archivo, abrir diálogo de selección
        if (!sourcePath) {
            const result = await electron_1.dialog.showOpenDialog({
                title: 'Seleccionar Copia de Seguridad de Vendora',
                properties: ['openFile'],
                filters: [
                    { name: 'Copia de Seguridad (*.zip, *.sqlite)', extensions: ['zip', 'sqlite'] }
                ]
            });
            if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                return { success: false, error: 'Restauración cancelada por el usuario' };
            }
            sourcePath = result.filePaths[0];
        }
        const tempDir = path_1.default.join(electron_1.app.getPath('temp'), 'vendora_restore_temp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        const tempExtractedDb = path_1.default.join(tempDir, `restored_${Date.now()}.sqlite`);
        let manifest;
        if (sourcePath.endsWith('.zip')) {
            const zipData = fs_1.default.readFileSync(sourcePath);
            const zip = await jszip_1.default.loadAsync(zipData);
            const dbFile = zip.file('vendora.sqlite');
            if (!dbFile) {
                return { success: false, error: 'El archivo ZIP no contiene una base de datos válida de Vendora (vendora.sqlite).' };
            }
            const manifestFile = zip.file('manifest.json');
            if (manifestFile) {
                try {
                    const manifestText = await manifestFile.async('text');
                    manifest = JSON.parse(manifestText);
                }
                catch (_) { }
            }
            const dbBuffer = await dbFile.async('nodebuffer');
            fs_1.default.writeFileSync(tempExtractedDb, dbBuffer);
        }
        else {
            // Es un archivo .sqlite directo
            fs_1.default.copyFileSync(sourcePath, tempExtractedDb);
        }
        // 2. Validar integridad de SQLite en el archivo temporal
        try {
            const checkDb = new better_sqlite3_1.default(tempExtractedDb);
            const checkResult = checkDb.pragma('integrity_check');
            checkDb.close();
            if (!checkResult || checkResult[0]?.integrity_check !== 'ok') {
                return { success: false, error: 'El archivo de respaldo está dañado o no es una base de datos SQLite válida.' };
            }
        }
        catch (err) {
            return { success: false, error: `Error validando base de datos: ${err.message}` };
        }
        // 3. Cerrar base de datos actual
        (0, database_1.closeDatabase)();
        // 4. Copia de seguridad preventiva de la base actual
        const realDbPath = (0, database_1.getDatabasePath)();
        if (fs_1.default.existsSync(realDbPath)) {
            const backupOldPath = `${realDbPath}.bak`;
            try {
                fs_1.default.copyFileSync(realDbPath, backupOldPath);
            }
            catch (_) { }
        }
        // 5. Reemplazar archivo
        fs_1.default.copyFileSync(tempExtractedDb, realDbPath);
        // Eliminar temporales
        try {
            fs_1.default.unlinkSync(tempExtractedDb);
        }
        catch (_) { }
        // 6. Reabrir base de datos
        (0, database_1.initDatabase)();
        console.log('[Backup] Restauración completada exitosamente.');
        return { success: true, manifest };
    }
    catch (err) {
        console.error('[Backup] Error restaurando respaldo:', err);
        // Intentar reabrir DB para no dejar la app rota
        try {
            (0, database_1.initDatabase)();
        }
        catch (_) { }
        return { success: false, error: err.message || 'Error desconocido al restaurar respaldo' };
    }
}
