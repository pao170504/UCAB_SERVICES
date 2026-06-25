const sessionID = () => sessionStorage.getItem('sessionID');

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${sessionID()}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

let edificacionesCache = [];
let espaciosCache      = [];
let misReservasCache   = [];
let reservaData        = {};
let seleccion = { sede: 1, edificio: null, espacio: null };

document.addEventListener('DOMContentLoaded', async () => {
  await cargarEdificaciones();
  await cargarMisReservas();
  document.getElementById('sel-edificio')
    ?.addEventListener('change', onEdificioChange);
  document.getElementById('sel-espacio')
    ?.addEventListener('change', onEspacioChange);
  document.getElementById('btn-actualizar-tarifa')
    ?.addEventListener('click', actualizarTarifa);
});

async function cargarEdificaciones() {
  try {
    const { edificaciones } = await apiFetch(
      '/api/infraestructura/edificaciones?sede=1'
    );
    edificacionesCache = edificaciones;
    const sel = document.getElementById('sel-edificio');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar edificio...</option>' +
      edificaciones.map(e => `
        <option value="${encodeURIComponent(e.nombre_edificacion)}">
          ${e.nombre_edificacion} — ${e.disponibles} disponibles
        </option>`).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onEdificioChange() {
  const nombre = decodeURIComponent(this.value);
  seleccion.edificio = nombre;
  seleccion.espacio  = null;

  const selEsp = document.getElementById('sel-espacio');
  selEsp.innerHTML = '<option value="">Seleccionar espacio...</option>';
  limpiarDetalle();
  if (!nombre) return;

  try {
    const { espacios } = await apiFetch(
      `/api/infraestructura/edificaciones/1/${encodeURIComponent(nombre)}/espacios`
    );
    espaciosCache = espacios;
    selEsp.innerHTML = '<option value="">Seleccionar espacio...</option>' +
      espacios.map(e => `
        <option value="${e.numero_espacio}">
          ${e.tipo_espacio} ${e.numero_espacio}
          — Cap. ${e.capacidad_max}
          — ${e.disponibilidad}
        </option>`).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onEspacioChange() {
  const numero = parseInt(this.value);
  if (!numero) { limpiarDetalle(); return; }
  seleccion.espacio = numero;

  const esp = espaciosCache.find(e => e.numero_espacio === numero);
  if (!esp) return;

  setField('det-capacidad',      esp.capacidad_max + ' asientos');
  setField('det-mobiliario',     esp.tipo_mobiliario || '—');
  setField('det-estado',         esp.estado);
  setField('det-disponibilidad', esp.disponibilidad);

  const usuario = getUsuario();
  const esAdmin = esAdminSistema();

  const tarifaPanel = document.getElementById('tarifa-panel');
  if (tarifaPanel) tarifaPanel.style.display = '';

  const tarifaEditAdmin = document.getElementById('tarifa-edit-admin');
  if (tarifaEditAdmin) tarifaEditAdmin.style.display = esAdmin ? '' : 'none';

  const btnMant = document.getElementById('btn-mantenimiento');
  if (btnMant) {
    btnMant.style.display = esAdmin ? '' : 'none';
    btnMant.textContent   = esp.estado === 'Mantenimiento'
      ? '✓ Quitar mantenimiento'
      : '🔧 Poner en mantenimiento';
  }

  const btnAlquilar = document.getElementById('btn-alquilar');
  if (btnAlquilar) {
    btnAlquilar.style.display = '';
    btnAlquilar.disabled      = esp.disponibilidad !== 'Disponible';
    btnAlquilar.textContent   = esp.disponibilidad === 'Disponible'
      ? '📅 Reservar espacio'
      : '🔒 No disponible';
  }

  await cargarCalendario(numero);
  await cargarTarifas(esp);
}

async function cargarCalendario(numeroEspacio) {
  try {
    const { reservas } = await apiFetch(
      `/api/infraestructura/espacios/1/` +
      `${encodeURIComponent(seleccion.edificio)}/${numeroEspacio}/calendario`
    );
    renderCalendario(reservas);
  } catch (_) {
    renderCalendario([]);
  }
}

function renderCalendario(reservas) {
  const grid = document.getElementById('calendario-grid');
  if (!grid) return;

  const dias  = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
  const hoy   = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));

  const semana = dias.map((dia, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    return { dia, fecha, iso: fecha.toISOString().split('T')[0] };
  });

  const fin = semana[6].fecha;
  setField('semana-label',
    `${lunes.getDate()} ${lunes.toLocaleString('es-VE',{month:'short'})} — ` +
    `${fin.getDate()} ${fin.toLocaleString('es-VE',{month:'short'})}, ` +
    `${fin.getFullYear()}`
  );

  const COLOR = {
    'En Proceso': '#3B82F6', 'Completado': '#22C55E',
    'Pendiente':  '#F59E0B', 'Cancelado':  '#EF4444'
  };

  grid.innerHTML = semana.map(({ dia, fecha, iso }) => {
    const del_dia = reservas.filter(r =>
      new Date(r.fecha_uso).toISOString().split('T')[0] === iso
    );
    const bloques = del_dia.map(r => `
      <div style="
        background:${COLOR[r.estado_solicitud] || '#6B7280'}22;
        border-left:3px solid ${COLOR[r.estado_solicitud] || '#6B7280'};
        border-radius:4px; padding:4px 6px;
        font-size:0.72rem; margin-bottom:4px">
        <strong>${r.bloque_horario}</strong><br>
        <span style="color:var(--color-text-secondary)">${r.servicio}</span>
      </div>`).join('');

    return `
      <div style="min-width:90px; border-right:1px solid var(--color-border); padding:0 6px; flex:1">
        <div style="text-align:center; font-size:0.75rem; font-weight:700;
                    color:var(--color-text-secondary); padding:6px 0;
                    border-bottom:1px solid var(--color-border); margin-bottom:6px">
          ${dia}<br>
          <span style="font-weight:400">${fecha.getDate()}</span>
        </div>
        ${bloques || '<div style="height:32px"></div>'}
      </div>`;
  }).join('');
}

/* ── Tariff display (3-tier) ─────────────────────────────────────────────── */
const MAPA_SERVICIO = {
  'Auditorio':   'SERV-AUDIT',
  'Salón':       'SERV-SALON',
  'Laboratorio': 'SERV-LAB',
  'Cancha':      'SERV-CANCHA'
};

async function cargarTarifas(esp) {
  const idServicio = MAPA_SERVICIO[esp.tipo_espacio];
  if (!idServicio) return;

  try {
    const { tarifas } = await apiFetch(`/api/infraestructura/tarifas/${idServicio}`);

    /* Always show the panel for all users */
    const panel = document.getElementById('tarifa-panel');
    if (panel) panel.style.display = '';

    setField('tarifa-miembro',  `$${parseFloat(tarifas.tarifa_miembro).toFixed(2)}`);
    setField('tarifa-egresado', `$${parseFloat(tarifas.tarifa_egresado).toFixed(2)}`);
    setField('tarifa-externo',  `$${parseFloat(tarifas.tarifa_externo).toFixed(2)}`);

    /* Highlight the applicable tariff with bold + color */
    const usuario    = getUsuario();
    const esEgresado = usuario?.roles?.some(r => r.rol === 'egresado');
    const esMiembro  = usuario?.roles?.some(r =>
      r.rol === 'estudiante' || r.rol === 'profesor' || r.rol === 'administrativo'
    );
    const elM = document.getElementById('tarifa-miembro');
    const elE = document.getElementById('tarifa-egresado');
    const elX = document.getElementById('tarifa-externo');
    if (elM) { elM.style.fontWeight = esMiembro               ? '700' : '400'; elM.style.color = esMiembro               ? 'var(--color-primary)' : ''; }
    if (elE) { elE.style.fontWeight = esEgresado              ? '700' : '400'; elE.style.color = esEgresado              ? 'var(--color-primary)' : ''; }
    if (elX) { elX.style.fontWeight = !esMiembro && !esEgresado ? '700' : '400'; elX.style.color = !esMiembro && !esEgresado ? 'var(--color-primary)' : ''; }

    /* Populate admin edit inputs */
    const inputMin = document.getElementById('input-tarifa-min');
    const inputMax = document.getElementById('input-tarifa-max');
    if (inputMin) {
      inputMin.value               = parseFloat(tarifas.costo_min).toFixed(2);
      inputMin.dataset.idCategoria = tarifas.idCategoria || tarifas.id_categoria || '';
    }
    if (inputMax) inputMax.value = parseFloat(tarifas.costo_max).toFixed(2);
  } catch (err) {
    console.warn('Error cargando tarifas:', err.message);
  }
}

async function actualizarTarifa() {
  const inputMin    = document.getElementById('input-tarifa-min');
  const inputMax    = document.getElementById('input-tarifa-max');
  const errorEl     = document.getElementById('tarifa-error');
  const min         = parseFloat(inputMin?.value);
  const max         = parseFloat(inputMax?.value);

  if (errorEl) errorEl.style.display = 'none';

  if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
    if (errorEl) { errorEl.textContent = 'Ingresa valores numéricos válidos'; errorEl.style.display = 'block'; }
    return;
  }
  if (min > max) {
    if (errorEl) { errorEl.textContent = 'El mínimo no puede superar el máximo'; errorEl.style.display = 'block'; }
    return;
  }

  const idCategoria = inputMin?.dataset.idCategoria;
  if (!idCategoria) {
    if (errorEl) { errorEl.textContent = 'Selecciona un espacio primero'; errorEl.style.display = 'block'; }
    return;
  }

  try {
    const data = await apiFetch(
      `/api/admin/tarifas/1/${idCategoria}`,
      { method: 'PUT', body: JSON.stringify({ costoMin: min, costoMax: max }) }
    );
    showToast(
      `Tarifas actualizadas — Miembro: $${data.tarifa_miembro} | ` +
      `Egresado: $${data.tarifa_egresado} | Externo: $${data.tarifa_externo}`,
      'success'
    );
    const esp = espaciosCache.find(e => e.numero_espacio === seleccion.espacio);
    if (esp) await cargarTarifas(esp);
  } catch (err) {
    if (errorEl) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
  }
}

/* ── Maintenance toggle ──────────────────────────────────────────────────── */
async function toggleMantenimiento() {
  const esp = espaciosCache.find(e => e.numero_espacio === seleccion.espacio);
  if (!esp) return;
  const nuevoEstado = esp.estado === 'Mantenimiento' ? 'Activo'       : 'Mantenimiento';
  const nuevaDisp   = esp.estado === 'Mantenimiento' ? 'Disponible'   : 'No disponible';
  try {
    await apiFetch(
      `/api/infraestructura/espacios/1/` +
      `${encodeURIComponent(seleccion.edificio)}/${seleccion.espacio}`,
      { method: 'PATCH', body: JSON.stringify({ estado: nuevoEstado, disponibilidad: nuevaDisp }) }
    );
    showToast(`Espacio marcado como ${nuevoEstado}`, 'success');
    await cargarEdificaciones();
    await onEdificioChange.call(document.getElementById('sel-edificio'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.toggleMantenimiento = toggleMantenimiento;

/* ── Multi-step reservation modal ────────────────────────────────────────── */
function abrirModalReserva() {
  const esp = espaciosCache.find(e => e.numero_espacio === seleccion.espacio);
  if (!esp) return;

  const idServicio = MAPA_SERVICIO[esp.tipo_espacio] || 'SERV-SALON';

  reservaData = {
    idSede:            seleccion.sede,
    nombreEdificacion: seleccion.edificio,
    numeroEspacio:     seleccion.espacio,
    idServicio,
    esp,
    acompanantes: []
  };

  setField('modal-res-espacio',
    `${esp.tipo_espacio} ${seleccion.espacio} — ${seleccion.edificio}`);
  setField('modal-res-capacidad', `Capacidad: ${esp.capacidad_max} personas`);

  const hoy = new Date().toISOString().split('T')[0];
  const fechaInput = document.getElementById('modal-res-fecha');
  if (fechaInput) { fechaInput.min = hoy; fechaInput.value = hoy; }

  const errorEl = document.getElementById('modal-res-error');
  if (errorEl) errorEl.style.display = 'none';

  mostrarPasoReserva(1);
  openModal('modal-reserva-espacio');
}
window.abrirModalReserva = abrirModalReserva;

function mostrarPasoReserva(step) {
  [1, 2, 3].forEach(n => {
    const el  = document.getElementById(`reserva-step-${n}`);
    if (el) el.style.display = n === step ? '' : 'none';
    const dot = document.getElementById(`step-dot-${n}`);
    if (dot) {
      dot.style.background = n === step ? 'var(--color-primary)' : 'var(--color-border)';
      dot.style.color      = n === step ? '#fff' : 'var(--color-text-secondary)';
    }
  });
}

function avanzarReservaStep1() {
  const fecha   = document.getElementById('modal-res-fecha')?.value;
  const bloque  = document.getElementById('modal-res-bloque')?.value;
  const errorEl = document.getElementById('modal-res-error');
  if (errorEl) errorEl.style.display = 'none';

  if (!fecha || !bloque) {
    if (errorEl) { errorEl.textContent = 'Selecciona fecha y bloque horario'; errorEl.style.display = 'block'; }
    return;
  }

  reservaData.fechaUso      = fecha;
  reservaData.bloqueHorario = bloque;
  renderListaAcompanantes();
  mostrarPasoReserva(2);
}
window.avanzarReservaStep1 = avanzarReservaStep1;

function renderListaAcompanantes() {
  const lista = document.getElementById('lista-acompanantes');
  if (!lista) return;
  if (reservaData.acompanantes.length === 0) {
    lista.innerHTML = '<p style="color:var(--color-text-secondary);font-size:.85rem">Sin acompañantes agregados.</p>';
    return;
  }
  lista.innerHTML = reservaData.acompanantes.map((ac, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;
                padding:6px 0;border-bottom:1px solid var(--color-border)">
      <span style="font-size:.85rem">${ac.nombre}
        <span style="color:var(--color-text-secondary)">(${ac.documento})</span>
      </span>
      <button onclick="eliminarAcompanante(${i})" class="btn btn-secondary"
              style="padding:2px 8px;font-size:.75rem">✕</button>
    </div>`).join('');
}

function agregarAcompanante() {
  if (reservaData.acompanantes.length >= 5) {
    showToast('Máximo 5 acompañantes', 'warning'); return;
  }
  const nombre    = document.getElementById('input-acomp-nombre')?.value.trim();
  const documento = document.getElementById('input-acomp-doc')?.value.trim();
  if (!nombre || !documento) {
    showToast('Ingresa nombre y documento del acompañante', 'warning'); return;
  }
  reservaData.acompanantes.push({ nombre, documento });
  document.getElementById('input-acomp-nombre').value = '';
  document.getElementById('input-acomp-doc').value    = '';
  renderListaAcompanantes();
}
window.agregarAcompanante = agregarAcompanante;

function eliminarAcompanante(idx) {
  reservaData.acompanantes.splice(idx, 1);
  renderListaAcompanantes();
}
window.eliminarAcompanante = eliminarAcompanante;

function avanzarReservaStep2() {
  setField('resumen-espacio',
    `${reservaData.esp.tipo_espacio} ${reservaData.numeroEspacio} — ${reservaData.nombreEdificacion}`);
  setField('resumen-fecha',  reservaData.fechaUso);
  setField('resumen-bloque', reservaData.bloqueHorario);
  setField('resumen-acomp',
    reservaData.acompanantes.length > 0
      ? reservaData.acompanantes.map(a => a.nombre).join(', ')
      : 'Ninguno');
  mostrarPasoReserva(3);
}
window.avanzarReservaStep2 = avanzarReservaStep2;

async function confirmarReservaEspacio() {
  const errorEl = document.getElementById('modal-res-error');
  if (errorEl) errorEl.style.display = 'none';

  const btn = document.getElementById('btn-confirmar-reserva');
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

  try {
    const data = await apiFetch('/api/infraestructura/reservar', {
      method: 'POST',
      body:   JSON.stringify({
        idSede:            reservaData.idSede,
        nombreEdificacion: reservaData.nombreEdificacion,
        numeroEspacio:     reservaData.numeroEspacio,
        fechaUso:          reservaData.fechaUso,
        bloqueHorario:     reservaData.bloqueHorario,
        idServicio:        reservaData.idServicio,
        acompanantes:      reservaData.acompanantes
      })
    });
    closeModal('modal-reserva-espacio');
    showToast(data.aviso, 'success');
    await cargarEdificaciones();
    await onEdificioChange.call(document.getElementById('sel-edificio'));
    await cargarMisReservas();
  } catch (err) {
    if (errorEl) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
    mostrarPasoReserva(3);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar reserva'; }
  }
}
window.confirmarReservaEspacio = confirmarReservaEspacio;

/* ── Mis Reservas ────────────────────────────────────────────────────────── */
async function cargarMisReservas() {
  try {
    const { reservas } = await apiFetch('/api/infraestructura/mis-reservas');
    misReservasCache = reservas;
    renderMisReservas(reservas);
  } catch (err) {
    const cont = document.getElementById('mis-reservas-container');
    if (cont) cont.innerHTML = `<p style="color:var(--color-danger)">${err.message}</p>`;
  }
}

const ESTADO_BADGE_RESERVA = {
  'En Proceso': 'badge-info',
  'Completada': 'badge-success',
  'Cancelada':  'badge-danger',
  'Pendiente':  'badge-warning'
};
const FACTURA_BADGE = {
  'Pagada':    'badge-success',
  'Parcial':   'badge-warning',
  'Pendiente': 'badge-danger'
};

function renderMisReservas(lista) {
  const cont = document.getElementById('mis-reservas-container');
  if (!cont) return;

  if (!lista.length) {
    cont.innerHTML = '<p style="color:var(--color-text-secondary)">No tienes reservas de espacios registradas.</p>';
    return;
  }

  cont.innerHTML = lista.map(r => {
    const estadoBadge = ESTADO_BADGE_RESERVA[r.estado] || 'badge-info';
    const factBadge   = FACTURA_BADGE[r.estado_factura] || 'badge-warning';
    const progreso    = r.total_pasos > 0
      ? `${r.pasos_completados}/${r.total_pasos} pasos`
      : '—';
    const canCancel   = r.estado !== 'Cancelada' && r.estado !== 'Completada';

    return `
    <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-3)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
        <div>
          <span style="font-weight:600">${r.tipo_espacio} ${r.numero_espacio}</span>
          <span style="color:var(--color-text-secondary);margin-left:8px">${r.nombre_edificacion}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="badge ${estadoBadge}">${r.estado}</span>
          ${r.estado_factura
            ? `<span class="badge ${factBadge}">Factura: ${r.estado_factura}</span>`
            : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
                  gap:8px;margin-top:10px;font-size:.85rem">
        <div><span style="color:var(--color-text-secondary)">Fecha:</span>
          ${r.fecha_uso?.split('T')[0] || r.fecha_uso}</div>
        <div><span style="color:var(--color-text-secondary)">Bloque:</span> ${r.bloque_horario}</div>
        <div><span style="color:var(--color-text-secondary)">Progreso:</span> ${progreso}</div>
        <div><span style="color:var(--color-text-secondary)">Acompañantes:</span> ${r.total_acompanantes}</div>
        ${r.monto_factura
          ? `<div><span style="color:var(--color-text-secondary)">Monto:</span>
               $${parseFloat(r.monto_factura).toFixed(2)}</div>`
          : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn-secondary" style="font-size:.8rem"
          onclick="verPasosReserva('${r.id_solicitud}')">📋 Ver pasos</button>
        ${canCancel ? `
        <button class="btn btn-danger" style="font-size:.8rem"
          onclick="cancelarReservaInfra('${r.id_solicitud}')">✕ Cancelar</button>` : ''}
        ${r.id_factura && r.estado_factura !== 'Pagada' ? `
        <button class="btn btn-primary" style="font-size:.8rem"
          onclick="window.location.href='pagos.html'">💳 Ir a Pagos</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function verPasosReserva(idSolicitud) {
  try {
    const { pasos, acompanantes } = await apiFetch(
      `/api/infraestructura/reservas/${idSolicitud}/pasos`
    );

    const reserva = misReservasCache.find(r => r.id_solicitud === idSolicitud);
    const titulo  = reserva
      ? `${reserva.tipo_espacio} ${reserva.numero_espacio} — ${reserva.nombre_edificacion}`
      : idSolicitud;

    setField('modal-pasos-titulo', titulo);

    const PASO_COLOR = {
      'Completado': '#22C55E', 'En Proceso': '#3B82F6',
      'Pendiente':  '#F59E0B', 'Cancelado':  '#EF4444'
    };

    const pasosHtml = pasos.map((p, i) => `
      <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;
                  border-bottom:1px solid var(--color-border)">
        <div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;
                    background:${PASO_COLOR[p.estado_paso] || '#6B7280'};
                    display:flex;align-items:center;justify-content:center;
                    color:#fff;font-weight:700;font-size:.8rem">${i + 1}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:.85rem">${p.responsable}</div>
          <div style="font-size:.78rem;color:var(--color-text-secondary);margin-top:2px">
            ${p.estado_paso}
            ${p.fecha_completada
              ? ` · ${new Date(p.fecha_completada).toLocaleDateString('es-VE')}`
              : ''}
          </div>
        </div>
      </div>`).join('');

    const acompHtml = acompanantes.length > 0
      ? `<div style="margin-top:12px">
           <strong style="font-size:.85rem">Acompañantes:</strong>
           ${acompanantes.map(a =>
             `<div style="font-size:.82rem;color:var(--color-text-secondary);padding:2px 0">
                ${a.nombre} — ${a.documento}
              </div>`).join('')}
         </div>`
      : '';

    const body = document.getElementById('modal-pasos-body');
    if (body) body.innerHTML = pasosHtml + acompHtml;

    openModal('modal-pasos-reserva');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.verPasosReserva = verPasosReserva;

async function cancelarReservaInfra(idSolicitud) {
  if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;
  try {
    await apiFetch(`/api/infraestructura/reservas/${idSolicitud}`, {
      method: 'DELETE'
    });
    showToast('Reserva cancelada', 'success');
    await cargarMisReservas();
    await cargarEdificaciones();
    const sel = document.getElementById('sel-edificio');
    if (sel?.value) await onEdificioChange.call(sel);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.cancelarReservaInfra = cancelarReservaInfra;

/* ── Utilities ───────────────────────────────────────────────────────────── */
function limpiarDetalle() {
  ['det-capacidad','det-mobiliario','det-estado','det-disponibilidad',
   'tarifa-miembro','tarifa-egresado','tarifa-externo'].forEach(id => setField(id, '—'));
  const grid = document.getElementById('calendario-grid');
  if (grid) grid.innerHTML = '';
  const panel = document.getElementById('tarifa-panel');
  if (panel) panel.style.display = 'none';
  const btnMant = document.getElementById('btn-mantenimiento');
  if (btnMant) btnMant.style.display = 'none';
  const btnAlq = document.getElementById('btn-alquilar');
  if (btnAlq) btnAlq.style.display = 'none';
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '—';
}

window.renderForRole = function () {};
