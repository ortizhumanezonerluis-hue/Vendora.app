// Supabase Edge Function: dian-billing/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const renderBackendUrl = Deno.env.get("RENDER_BACKEND_URL") ?? "https://vendora-dian-backend.onrender.com";

    // Header de Autorización JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Falta token de autorización" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Obtener usuario de la sesión actual
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolviendo Negocio (Tenant) ID
    const tenantId = user.user_metadata?.negocio_id || req.headers.get("x-negocio-id");
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "Falta id del negocio (tenant_id)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validar si el tenant tiene configuradas sus credenciales DIAN
    const { data: creds, error: credsErr } = await supabase
      .from("configuracion_dian")
      .select("*")
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle();

    if (credsErr) {
      return new Response(JSON.stringify({ error: "Error consultando configuración DIAN" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Si faltan credenciales, retornar HTTP 428 Precondition Required para levantar el Modal
    if (!creds) {
      return new Response(JSON.stringify({ error: "Falta configurar credenciales de la DIAN" }), {
        status: 428,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Procesar venta del request
    const body = await req.json();
    const { clienteNombre, clienteDocumento, clienteTipoDoc, total, items } = body;

    // Registro inicial en base de datos con estado 'Pendiente'
    const { data: comprobante, error: insertErr } = await supabase
      .from("comprobantes_venta")
      .insert([{
        tenant_id: tenantId,
        cliente_nombre: clienteNombre || "Consumidor Final",
        cliente_documento: clienteDocumento || "222222222222",
        cliente_tipo_doc: clienteTipoDoc || "13", // 13 = Cédula de Ciudadanía
        total: total || 0,
        estado_fiscal: "Pendiente",
      }])
      .select()
      .single();

    if (insertErr || !comprobante) {
      return new Response(JSON.stringify({ error: "Error registrando comprobante local" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Invocar backend en Render de manera asíncrona (Background Fire-and-forget)
    // No usamos 'await' para la respuesta final del procesamiento DIAN, evitando bloquear la respuesta al POS
    fetch(`${renderBackendUrl}/api/dian/procesar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comprobanteId: comprobante.id,
        items,
        credenciales: {
          id_software: creds.id_software,
          pin_software: creds.pin_software,
          url_dian: creds.url_dian,
          ambiente: creds.ambiente
        }
      })
    }).catch(err => console.error("Error disparando Render background check (posible suspensión/cold start):", err));

    // Retornamos 202 Accepted de inmediato al Frontend
    return new Response(JSON.stringify({
      message: "Venta guardada y enviada a cola fiscal de la DIAN",
      comprobanteId: comprobante.id,
      estado_fiscal: "Pendiente"
    }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
