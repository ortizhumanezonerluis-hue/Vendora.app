import { Request, Response } from 'express';
import { DianSoapService, DianInvoiceData } from '../services/dianSoapService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const dianService = new DianSoapService();

export const dianController = {
  /**
   * Recibe la petición de procesamiento fiscal asíncrona de Render.
   * Realiza la llamada simulada al WS de la DIAN y actualiza el estado en Supabase.
   */
  async procesarFactura(req: Request, res: Response) {
    const { comprobanteId, items, credenciales } = req.body;

    if (!comprobanteId) {
      res.status(400).json({ error: 'Falta el id del comprobante' });
      return;
    }

    // 1. Obtener datos del comprobante desde la BD
    const { data: comprobante, error: selectErr } = await supabase
      .from('comprobantes_venta')
      .select('*')
      .eq('id', comprobanteId)
      .single();

    if (selectErr || !comprobante) {
      res.status(404).json({ error: 'Comprobante no encontrado en base de datos' });
      return;
    }

    // Responder inmediatamente para mitigar cualquier bloqueo en la cadena de llamadas
    res.status(202).json({ message: 'Procesamiento fiscal iniciado asíncronamente en Render' });

    // 2. Procesar con la DIAN en segundo plano (asíncronamente)
    (async () => {
      try {
        const payload: DianInvoiceData = {
          invoiceId: comprobante.id,
          tenantId: comprobante.tenant_id,
          clienteNombre: comprobante.cliente_nombre,
          clienteDocumento: comprobante.cliente_documento,
          clienteTipoDoc: comprobante.cliente_tipo_doc,
          total: Number(comprobante.total),
          items: items || [],
          credenciales: {
            idSoftware: credenciales.id_software,
            pinSoftware: credenciales.pin_software,
            urlDian: credenciales.url_dian,
            ambiente: credenciales.ambiente
          }
        };

        const response = await dianService.enviarFacturaDian(payload);

        if (response.exitoso) {
          // Guardar estado Exitoso y los adjuntos
          await supabase
            .from('comprobantes_venta')
            .update({
              estado_fiscal: 'Exitoso',
              xml_url: response.xmlUrl,
              pdf_url: response.pdfUrl,
              mensaje_error: response.mensaje
            })
            .eq('id', comprobanteId);
        } else {
          // Guardar estado Rechazado y el log de error
          await supabase
            .from('comprobantes_venta')
            .update({
              estado_fiscal: 'Rechazado',
              mensaje_error: response.mensaje
            })
            .eq('id', comprobanteId);
        }
      } catch (err: any) {
        console.error('Error procesando comprobante:', err);
        await supabase
          .from('comprobantes_venta')
          .update({
            estado_fiscal: 'Rechazado',
            mensaje_error: err?.message || 'Error desconocido del backend Render'
          })
          .eq('id', comprobanteId);
      }
    })();
  }
};
