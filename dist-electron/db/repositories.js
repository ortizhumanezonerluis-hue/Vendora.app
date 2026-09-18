"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbRepositories = void 0;
const database_1 = require("./database");
const crypto_1 = __importDefault(require("crypto"));
function genId(prefix = '') {
    return `${prefix}${crypto_1.default.randomUUID()}`;
}
function ensureNegocioExists(db, negocioId, nombre) {
    const negId = negocioId || 'negocio-local-principal';
    try {
        db.prepare(`
      INSERT OR IGNORE INTO negocios (id, nombre, email_contacto, telefono, direccion)
      VALUES (?, ?, 'contacto@vendora.local', '0000000000', 'Local Principal')
    `).run(negId, nombre || 'Mi Comercio Local');
        db.prepare(`
      INSERT OR IGNORE INTO configuracion_negocio (id, negocio_id, moneda, impuesto_iva_defecto, habilitar_granel, unidad_medida_defecto, prefijo_factura, consecutivo_actual, tema, nombre_comercial)
      VALUES (?, ?, 'COP', 19, 1, 'kg', 'POS-', 1, 'light', ?)
    `).run(`config-${negId}`, negId, nombre || 'Mi Comercio Local');
    }
    catch (err) {
        console.warn('[Repositories] Error asegurando negocio:', err);
    }
    return negId;
}
function ensureUsuarioExists(db, usuarioId, negocioId, nombre) {
    const negId = ensureNegocioExists(db, negocioId);
    const usrId = usuarioId || 'usr-admin-principal';
    try {
        db.prepare(`
      INSERT OR IGNORE INTO usuarios (id, negocio_id, email, nombre, rol, pin_acceso, activo)
      VALUES (?, ?, ?, ?, 'admin', '1234', 1)
    `).run(usrId, negId, `${usrId}@vendora.local`, nombre || usrId);
    }
    catch (err) {
        console.warn('[Repositories] Error asegurando usuario:', err);
    }
    return usrId;
}
exports.dbRepositories = {
    // ===================== PRODUCTOS =====================
    getProductos(negocioId) {
        const db = (0, database_1.getDatabase)();
        const stmt = db.prepare('SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC');
        return stmt.all();
    },
    getProductoById(id) {
        const db = (0, database_1.getDatabase)();
        return db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    },
    getProductoByBarcode(barcode) {
        const db = (0, database_1.getDatabase)();
        return db.prepare('SELECT * FROM productos WHERE (codigo_barras = ? OR plu = ?) AND activo = 1 LIMIT 1').get(barcode, barcode);
    },
    saveProducto(prod) {
        const db = (0, database_1.getDatabase)();
        const id = prod.id || genId('prod-');
        const negocioId = ensureNegocioExists(db, prod.negocio_id);
        const stmt = db.prepare(`
      INSERT INTO productos (
        id, negocio_id, codigo_barras, plu, nombre, precio_costo, precio_venta,
        stock_actual, stock_minimo, categoria, es_granel, unidad_medida, iva_porcentaje, proveedor_id, imagen_url, activo
      ) VALUES (
        @id, @negocio_id, @codigo_barras, @plu, @nombre, @precio_costo, @precio_venta,
        @stock_actual, @stock_minimo, @categoria, @es_granel, @unidad_medida, @iva_porcentaje, @proveedor_id, @imagen_url, 1
      )
      ON CONFLICT(id) DO UPDATE SET
        codigo_barras = excluded.codigo_barras,
        plu = excluded.plu,
        nombre = excluded.nombre,
        precio_costo = excluded.precio_costo,
        precio_venta = excluded.precio_venta,
        stock_actual = excluded.stock_actual,
        stock_minimo = excluded.stock_minimo,
        categoria = excluded.categoria,
        es_granel = excluded.es_granel,
        unidad_medida = excluded.unidad_medida,
        iva_porcentaje = excluded.iva_porcentaje,
        proveedor_id = excluded.proveedor_id,
        imagen_url = excluded.imagen_url,
        actualizado_en = CURRENT_TIMESTAMP
    `);
        stmt.run({
            id,
            negocio_id: negocioId,
            codigo_barras: prod.codigo_barras || null,
            plu: prod.plu || null,
            nombre: prod.nombre,
            precio_costo: Number(prod.precio_costo) || 0,
            precio_venta: Number(prod.precio_venta) || 0,
            stock_actual: Number(prod.stock_actual) || 0,
            stock_minimo: Number(prod.stock_minimo) || 0,
            categoria: prod.categoria || 'General',
            es_granel: prod.es_granel ? 1 : 0,
            unidad_medida: prod.unidad_medida || 'UND',
            iva_porcentaje: Number(prod.iva_porcentaje) || 0,
            proveedor_id: prod.proveedor_id || null,
            imagen_url: prod.imagen_url || null
        });
        // Indexar en catálogo maestro local para aprendizaje inteligente offline
        if (prod.codigo_barras) {
            db.prepare(`
        INSERT OR REPLACE INTO catalogo_maestro_offline (barcode, name, category, default_iva, source)
        VALUES (?, ?, ?, ?, 'local_user')
      `).run(prod.codigo_barras, prod.nombre, prod.categoria || 'General', Number(prod.iva_porcentaje) || 19);
        }
        return db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    },
    deleteProducto(id) {
        const db = (0, database_1.getDatabase)();
        return db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id);
    },
    // ===================== BÚSQUEDA INTELIGENTE OFFLINE =====================
    smartLookupBarcodeOffline(barcode) {
        const db = (0, database_1.getDatabase)();
        const clean = barcode.trim();
        const match = db.prepare('SELECT * FROM catalogo_maestro_offline WHERE barcode = ?').get(clean);
        if (match) {
            return {
                barcode: match.barcode,
                name: match.name,
                brand: match.brand || '',
                category: match.category,
                default_iva: match.default_iva,
                image_url: match.image_url,
                source: match.source
            };
        }
        return null;
    },
    // ===================== VENTAS Y POS =====================
    registrarVenta(payload) {
        const db = (0, database_1.getDatabase)();
        const { venta, detalles } = payload;
        const ventaId = venta.id || genId('vta-');
        const negocioId = ensureNegocioExists(db, venta.negocio_id);
        const usuarioId = ensureUsuarioExists(db, venta.usuario_id, negocioId, venta.cajero);
        const executeCheckout = db.transaction(() => {
            // 1. Obtener consecutivo
            const config = db.prepare('SELECT prefijo_factura, consecutivo_actual FROM configuracion_negocio WHERE negocio_id = ?').get(negocioId);
            const consecutivoNum = (config?.consecutivo_actual || 1);
            const prefijo = config?.prefijo_factura || 'POS-';
            const consecutivoStr = `${prefijo}${String(consecutivoNum).padStart(6, '0')}`;
            // Incrementar consecutivo
            db.prepare('UPDATE configuracion_negocio SET consecutivo_actual = consecutivo_actual + 1 WHERE negocio_id = ?').run(negocioId);
            // 2. Insertar venta
            db.prepare(`
        INSERT INTO ventas (
          id, negocio_id, consecutivo, fecha, usuario_id, total, subtotal,
          iva_total, metodo_pago, monto_recibido, cambio, estado, cliente_id, cliente_nombre, notas
        ) VALUES (
          ?, ?, ?, datetime('now', 'localtime'), ?, ?, ?,
          ?, ?, ?, ?, 'completada', ?, ?, ?
        )
      `).run(ventaId, negocioId, consecutivoStr, usuarioId, Number(venta.total) || 0, Number(venta.subtotal) || 0, Number(venta.iva_total) || 0, venta.metodo_pago || 'efectivo', Number(venta.monto_recibido) || Number(venta.total) || 0, Number(venta.cambio) || 0, venta.cliente_id || null, venta.cliente_nombre || null, venta.notas || null);
            // 3. Insertar detalles y descontar stock
            const insertDetalle = db.prepare(`
        INSERT INTO detalle_ventas (
          id, venta_id, producto_id, producto_nombre, cantidad,
          precio_unitario, subtotal, iva_porcentaje, iva_monto, unidad_medida
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const updateStock = db.prepare(`
        UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?
      `);
            const insertMov = db.prepare(`
        INSERT INTO movimientos_inventario (
          id, negocio_id, producto_id, tipo, cantidad, motivo, usuario_id, fecha
        ) VALUES (?, ?, ?, 'venta', ?, ?, ?, datetime('now', 'localtime'))
      `);
            for (const item of detalles) {
                const detId = genId('det-');
                const qty = Number(item.cantidad) || 1;
                const price = Number(item.precio_unitario) || 0;
                const sub = Number(item.subtotal) || (qty * price);
                insertDetalle.run(detId, ventaId, item.producto_id, item.producto_nombre || 'Producto', qty, price, sub, Number(item.iva_porcentaje) || 0, Number(item.iva_monto) || 0, item.unidad_medida || 'UND');
                // Descontar stock
                updateStock.run(qty, item.producto_id);
                // Registrar movimiento de salida por venta
                insertMov.run(genId('mov-'), negocioId, item.producto_id, qty, `Venta #${consecutivoStr}`, usuarioId);
            }
            // 4. Actualizar total de ventas en el arqueo de caja abierto si existe (COMILLAS SIMPLES)
            const arqueoAbierto = db.prepare("SELECT id FROM arqueos_caja WHERE negocio_id = ? AND estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1").get(negocioId);
            if (arqueoAbierto) {
                if (venta.metodo_pago === 'efectivo') {
                    db.prepare('UPDATE arqueos_caja SET total_ventas_efectivo = total_ventas_efectivo + ? WHERE id = ?').run(Number(venta.total) || 0, arqueoAbierto.id);
                }
                else if (venta.metodo_pago === 'transferencia') {
                    db.prepare('UPDATE arqueos_caja SET total_ventas_transferencia = total_ventas_transferencia + ? WHERE id = ?').run(Number(venta.total) || 0, arqueoAbierto.id);
                }
                else if (venta.metodo_pago === 'tarjeta') {
                    db.prepare('UPDATE arqueos_caja SET total_ventas_tarjeta = total_ventas_tarjeta + ? WHERE id = ?').run(Number(venta.total) || 0, arqueoAbierto.id);
                }
            }
            return {
                id: ventaId,
                consecutivo: consecutivoStr,
                total: venta.total
            };
        });
        return executeCheckout();
    },
    getVentas(limit = 200, negocioId) {
        const db = (0, database_1.getDatabase)();
        let query = 'SELECT * FROM ventas';
        const params = [];
        if (negocioId) {
            query += ' WHERE negocio_id = ?';
            params.push(negocioId);
        }
        query += ' ORDER BY fecha DESC LIMIT ?';
        params.push(limit);
        const ventas = db.prepare(query).all(...params);
        const getDetalles = db.prepare(`
      SELECT dv.*, p.nombre as producto_nombre
      FROM detalle_ventas dv
      LEFT JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `);
        return ventas.map(v => {
            const rawDetalles = getDetalles.all(v.id);
            return {
                ...v,
                cajero: v.usuario_id,
                detalles_venta: rawDetalles.map(d => ({
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.subtotal,
                    productos: {
                        nombre: d.producto_nombre || d.producto_id,
                        precio_costo: 0
                    }
                }))
            };
        });
    },
    getDetallesVenta(ventaId) {
        const db = (0, database_1.getDatabase)();
        return db.prepare('SELECT * FROM detalle_ventas WHERE venta_id = ?').all(ventaId);
    },
    // ===================== ARQUEOS DE CAJA =====================
    getArqueoActivo(negocioId) {
        const db = (0, database_1.getDatabase)();
        if (negocioId) {
            return db.prepare("SELECT * FROM arqueos_caja WHERE negocio_id = ? AND estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1").get(negocioId);
        }
        return db.prepare("SELECT * FROM arqueos_caja WHERE estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1").get();
    },
    getHistorialArqueos(limit = 50, negocioId) {
        const db = (0, database_1.getDatabase)();
        if (negocioId) {
            return db.prepare('SELECT * FROM arqueos_caja WHERE negocio_id = ? ORDER BY fecha_apertura DESC LIMIT ?').all(negocioId, limit);
        }
        return db.prepare('SELECT * FROM arqueos_caja ORDER BY fecha_apertura DESC LIMIT ?').all(limit);
    },
    abrirCaja(payload) {
        const db = (0, database_1.getDatabase)();
        const id = genId('arq-');
        const negId = ensureNegocioExists(db, payload.negocio_id);
        const usrId = ensureUsuarioExists(db, payload.usuario_id, negId, payload.usuario_nombre);
        db.prepare(`
      INSERT INTO arqueos_caja (
        id, negocio_id, usuario_id, usuario_nombre, fecha_apertura, monto_inicial,
        total_ventas_efectivo, total_ventas_transferencia, total_ventas_tarjeta, estado
      ) VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?, 0, 0, 0, 'abierto')
    `).run(id, negId, usrId, payload.usuario_nombre, Number(payload.monto_inicial) || 0);
        return db.prepare('SELECT * FROM arqueos_caja WHERE id = ?').get(id);
    },
    cerrarCaja(payload) {
        const db = (0, database_1.getDatabase)();
        const arq = db.prepare('SELECT * FROM arqueos_caja WHERE id = ?').get(payload.id);
        if (!arq)
            throw new Error('Arqueo no encontrado');
        const efectivoSistema = Number(arq.monto_inicial) + Number(arq.total_ventas_efectivo) + Number(arq.total_entradas || 0) - Number(arq.total_salidas || 0);
        const declarado = Number(payload.efectivo_declarado) || 0;
        const diferencia = declarado - efectivoSistema;
        db.prepare(`
      UPDATE arqueos_caja SET
        fecha_cierre = datetime('now', 'localtime'),
        efectivo_declarado = ?,
        efectivo_sistema = ?,
        diferencia = ?,
        observaciones = ?,
        estado = 'cerrado'
      WHERE id = ?
    `).run(declarado, efectivoSistema, diferencia, payload.observaciones || null, payload.id);
        return db.prepare('SELECT * FROM arqueos_caja WHERE id = ?').get(payload.id);
    },
    // ===================== PROVEEDORES & REÓRDENES =====================
    getProveedores(negocioId) {
        const db = (0, database_1.getDatabase)();
        if (negocioId) {
            return db.prepare('SELECT * FROM proveedores WHERE negocio_id = ? ORDER BY nombre ASC').all(negocioId);
        }
        return db.prepare('SELECT * FROM proveedores ORDER BY nombre ASC').all();
    },
    saveProveedor(prov) {
        const db = (0, database_1.getDatabase)();
        const id = prov.id || genId('prov-');
        const negId = ensureNegocioExists(db, prov.negocio_id);
        db.prepare(`
      INSERT INTO proveedores (id, negocio_id, nombre, asesor, telefono, email, dias_visita, notas)
      VALUES (@id, @negocio_id, @nombre, @asesor, @telefono, @email, @dias_visita, @notas)
      ON CONFLICT(id) DO UPDATE SET
        nombre = excluded.nombre,
        asesor = excluded.asesor,
        telefono = excluded.telefono,
        email = excluded.email,
        dias_visita = excluded.dias_visita,
        notas = excluded.notas
    `).run({
            id,
            negocio_id: negId,
            nombre: prov.nombre,
            asesor: prov.asesor || null,
            telefono: prov.telefono || null,
            email: prov.email || null,
            dias_visita: prov.dias_visita || null,
            notas: prov.notas || null
        });
        return db.prepare('SELECT * FROM proveedores WHERE id = ?').get(id);
    },
    deleteProveedor(id) {
        const db = (0, database_1.getDatabase)();
        return db.prepare('DELETE FROM proveedores WHERE id = ?').run(id);
    },
    // ===================== AUDITORÍA FÍSICA =====================
    getSesionesAuditoria(negocioId) {
        const db = (0, database_1.getDatabase)();
        if (negocioId) {
            return db.prepare('SELECT * FROM sesiones_auditoria WHERE negocio_id = ? ORDER BY creado_en DESC').all(negocioId);
        }
        return db.prepare('SELECT * FROM sesiones_auditoria ORDER BY creado_en DESC').all();
    },
    createSesionAuditoria(sesion) {
        const db = (0, database_1.getDatabase)();
        const id = sesion.id || genId('aud-');
        const negId = ensureNegocioExists(db, sesion.negocio_id);
        db.prepare(`
      INSERT INTO sesiones_auditoria (
        id, negocio_id, nombre, responsable, alcance, filtro_valor, ocultar_teorico, estado, diferencia_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'en_proceso', 0)
    `).run(id, negId, sesion.nombre || 'Auditoría Física', sesion.responsable || 'Administrador', sesion.alcance || 'todo', sesion.filtro_valor || null, sesion.ocultar_teorico ? 1 : 0);
        return db.prepare('SELECT * FROM sesiones_auditoria WHERE id = ?').get(id);
    },
    saveDetallesAuditoria(sesionId, items) {
        const db = (0, database_1.getDatabase)();
        const insertDet = db.prepare(`
      INSERT OR REPLACE INTO detalles_sesion_auditoria (
        id, sesion_id, producto_id, stock_sistema, cantidad_contada, diferencia, costo_unitario, diferencia_dinero
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const tx = db.transaction(() => {
            for (const item of items) {
                const detId = item.id || genId('adet-');
                const sist = Number(item.stock_sistema) || 0;
                const cont = Number(item.cantidad_contada) || 0;
                const diff = cont - sist;
                const cost = Number(item.costo_unitario) || 0;
                const diffDinero = diff * cost;
                insertDet.run(detId, sesionId, item.producto_id, sist, cont, diff, cost, diffDinero);
            }
        });
        tx();
        return true;
    },
    getDetallesAuditoria(sesionId) {
        const db = (0, database_1.getDatabase)();
        return db.prepare(`
      SELECT d.*, p.nombre as producto_nombre, p.codigo_barras as sku
      FROM detalles_sesion_auditoria d
      JOIN productos p ON d.producto_id = p.id
      WHERE d.sesion_id = ?
    `).all(sesionId);
    },
    // ===================== CLIENTES =====================
    getClientes(negocioId) {
        const db = (0, database_1.getDatabase)();
        if (negocioId) {
            return db.prepare('SELECT * FROM clientes WHERE negocio_id = ? ORDER BY nombre ASC').all(negocioId);
        }
        return db.prepare('SELECT * FROM clientes ORDER BY nombre ASC').all();
    },
    saveCliente(cliente) {
        const db = (0, database_1.getDatabase)();
        const id = cliente.id || genId('cli-');
        const negId = ensureNegocioExists(db, cliente.negocio_id);
        db.prepare(`
      INSERT INTO clientes (id, negocio_id, nombre, documento, telefono, email, direccion, puntos, notas)
      VALUES (@id, @negocio_id, @nombre, @documento, @telefono, @email, @direccion, @puntos, @notas)
      ON CONFLICT(id) DO UPDATE SET
        nombre = excluded.nombre,
        documento = excluded.documento,
        telefono = excluded.telefono,
        email = excluded.email,
        direccion = excluded.direccion,
        puntos = excluded.puntos,
        notas = excluded.notas
    `).run({
            id,
            negocio_id: negId,
            nombre: cliente.nombre,
            documento: cliente.documento || null,
            telefono: cliente.telefono || null,
            email: cliente.email || null,
            direccion: cliente.direccion || null,
            puntos: Number(cliente.puntos) || 0,
            notas: cliente.notas || null
        });
        return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    },
    // ===================== CONFIGURACIÓN & NEGOCIO =====================
    getConfiguracion(negocioId) {
        const db = (0, database_1.getDatabase)();
        const negId = ensureNegocioExists(db, negocioId);
        return db.prepare('SELECT * FROM configuracion_negocio WHERE negocio_id = ?').get(negId);
    },
    saveConfiguracion(cfg) {
        const db = (0, database_1.getDatabase)();
        const negId = ensureNegocioExists(db, cfg.negocio_id);
        db.prepare(`
      UPDATE configuracion_negocio SET
        moneda = @moneda,
        impuesto_iva_defecto = @impuesto_iva_defecto,
        habilitar_granel = @habilitar_granel,
        unidad_medida_defecto = @unidad_medida_defecto,
        prefijo_factura = @prefijo_factura,
        nombre_comercial = @nombre_comercial,
        nit_rut = @nit_rut,
        impresora_nombre = @impresora_nombre
      WHERE negocio_id = @negocio_id
    `).run({
            negocio_id: negId,
            moneda: cfg.moneda || 'COP',
            impuesto_iva_defecto: Number(cfg.impuesto_iva_defecto) || 19,
            habilitar_granel: cfg.habilitar_granel ? 1 : 0,
            unidad_medida_defecto: cfg.unidad_medida_defecto || 'kg',
            prefijo_factura: cfg.prefijo_factura || 'POS-',
            nombre_comercial: cfg.nombre_comercial || null,
            nit_rut: cfg.nit_rut || null,
            impresora_nombre: cfg.impresora_nombre || null
        });
        return db.prepare('SELECT * FROM configuracion_negocio WHERE negocio_id = ?').get(negId);
    }
};
