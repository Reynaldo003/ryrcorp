import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const API_URL      = "https://crm.grupoautomotrizryr.com";
const API_WHATSAPP = "https://graph.facebook.com/v25.0";

const ACCESS_TOKEN    = 'EAAMHhf6nlX8BRsem3YmFgR7wKIEGwZByRLbsZApyZC3TMvgKfr4ARDcWNqeX5BUIcL699ZBQ1ayAk4NQzRvDIa7Ec3FjFZA51rSfodI96FoCWlHR2RypxcbOeseSUovfBtvmDqTs6DiU3hk1gyJnW9XLjuaF3te6UqH0M4ZBAhkxe8wzCBwk0ZCw0FcizAgnfDyilN3ZCeHqTMBhb7XKWkZAJhKTVZCNCKg1IUjEJj';
const PHONE_NUMBER_ID = '1184628394729057';
const WABA_ID         = '990790696655589';

const POR_PAGINA = 15;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getStoredToken = () => {
  try {
    const access = localStorage.getItem("auth.access");
    if (access && access !== "undefined" && access !== "null") return access;
    const rawAuth = localStorage.getItem("auth");
    if (!rawAuth) return null;
    const parsed = JSON.parse(rawAuth);
    const token = parsed?.token;
    if (token && token !== "undefined" && token !== "null") return token;
    return null;
  } catch { return null; }
};

const getAuthHeader = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// FETCH ENCUESTAS (paginado)
// ─────────────────────────────────────────────────────────────────────────────
const fetchAllPages = async (baseUrl) => {
  let url = baseUrl;
  let all = [];
  while (url) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) { all = [...all, ...data]; break; }
    all = [...all, ...(data.results || [])];
    url = data.next || null;
  }
  return all;
};

const listarEncuestas = async () => {
  const [satisfaccion, servicio] = await Promise.all([
    fetchAllPages(`${API_URL}/api/encuestas/satisfaccion/`),
    fetchAllPages(`${API_URL}/api/encuestas/servicio/`),
  ]);
  const todas = [
    ...satisfaccion.map(r => ({ ...r, _tipo: 'satisfaccion' })),
    ...servicio.map(r => ({ ...r, _tipo: 'servicio' })),
  ];
  todas.sort((a, b) => new Date(b.creado) - new Date(a.creado));
  return todas;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGS EN BACKEND
// ─────────────────────────────────────────────────────────────────────────────
const guardarLogEnBackend = async (nombre, telefono, asesor, plantilla, estado, errorMsg = '') => {
  try {
    await fetch(`${API_URL}/api/whatsapp/logs/`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nombre:   nombre,
        cliente_telefono: telefono,
        asesor:           asesor || '',
        plantilla,
        estado,
        error_mensaje:    errorMsg,
      }),
    });
  } catch (err) {
    console.warn('No se pudo guardar log en backend:', err.message);
  }
};

const cargarLogsDesdeBackend = async () => {
  try {
    const res = await fetch(`${API_URL}/api/whatsapp/logs/`, {
      credentials: 'include',
      headers: getAuthHeader(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data.results || []).map(l => ({
      name:         l.cliente_nombre,
      phone:        l.cliente_telefono,
      advisor:      l.asesor,
      templateName: l.plantilla,
      status:       l.estado,
      errorMsg:     l.error_mensaje,
      time:         new Date(l.creado).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      fromDB:       true,
    }));
  } catch { return []; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBIR IMAGEN A META
// ─────────────────────────────────────────────────────────────────────────────
const uploadImageToMeta = async (imageUrl) => {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error('No se pudo descargar la imagen');
  const blob = await imgRes.blob();
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', blob.type || 'image/jpeg');
  form.append('file', blob, 'encuesta.jpg');
  const res = await fetch(`${API_WHATSAPP}/${PHONE_NUMBER_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    body: form,
  });
  const data = await res.json();
  if (!data.id) throw new Error(data.error?.message || 'Error al subir imagen');
  return data.id;
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLAS POR DEFECTO
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES = [
  {
    id: 'pisito',
    nombre: 'Pisito',
    descripcion: 'Plantilla de servicio activa en Meta',
    icono: '🏠',
    color: '#001e50',
    template: 'pisito',
    langExact: 'en',
    motivo: 'Evaluación de experiencia en agencia',
    tipo: 'encuesta',
    mensaje: 'Se envía al cliente después de su visita para calificar la atención recibida.',
    hasImage: false,
    imageUrl: null,
    flowId: '1331381228411307',
    flowButtonIndex: '0',
  },
  {
    id: 'enc_piso',
    nombre: 'enc_piso',
    descripcion: 'Plantilla de servicio activa en Meta',
    icono: '🏠',
    color: '#001e50',
    template: 'enc_piso',
    langExact: 'en',
    motivo: 'Evaluación de experiencia en agencia',
    tipo: 'encuesta',
    mensaje: 'Se envía al cliente después de su visita para calificar la atención recibida.',
    hasImage: true,
    imageUrl: 'https://i.imgur.com/wKJqh2K.jpeg',
    flowId: '1331381228411307',
    flowButtonIndex: '0',
  },

  {
    id: 'satisfacion',
    nombre: 'satisfacion',
    descripcion: 'Plantilla de Marketing activa en Meta',
    icono: '🏠',
    color: '#9d174d',
    template: 'satisfacion',
    langExact: 'en',
    motivo: 'Evaluación de experiencia en agencia',
    tipo: 'marketing',
    mensaje: 'Se envía al cliente después de su visita para calificar la atención recibida.',
    hasImage: false,
    imageUrl: null,
    flowId: null,
    flowButtonIndex: '0',
  },
];

const TIPO_BADGE = {
  encuesta:     { bg: '#eff6ff', color: '#1d4ed8', label: 'Encuesta' },
  seguimiento:  { bg: '#ecfdf5', color: '#065f46', label: 'Seguimiento' },
  notificacion: { bg: '#f5f3ff', color: '#5b21b6', label: 'Notificación' },
  recordatorio: { bg: '#fffbeb', color: '#92400e', label: 'Recordatorio' },
  marketing:    { bg: '#fdf2f8', color: '#9d174d', label: 'Marketing' },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const EncuestasWhats = () => {

  // ── Plantillas ────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('vw_templates');
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch { return DEFAULT_TEMPLATES; }
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    try {
      const saved = localStorage.getItem('vw_templates');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
      return parsed[0]?.id || DEFAULT_TEMPLATES[0].id;
    } catch { return DEFAULT_TEMPLATES[0].id; }
  });

  // ── UI ────────────────────────────────────────────────────────────────────
  const [formData,   setFormData]   = useState({ clientName: '', countryCode: '52', phoneNumber: '', advisor: '' });
  const [logs,       setLogs]       = useState([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [responses,  setResponses]  = useState([]);
  const [syncStatus, setSyncStatus] = useState(false);
  const [activeTab,  setActiveTab]  = useState('responses');
  const [alert,      setAlert]      = useState({ show: false, type: '', message: '' });
  const [isSending,  setIsSending]  = useState(false);
  const [deletedIds, setDeletedIds] = useState(new Set());

  // ── Filtros del panel ─────────────────────────────────────────────────────
  const [filtroTexto,   setFiltroTexto]   = useState('');
  const [filtroTipo,    setFiltroTipo]    = useState('todos');
  const [filtroAgencia, setFiltroAgencia] = useState('');
  const [filtroAsesor,  setFiltroAsesor]  = useState('');
  const [pagina,        setPagina]        = useState(1);

  // ── Editor de plantillas ──────────────────────────────────────────────────
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate,    setEditingTemplate]    = useState(null);
  const [templateDraft,      setTemplateDraft]      = useState(null);

  const lastJsonRef     = useRef('');
  const lastLogsJsonRef = useRef('');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // ── Cargar logs al montar ─────────────────────────────────────────────────
  useEffect(() => {
    cargarLogsDesdeBackend().then(logsDB => {
      setLogs(logsDB);
      setLogsLoaded(true);
      lastLogsJsonRef.current = JSON.stringify(logsDB);
    });
  }, []);

  // ── Sync respuestas ───────────────────────────────────────────────────────
  const getItemKey = (r) => String(r.id_encuesta || r.id || JSON.stringify(r).slice(0, 60));

  const cargarRespuestas = useCallback(async () => {
    try {
      const lista = await listarEncuestas();
      setSyncStatus(true);
      const filtered = lista.filter(r => !deletedIds.has(getItemKey(r)));
      const newJson = JSON.stringify(filtered);
      if (lastJsonRef.current === newJson) return;
      lastJsonRef.current = newJson;
      setResponses(filtered);
    } catch { setSyncStatus(false); }
  }, [deletedIds]);

  const sincronizarLogs = useCallback(async () => {
    if (!logsLoaded) return;
    const logsDB = await cargarLogsDesdeBackend();
    const newJson = JSON.stringify(logsDB);
    if (lastLogsJsonRef.current === newJson) return;
    lastLogsJsonRef.current = newJson;
    setLogs(logsDB);
  }, [logsLoaded]);

  useEffect(() => {
    cargarRespuestas();
    const interval = setInterval(cargarRespuestas, 3000);
    return () => clearInterval(interval);
  }, [cargarRespuestas]);

  useEffect(() => {
    if (!logsLoaded) return;
    const interval = setInterval(sincronizarLogs, 10000);
    return () => clearInterval(interval);
  }, [sincronizarLogs, logsLoaded]);

  // ── Reset página al cambiar filtros ───────────────────────────────────────
  useEffect(() => { setPagina(1); }, [filtroTexto, filtroTipo, filtroAgencia, filtroAsesor, activeTab]);

  // ── Listas únicas para dropdowns ──────────────────────────────────────────
  const agenciasUnicas = [...new Set(responses.map(r => r.agencia).filter(Boolean))].sort();
  const asesoresUnicos = [...new Set(responses.map(r => r.asesor_atendio).filter(Boolean))].sort();

  // ── Filtrado de respuestas ────────────────────────────────────────────────
  const responsesFiltradas = responses.filter(r => {
    if (filtroTipo !== 'todos' && r._tipo !== filtroTipo) return false;
    if (filtroAgencia && r.agencia !== filtroAgencia) return false;
    if (filtroAsesor && r.asesor_atendio !== filtroAsesor) return false;
    if (filtroTexto) {
      const q = filtroTexto.toLowerCase();
      const nombre = (r.nombre_cliente || r.nombre_OS_cliente || '').toLowerCase();
      const asesor = (r.asesor_atendio || '').toLowerCase();
      const agencia = (r.agencia || '').toLowerCase();
      const id = String(r.id_encuesta || r.id || '').toLowerCase();
      if (!nombre.includes(q) && !asesor.includes(q) && !agencia.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  const totalPaginas  = Math.ceil(responsesFiltradas.length / POR_PAGINA);
  const responsesPagina = responsesFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // ── Contadores ────────────────────────────────────────────────────────────
  const okCount       = logs.filter(l => l.status === 'ok').length;
  const errCount      = logs.filter(l => l.status === 'err').length;
  const numServicio   = responses.filter(r => r._tipo === 'servicio').length;
  const numSatisf     = responses.filter(r => r._tipo === 'satisfaccion').length;

  // ── Utilidades ────────────────────────────────────────────────────────────
  const showAlertMsg = (type, message) => {
    setAlert({ show: true, type, message });
    if (type === 'ok') setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const saveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem('vw_templates', JSON.stringify(newTemplates));
  };

  const addLog = async (name, phone, advisor, status, templateName, errorMsg = '') => {
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ name, phone, advisor, time: now, status, templateName, errorMsg }, ...prev]);
    await guardarLogEnBackend(name, phone, advisor, templateName, status, errorMsg);
  };

  const renderStars = (val, max = 5) => {
    const n = Math.min(Math.max(parseInt(val) || 0, 0), max);
    return Array.from({ length: max }, (_, i) => (
      <span key={i} style={{ color: i < n ? '#f59e0b' : '#d1d5db', fontSize: '14px', lineHeight: '1' }}>
        {i < n ? '★' : '☆'}
      </span>
    ));
  };

  const scoreColor = (val) => {
    const n = parseInt(val) || 0;
    if (n >= 4) return 'high';
    if (n >= 2) return 'mid';
    return n > 0 ? 'low' : '';
  };

  const deleteCard = (key) => setDeletedIds(prev => new Set([...prev, key]));

  // ── Enviar encuesta ───────────────────────────────────────────────────────
  const sendSurvey = async () => {
    setAlert({ show: false, type: '', message: '' });
    const { clientName, countryCode, phoneNumber, advisor } = formData;

    if (!clientName)  { showAlertMsg('err', '❌ Ingresa el nombre del cliente.'); return; }
    if (!phoneNumber) { showAlertMsg('err', '❌ Ingresa el número de WhatsApp.'); return; }
    if (!selectedTemplate?.template) { showAlertMsg('err', '❌ La plantilla seleccionada no tiene un ID válido.'); return; }

    const fullPhone = countryCode + phoneNumber.replace(/\D/g, '');
    setIsSending(true);

    try {
      let components = [];

      if (selectedTemplate.flowId) {
        components.push({
          type: 'button',
          sub_type: 'flow',
          index: String(selectedTemplate.flowButtonIndex || '0'),
          parameters: [{ type: 'action', action: { flow_token: `survey_${fullPhone}_${Date.now()}` } }],
        });
      }

      if (selectedTemplate.hasImage && selectedTemplate.imageUrl) {
        try {
          const mediaId = await uploadImageToMeta(selectedTemplate.imageUrl);
          components.push({ type: 'header', parameters: [{ type: 'image', image: { id: mediaId } }] });
        } catch (imgErr) {
          console.warn('No se pudo subir imagen:', imgErr.message);
          await addLog(clientName, fullPhone, advisor, 'warning', selectedTemplate.nombre, 'Imagen no cargada');
        }
      }

      const body = {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                fullPhone,
        type:              'template',
        template: {
          name:     selectedTemplate.template,
          language: { code: selectedTemplate.langExact },
        },
      };
      if (components.length > 0) body.template.components = components;

      const res  = await fetch(`${API_WHATSAPP}/${PHONE_NUMBER_ID}/messages`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.messages) {
        showAlertMsg('ok', `✅ "${selectedTemplate.nombre}" enviada a ${clientName} (+${fullPhone})`);
        await addLog(clientName, fullPhone, advisor, 'ok', selectedTemplate.nombre);
        setFormData({ ...formData, clientName: '', phoneNumber: '', advisor: '' });
      } else {
        const errMsg  = data.error?.message || 'Error desconocido';
        const errCode = data.error?.code    || '';
        let userMessage = errMsg;
        if (errCode === 132001 || errMsg.includes('template') || errMsg.includes('does not exist'))
          userMessage = `⚠️ Plantilla "${selectedTemplate.template}" no encontrada. Verifica el nombre en Meta Business.`;
        else if (errCode === 132000 || errMsg.includes('language'))
          userMessage = `⚠️ Código de idioma incorrecto: "${selectedTemplate.langExact}".`;
        else if (errCode === 100)
          userMessage = '⚠️ Parámetros incorrectos. Verifica Phone Number ID y Token.';
        showAlertMsg('err', `❌ ${userMessage}`);
        await addLog(clientName, fullPhone, advisor, 'err', selectedTemplate.nombre, errMsg);
      }
    } catch (err) {
      showAlertMsg('err', `❌ Error de conexión: ${err.message}`);
      await addLog(clientName, fullPhone, advisor, 'err', selectedTemplate.nombre, err.message);
    }
    setIsSending(false);
  };

  // ── Editor plantillas ─────────────────────────────────────────────────────
  const openEditor = (template) => {
    setTemplateDraft({ ...template });
    setEditingTemplate(template.id);
    setShowTemplateEditor(true);
  };

  const openNewTemplate = () => {
    setTemplateDraft({
      id: `plantilla_${Date.now()}`, nombre: '', descripcion: '', icono: '📋',
      color: '#001e50', template: '', langExact: 'en',
      motivo: '', tipo: 'encuesta', mensaje: '', hasImage: false,
      imageUrl: '', flowId: null, flowButtonIndex: '0',
    });
    setEditingTemplate('new');
    setShowTemplateEditor(true);
  };

  const saveTemplate = () => {
    if (!templateDraft.nombre || !templateDraft.template) {
      showAlertMsg('err', 'El nombre y el ID de plantilla son obligatorios.');
      return;
    }
    const updated = editingTemplate === 'new'
      ? [...templates, templateDraft]
      : templates.map(t => t.id === editingTemplate ? templateDraft : t);
    saveTemplates(updated);
    setShowTemplateEditor(false);
    setEditingTemplate(null);
    showAlertMsg('ok', 'Plantilla guardada ✓');
  };

  const deleteTemplate = (id) => {
    if (templates.length <= 1) { showAlertMsg('err', 'Debe haber al menos una plantilla.'); return; }
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);
    if (selectedTemplateId === id) setSelectedTemplateId(updated[0].id);
  };

  // ── Estilos ───────────────────────────────────────────────────────────────
  const dotStyle = {
    high: { background: 'rgba(34,197,94,.25)',  borderColor: 'rgba(34,197,94,.4)',   color: '#86efac' },
    mid:  { background: 'rgba(234,179,8,.2)',   borderColor: 'rgba(234,179,8,.35)',  color: '#fde047' },
    low:  { background: 'rgba(239,68,68,.2)',   borderColor: 'rgba(239,68,68,.35)',  color: '#fca5a5' },
    '':   { background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.15)',color: 'white'  },
  };

  const cardStyle = {
    background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb',
    overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,30,80,.06)',
  };
  const cardHeaderStyle = {
    padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', gap: '10px',
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280',
    marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.08em',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: '9px', fontSize: '14px', color: '#111827', background: '#f8fafd',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const inputSmStyle = { ...inputStyle, fontSize: '12px', fontFamily: 'monospace' };

  const filterSelectStyle = {
    padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '9px',
    fontSize: '12px', color: '#374151', background: '#f8fafd',
    outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
  };

  // ── ResponseCard ──────────────────────────────────────────────────────────
  const ResponseCard = ({ response }) => {
    const [isOpen, setIsOpen] = useState(false);
    const key = getItemKey(response);
    const fecha = response.creado
      ? new Date(response.creado).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '—';

    if (response._tipo === 'satisfaccion') {
      const scores = [
        { label: 'Atención asesor',   icon: '⭐', val: response.atencion_asesor },
        { label: 'Seguimiento',       icon: '🔁', val: response.seguimiento_asesor },
        { label: 'Tiempo de entrega', icon: '⏱️', val: response.tiempo_entrega_unidad },
        { label: 'Recepción',         icon: '🏢', val: response.experiencia_recepcion },
      ];
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: 'white' }}>
          <div onClick={() => setIsOpen(!isOpen)}
            style={{ background: '#001e50', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', cursor: 'pointer' }}>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '11px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▼</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 500, color: 'white', minWidth: 0 }}>
              👤 {response.nombre_cliente || '(sin nombre)'}
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,.35)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {response.agencia || ''}{response.asesor_atendio ? ` · ${response.asesor_atendio}` : ''}
              </span>
            </div>
            <span style={{ fontSize: '8px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: 'rgba(0,176,240,.25)', color: '#7dd3fc', fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', flexShrink: 0 }}>
              SATISFACCIÓN
            </span>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
              {scores.map((s, idx) => {
                const cls = scoreColor(s.val);
                const sty = dotStyle[cls] || dotStyle[''];
                return (
                  <div key={idx} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, ...sty }} title={`${s.label}: ${s.val ?? '—'}`}>
                    {s.val ?? '?'}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fecha}</div>
            <button onClick={(e) => { e.stopPropagation(); deleteCard(key); }} title="Ocultar"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: 'rgba(248,113,113,.7)', cursor: 'pointer', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
              ✕
            </button>
          </div>
          {isOpen && (
            <div style={{ padding: '14px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#4b5563' }}>
                <strong>Motivo de visita:</strong> {response.motivo_visita || '—'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                {scores.map((s, idx) => (
                  <div key={idx} style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '9px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.icon} {s.label}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600, color: '#111827', lineHeight: 1 }}>{s.val != null ? s.val : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '3px' }}>{renderStars(s.val)}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderLeft: '4px solid #00b0f0', borderRadius: '9px', padding: '10px 14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>📝 Comentarios</div>
                <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.55' }}>
                  {response.comentario?.trim()
                    ? <p style={{ margin: 0 }}>{response.comentario}</p>
                    : <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>Sin comentarios</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Servicio
    const scores = [
      { label: 'Atención asesor',  icon: '⭐', val: response.satisfaccion_atencion_asesor },
      { label: 'Calidad / precio', icon: '💰', val: response.percepcion_calidad_precio },
      { label: 'Servicio RYR',     icon: '🔧', val: response.satisfaccion_servicio_ryr },
    ];
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: 'white' }}>
        <div onClick={() => setIsOpen(!isOpen)}
          style={{ background: '#0f2d1f', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', cursor: 'pointer' }}>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '11px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▼</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 500, color: 'white', minWidth: 0 }}>
            🔧 {response.nombre_OS_cliente || '(sin nombre)'}
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,.35)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {response.agencia || ''}{response.asesor_atendio ? ` · ${response.asesor_atendio}` : ''}
            </span>
          </div>
          <span style={{ fontSize: '8px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: 'rgba(34,197,94,.2)', color: '#86efac', fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', flexShrink: 0 }}>
            SERVICIO
          </span>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
            {scores.map((s, idx) => {
              const cls = scoreColor(s.val);
              const sty = dotStyle[cls] || dotStyle[''];
              return (
                <div key={idx} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '9px', fontWeight: 600, ...sty }} title={`${s.label}: ${s.val ?? '—'}`}>
                  {s.val ?? '?'}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fecha}</div>
          <button onClick={(e) => { e.stopPropagation(); deleteCard(key); }} title="Ocultar"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: 'rgba(248,113,113,.7)', cursor: 'pointer', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
            ✕
          </button>
        </div>
        {isOpen && (
          <div style={{ padding: '14px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#4b5563' }}>
              <strong>Agenda de cita:</strong> {response.satisfaccion_agenda_cita || '—'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {scores.map((s, idx) => (
                <div key={idx} style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '9px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.icon} {s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600, color: '#111827', lineHeight: 1 }}>{s.val != null ? s.val : '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>{renderStars(s.val)}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderLeft: '4px solid #22c55e', borderRadius: '9px', padding: '10px 14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>📝 Comentarios</div>
              <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.55' }}>
                {response.comentario?.trim()
                  ? <p style={{ margin: 0 }}>{response.comentario}</p>
                  : <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>Sin comentarios</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@400;500;600&display=swap');
        @keyframes pulse2  { 0%,100%{ box-shadow:0 0 0 3px rgba(37,211,102,.2) } 50%{ box-shadow:0 0 0 6px rgba(37,211,102,.05) } }
        @keyframes spin    { to{ transform:rotate(360deg) } }
        @keyframes fadeIn  { from{ opacity:0;transform:translateY(-4px) } to{ opacity:1;transform:translateY(0) } }
        .dot-pulse         { animation:pulse2 2s infinite }
        .spinner-anim      { animation:spin .7s linear infinite }
        .encuestas-scrollbar::-webkit-scrollbar       { width:4px }
        .encuestas-scrollbar::-webkit-scrollbar-thumb { background:#cbd5e1;border-radius:99px }
        .encuestas-input:focus { border-color:#00b0f0!important;background:white!important;box-shadow:0 0 0 3px rgba(0,176,240,.15)!important }
        .encuestas-btn-wa:hover    { background:#1ebe5d!important }
        .encuestas-btn-wa:active   { transform:scale(.98) }
        .encuestas-btn-wa:disabled { background:#9ca3af!important;box-shadow:none!important;cursor:not-allowed }
        .tpl-card           { cursor:pointer;transition:all .2s;border-radius:12px;border:2px solid transparent }
        .tpl-card:hover     { border-color:#cbd5e1;background:#f8fafd }
        .tpl-card.selected  { border-color:var(--tpl-color)!important;background:var(--tpl-bg)!important }
        .tpl-edit-btn       { opacity:0;transition:opacity .15s }
        .tpl-card:hover .tpl-edit-btn { opacity:1 }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px }
        .modal-box     { background:white;border-radius:20px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:fadeIn .2s ease }
        .filtro-select:focus { border-color:#00b0f0!important;outline:none;box-shadow:0 0 0 3px rgba(0,176,240,.15)!important }
        .filtro-input:focus  { border-color:#00b0f0!important;outline:none;box-shadow:0 0 0 3px rgba(0,176,240,.15)!important }
        .tab-tipo-btn        { transition:all .15s;cursor:pointer;border:none;border-radius:7px;padding:5px 12px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em }
        .tab-tipo-btn:hover  { opacity:0.85 }
        .pag-btn             { background:#f8fafd;border:1px solid #e5e7eb;border-radius:8px;padding:5px 14px;font-size:12px;cursor:pointer;color:#374151;transition:all .15s }
        .pag-btn:hover:not(:disabled) { background:#e5e7eb }
        .pag-btn:disabled    { opacity:0.35;cursor:default }
      `}</style>

      {/* MODAL EDITOR DE PLANTILLA */}
      {showTemplateEditor && templateDraft && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTemplateEditor(false); }}>
          <div className="modal-box">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {editingTemplate === 'new' ? '➕ Nueva plantilla' : '✏️ Editar plantilla'}
              </h3>
              <button onClick={() => setShowTemplateEditor(false)}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Ícono</label>
                  <input className="encuestas-input" type="text" placeholder="⭐"
                    value={templateDraft.icono}
                    onChange={e => setTemplateDraft({ ...templateDraft, icono: e.target.value })}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', padding: '8px' }} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input className="encuestas-input" type="text" placeholder="Ej: Encuesta de satisfacción"
                    value={templateDraft.nombre}
                    onChange={e => setTemplateDraft({ ...templateDraft, nombre: e.target.value })}
                    style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descripción</label>
                <input className="encuestas-input" type="text"
                  value={templateDraft.descripcion}
                  onChange={e => setTemplateDraft({ ...templateDraft, descripcion: e.target.value })}
                  style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>ID de plantilla (WhatsApp) *</label>
                  <input className="encuestas-input" type="text" placeholder="Ej: pisito"
                    value={templateDraft.template}
                    onChange={e => setTemplateDraft({ ...templateDraft, template: e.target.value })}
                    style={inputSmStyle} />
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#9ca3af' }}>Nombre exacto como aparece en Meta</p>
                </div>
                <div>
                  <label style={labelStyle}>Idioma (código exacto)</label>
                  <select className="encuestas-input"
                    value={templateDraft.langExact}
                    onChange={e => setTemplateDraft({ ...templateDraft, langExact: e.target.value })}
                    style={{ ...inputSmStyle, appearance: 'none' }}>
                    <option value="en_US">English US (en_US)</option>
                    <option value="en">English (en)</option>
                    <option value="es">Español (es)</option>
                    <option value="es_MX">Español MX (es_MX)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select className="encuestas-input" value={templateDraft.tipo}
                    onChange={e => setTemplateDraft({ ...templateDraft, tipo: e.target.value })}
                    style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="encuesta">⭐ Encuesta</option>
                    <option value="seguimiento">🔁 Seguimiento</option>
                    <option value="notificacion">👋 Notificación</option>
                    <option value="recordatorio">🗓️ Recordatorio</option>
                    <option value="marketing">🎁 Marketing</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Color</label>
                  <input type="color" value={templateDraft.color}
                    onChange={e => setTemplateDraft({ ...templateDraft, color: e.target.value })}
                    style={{ width: '100%', height: '41px', border: '1.5px solid #e5e7eb', borderRadius: '9px', cursor: 'pointer', background: 'white', padding: '2px 4px' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Flow ID (opcional)</label>
                <input className="encuestas-input" type="text" placeholder="Ej: 1738125237360317 — dejar vacío si no tiene Flow"
                  value={templateDraft.flowId || ''}
                  onChange={e => setTemplateDraft({ ...templateDraft, flowId: e.target.value || null })}
                  style={inputSmStyle} />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '8px' }}>Header de imagen</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', marginBottom: '8px' }}>
                  <input type="checkbox" checked={templateDraft.hasImage || false}
                    onChange={e => setTemplateDraft({ ...templateDraft, hasImage: e.target.checked })} />
                  Esta plantilla tiene imagen en el header
                </label>
                {templateDraft.hasImage && (
                  <input className="encuestas-input" type="text" placeholder="https://tu-servidor.com/imagen.jpg"
                    value={templateDraft.imageUrl || ''}
                    onChange={e => setTemplateDraft({ ...templateDraft, imageUrl: e.target.value })}
                    style={inputSmStyle} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Motivo de envío</label>
                <input className="encuestas-input" type="text"
                  value={templateDraft.motivo}
                  onChange={e => setTemplateDraft({ ...templateDraft, motivo: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descripción del mensaje</label>
                <textarea className="encuestas-input"
                  value={templateDraft.mensaje}
                  onChange={e => setTemplateDraft({ ...templateDraft, mensaje: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: '1.5' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => setShowTemplateEditor(false)}
                  style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={saveTemplate}
                  style={{ flex: 2, padding: '10px', background: '#001e50', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  💾 Guardar plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start', fontFamily: 'Epilogue, sans-serif' }}>

        {/* ── COLUMNA IZQUIERDA (sin cambios) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Selector de plantillas */}
          <div style={cardStyle}>
            <div style={{ ...cardHeaderStyle, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#f0f9ff', color: '#001e50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>📋</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Plantillas de mensaje
                </h2>
              </div>
              <button onClick={openNewTemplate}
                style={{ padding: '5px 12px', background: '#001e50', color: 'white', border: 'none', borderRadius: '7px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em', cursor: 'pointer' }}>
                ＋ Nueva
              </button>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {templates.map(t => {
                const badge      = TIPO_BADGE[t.tipo] || TIPO_BADGE.encuesta;
                const isSelected = selectedTemplateId === t.id;
                return (
                  <div key={t.id}
                    className={`tpl-card${isSelected ? ' selected' : ''}`}
                    style={{ '--tpl-color': t.color, '--tpl-bg': `${t.color}10`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onClick={() => setSelectedTemplateId(t.id)}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {t.icono}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descripcion}</div>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: badge.bg, color: badge.color, fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {badge.label}
                    </span>
                    {isSelected && <span style={{ color: t.color, fontSize: '12px', flexShrink: 0 }}>●</span>}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button className="tpl-edit-btn" onClick={(e) => { e.stopPropagation(); openEditor(t); }}
                        style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                      {templates.length > 1 && (
                        <button className="tpl-edit-btn" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario de envío */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.523 5.851L.057 23.882a.5.5 0 00.61.61l6.001-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.523-5.168-1.427l-.362-.216-3.747.904.921-3.668-.232-.373A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Enviar por WhatsApp
                </h2>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>{selectedTemplate.icono}</span>
                  <span style={{ fontWeight: 600, color: selectedTemplate.color }}>{selectedTemplate.nombre}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px' }}>· {selectedTemplate.template}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', gap: '8px', background: `${selectedTemplate.color}0d`, border: `1px solid ${selectedTemplate.color}30`, borderRadius: '10px', padding: '11px 14px', fontSize: '12px', color: selectedTemplate.color, lineHeight: '1.55', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px' }}>{selectedTemplate.icono}</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{selectedTemplate.nombre}</div>
                  {selectedTemplate.motivo  && <div style={{ opacity: 0.75, fontSize: '11px' }}>Motivo: {selectedTemplate.motivo}</div>}
                  {selectedTemplate.mensaje && <div style={{ marginTop: '4px', opacity: 0.7, fontSize: '11px' }}>{selectedTemplate.mensaje}</div>}
                  {selectedTemplate.hasImage && <div style={{ marginTop: '4px', opacity: 0.6, fontSize: '10px' }}>🖼️ Incluye imagen — se sube automáticamente</div>}
                  {selectedTemplate.flowId  && <div style={{ marginTop: '4px', opacity: 0.6, fontSize: '10px' }}>🔘 Flow: {selectedTemplate.flowId}</div>}
                  <div style={{ marginTop: '4px', opacity: 0.5, fontSize: '9px', fontFamily: 'monospace' }}>
                    template: {selectedTemplate.template} | lang: {selectedTemplate.langExact}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nombre del cliente</label>
                <input className="encuestas-input" type="text" placeholder="Ej: Juan García"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  style={inputStyle} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Número de WhatsApp</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="encuestas-input" value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    style={{ ...inputStyle, width: '110px', flexShrink: 0, appearance: 'none' }}>
                    <option value="52">🇲🇽 +52</option>
                    <option value="1">🇺🇸 +1</option>
                    <option value="54">🇦🇷 +54</option>
                    <option value="57">🇨🇴 +57</option>
                  </select>
                  <input className="encuestas-input" type="tel" placeholder="2711234567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Asesor que atendió</label>
                <input className="encuestas-input" type="text" placeholder="Ej: Carlos Pérez"
                  value={formData.advisor}
                  onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}
                  style={inputStyle} />
              </div>

              <button className="encuestas-btn-wa" onClick={sendSurvey} disabled={isSending}
                style={{ width: '100%', marginTop: '8px', padding: '13px 20px', background: '#25d366', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all .2s', boxShadow: '0 4px 14px rgba(37,211,102,.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.523 5.851L.057 23.882a.5.5 0 00.61.61l6.001-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.523-5.168-1.427l-.362-.216-3.747.904.921-3.668-.232-.373A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                <span>{isSending ? 'Enviando...' : `Enviar "${selectedTemplate.nombre}"`}</span>
                {isSending && <div className="spinner-anim" style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: 'white' }}></div>}
              </button>

              {alert.show && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: '8px', animation: 'fadeIn .2s ease', ...(alert.type === 'ok' ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#991b1b' }) }}>
                  <span style={{ flexShrink: 0 }}>{alert.type === 'ok' ? '✅' : '❌'}</span>
                  <span>{alert.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PANEL DERECHO MEJORADO ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#eff6ff', color: '#001e50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Panel de resultados
            </h2>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#9ca3af' }}>
              <span className={syncStatus ? 'dot-pulse' : ''} style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', background: syncStatus ? '#22c55e' : '#f87171' }}></span>
              <span>{syncStatus ? 'Conectado' : 'Sin conexión'}</span>
            </div>
          </div>

          <div style={{ padding: '1.4rem' }}>

            {/* ── Estadísticas ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {[
                { val: responses.length, label: 'Total',        barColor: '#001e50', textColor: '#001e50' },
                { val: numServicio,      label: 'Servicio',      barColor: '#22c55e', textColor: '#166534' },
                { val: numSatisf,        label: 'Satisfacción',  barColor: '#00b0f0', textColor: '#0369a1' },
                { val: errCount,         label: 'Fallidos',      barColor: '#ef4444', textColor: '#991b1b' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ height: '3px', background: s.barColor }}></div>
                  <div style={{ padding: '10px 8px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 500, lineHeight: 1, marginBottom: '3px', color: s.textColor }}>{s.val}</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '4px', background: '#f8fafd', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
              {[
                { id: 'responses', label: '📊 Respuestas de clientes' },
                { id: 'logs',      label: '📋 Registro de envíos'     },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px', fontFamily: 'Syne, sans-serif', fontWeight: 600, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all .2s', letterSpacing: '0.03em', background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#001e50' : '#9ca3af', boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── PANEL RESPUESTAS ── */}
            {activeTab === 'responses' && (
              <>
                {/* Filtros */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {/* Búsqueda */}
                  <input
                    className="filtro-input"
                    type="text"
                    placeholder="🔍 Buscar cliente, asesor, folio..."
                    value={filtroTexto}
                    onChange={e => setFiltroTexto(e.target.value)}
                    style={{ ...filterSelectStyle, flex: 2, minWidth: '160px' }}
                  />
                  {/* Tipo */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[
                      { val: 'todos',        label: 'Todos' },
                      { val: 'servicio',     label: '🔧 Servicio' },
                      { val: 'satisfaccion', label: '⭐ Satisfacción' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        className="tab-tipo-btn"
                        onClick={() => setFiltroTipo(val)}
                        style={{
                          background: filtroTipo === val ? '#001e50' : '#f3f4f6',
                          color:      filtroTipo === val ? 'white'   : '#6b7280',
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Dropdowns agencia / asesor */}
                {(agenciasUnicas.length > 0 || asesoresUnicos.length > 0) && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    {agenciasUnicas.length > 0 && (
                      <select
                        className="filtro-select"
                        value={filtroAgencia}
                        onChange={e => setFiltroAgencia(e.target.value)}
                        style={{ ...filterSelectStyle, flex: 1 }}
                      >
                        <option value="">Todas las agencias</option>
                        {agenciasUnicas.map(a => <option key={a}>{a}</option>)}
                      </select>
                    )}
                    {asesoresUnicos.length > 0 && (
                      <select
                        className="filtro-select"
                        value={filtroAsesor}
                        onChange={e => setFiltroAsesor(e.target.value)}
                        style={{ ...filterSelectStyle, flex: 1 }}
                      >
                        <option value="">Todos los asesores</option>
                        {asesoresUnicos.map(a => <option key={a}>{a}</option>)}
                      </select>
                    )}
                    {(filtroTexto || filtroTipo !== 'todos' || filtroAgencia || filtroAsesor) && (
                      <button
                        onClick={() => { setFiltroTexto(''); setFiltroTipo('todos'); setFiltroAgencia(''); setFiltroAsesor(''); }}
                        style={{ padding: '7px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '9px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >✕ Limpiar</button>
                    )}
                  </div>
                )}

                {/* Contador de resultados */}
                {(filtroTexto || filtroTipo !== 'todos' || filtroAgencia || filtroAsesor) && (
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px', fontFamily: 'monospace' }}>
                    {responsesFiltradas.length} resultado{responsesFiltradas.length !== 1 ? 's' : ''} de {responses.length} total
                  </div>
                )}

                {/* Lista */}
                <div className="encuestas-scrollbar" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                  {responsesPagina.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af', fontSize: '13px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>
                        {responses.length === 0 ? '💬' : '🔍'}
                      </div>
                      <p style={{ margin: 0 }}>
                        {responses.length === 0
                          ? <>Sin respuestas aún.<br /><span style={{ fontSize: '11px' }}>Se actualizan automáticamente cada 3 segundos.</span></>
                          : <>Sin resultados para los filtros aplicados.</>
                        }
                      </p>
                    </div>
                  ) : (
                    responsesPagina.map((r) => <ResponseCard key={getItemKey(r)} response={r} />)
                  )}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
                    <button className="pag-btn" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>← Anterior</button>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                      {pagina} / {totalPaginas}
                    </span>
                    <button className="pag-btn" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente →</button>
                  </div>
                )}
              </>
            )}

            {/* ── PANEL LOGS ── */}
            {activeTab === 'logs' && (
              <div>
                {!logsLoaded ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af', fontSize: '13px' }}>
                    <div className="spinner-anim" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#001e50', margin: '0 auto 12px' }}></div>
                    <p style={{ margin: 0 }}>Cargando historial...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📤</div>
                    <p style={{ margin: 0 }}>Aún no hay envíos registrados.<br />Envía tu primera encuesta.</p>
                  </div>
                ) : (
                  <div className="encuestas-scrollbar" style={{ maxHeight: '560px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          {['Cliente', 'Número', 'Asesor', 'Plantilla', 'Hora', 'Estado'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e5e7eb', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px' }}>{log.name}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>+{log.phone}</td>
                            <td style={{ padding: '10px' }}>{log.advisor || '—'}</td>
                            <td style={{ padding: '10px', fontSize: '11px', color: '#6b7280' }}>{log.templateName || '—'}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>{log.time}</td>
                            <td style={{ padding: '10px' }}>
                              {log.status === 'ok'
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', background: '#dcfce7', color: '#166534' }}>✓ Enviado</span>
                                : log.status === 'warning'
                                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', background: '#fef3c7', color: '#92400e' }}>⚠️ Advertencia</span>
                                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', background: '#fee2e2', color: '#991b1b' }}>✗ Error</span>
                              }
                              {log.errorMsg && (
                                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.errorMsg}>
                                  {log.errorMsg.substring(0, 60)}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EncuestasWhats;