const sessionID = () => sessionStorage.getItem('sessionID');

async function apiFetch(path, options = {}) {
  const res  = await fetch(path, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${sessionID()}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// Module state
let zonasCache   = [];
let puestosCache = [];
let zonaActiva   = null;

// On load
document.addEventListener('DOMContentLoaded', async () => {
  await cargarZonas();
  document.getElementById('filtro-vehiculo')
    ?.addEventListener('change', () => cargarPuestos(zonaActiva));
  document.getElementById('filtro-estado')
    ?.addEventListener('change', () => cargarPuestos(zonaActiva));
  document.getElementById('btn-actualizar')
    ?.addEventListener('click',  () => cargarPuestos(zonaActiva));
});

// Load zones and render tabs
async function cargarZonas() {
  try {
    const { zonas } = await apiFetch('/api/estacionamiento/zonas');
    zonasCache = zonas;
    renderTabs(zonas);

    if (!zonaActiva && zonas.length > 0) {
      await seleccionarZona(zonas[0].id_zona);
    } else if (zonaActiva) {
      document.querySelectorAll('.tab-pill[data-zona]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.zona === zonaActiva);
      });
      const zona = zonasCache.find(z => z.id_zona === zonaActiva);
      if (zona) actualizarStats(zona);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderTabs(zonas) {
  const container = document.getElementById('zona-tabs');
  if (!container) return;
  container.innerHTML = zonas.map(z => `
    <button class="tab-pill" data-zona="${z.id_zona}"
      onclick="seleccionarZona('${z.id_zona}')">
      ${z.nombre}
    </button>
  `).join('');
}

async function seleccionarZona(idZona) {
  zonaActiva = idZona;
  document.querySelectorAll('.tab-pill[data-zona]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.zona === idZona);
  });
  const zona = zonasCache.find(z => z.id_zona === idZona);
  if (zona) actualizarStats(zona);
  await cargarPuestos(idZona);
}
window.seleccionarZona = seleccionarZona;

function actualizarStats(zona) {
  const libres   = parseInt(zona.libres        || 0);
  const total    = parseInt(zona.total_puestos || 0);
  const ocupados = parseInt(zona.ocupados      || 0);
  const tasa     = total > 0 ? Math.round((ocupados / total) * 100) : 0;

  setField('stat-disponibilidad', libres);
  setField('stat-total-puestos',  `/ ${total} puestos`);
  setField('stat-tasa',           `${tasa}%`);
  setField('stat-sensores',       total);
}

async function cargarPuestos(idZona) {
  if (!idZona) return;
  const vehiculo = document.getElementById('filtro-vehiculo')?.value || 'todos';
  const estado   = document.getElementById('filtro-estado')?.value   || 'todos';

  try {
    const params = new URLSearchParams();
    if (vehiculo !== 'todos') params.append('vehiculo', vehiculo);
    if (estado   !== 'todos') params.append('estado',   estado);

    const { puestos } = await apiFetch(
      `/api/estacionamiento/zonas/${idZona}/puestos?${params}`
    );
    puestosCache = puestos;
    renderGrilla(puestos);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

const ICONOS = {
  Carro:        '🚗',
  Moto:         '🏍',
  Carga:        '🚛',
  Preferencial: '♿'
};

const COLORES = {
  Libre:         '#22C55E',
  Ocupado:       '#F59E0B',
  Reservado:     '#3B82F6',
  Mantenimiento: '#EF4444'
};

function renderGrilla(puestos) {
  const grid = document.getElementById('parking-grid');
  if (!grid) return;

  if (puestos.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center;
                  padding:40px; color:var(--color-text-muted)">
        No hay puestos con ese filtro
      </div>`;
    return;
  }

  grid.innerHTML = puestos.map(p => {
    const prefijo = { Moto: 'M', Carga: 'C', Preferencial: 'P' }[p.tipo_vehiculo] || 'S';
    const label   = `${prefijo}-${String(p.numero_puesto).padStart(2, '0')}`;
    const color   = COLORES[p.estado] || '#9CA3AF';

    return `
      <div onclick="seleccionarPuesto('${zonaActiva}', ${p.numero_puesto})"
           data-numero="${p.numero_puesto}"
           style="
             position: relative;
             display: flex;
             flex-direction: column;
             align-items: center;
             justify-content: center;
             gap: 4px;
             padding: 12px 8px;
             border: 2px solid ${color};
             border-radius: 10px;
             background: white;
             cursor: pointer;
             min-height: 80px;
             transition: transform 0.1s, box-shadow 0.1s;
           "
           onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'"
           onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">

        <div style="
          position: absolute;
          top: 6px; right: 6px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: ${color};
        "></div>

        <span style="font-size: 1.4rem; line-height: 1">
          ${ICONOS[p.tipo_vehiculo] || '🚗'}
        </span>

        <span style="
          font-size: 0.72rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.02em;
        ">${label}</span>
      </div>`;
  }).join('');
}

async function seleccionarPuesto(idZona, numero) {
  const puesto = puestosCache.find(p => p.numero_puesto === numero);
  if (!puesto) return;

  const prefijo = { Moto: 'M', Carga: 'C', Preferencial: 'P' }[puesto.tipo_vehiculo] || 'S';
  const label   = `${prefijo}-${String(numero).padStart(2, '0')}`;

  setField('detalle-id',     label);
  setField('detalle-tipo',   puesto.tipo_vehiculo);
  setField('detalle-estado', puesto.estado);
  setField('detalle-zona',   zonasCache.find(z => z.id_zona === idZona)?.nombre || idZona);

  document.querySelectorAll('#parking-grid [data-numero]').forEach(card => {
    const isSelected = parseInt(card.dataset.numero) === numero;
    card.style.outline = isSelected ? '3px solid var(--color-blue)' : 'none';
  });

  const detailBody  = document.getElementById('spot-detail-body');
  const detailEmpty = document.getElementById('spot-detail-empty');
  if (detailBody)  detailBody.style.display  = '';
  if (detailEmpty) detailEmpty.style.display = 'none';

  const header = document.getElementById('spot-detail-header');
  if (header) header.textContent = `Detalle del Puesto — ${label}`;

  // Fetch active registro
  const usuario = getUsuario();
  const esAdmin = usuario?.roles?.some(r => r.rol === 'administrativo');

  let registroActivo = null;
  try {
    const data = await apiFetch(
      `/api/estacionamiento/registro/${idZona}/${numero}`
    );
    registroActivo = data.registro;
  } catch (_) {}

  setField('detalle-placa',   registroActivo?.placa || '—');
  setField('detalle-entrada', registroActivo
    ? new Date(registroActivo.fecha_entrada).toLocaleTimeString('es-VE', {
        timeZone: 'America/Caracas',
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
        hour12:   true
      })
    : '—');


  const acciones    = document.getElementById('detalle-acciones');
  if (!acciones) return;
  acciones.innerHTML = '';

  const miPlaca     = sessionStorage.getItem(`placa-${idZona}-${numero}`);
  const esMiReserva = !!miPlaca;

  if (puesto.estado === 'Libre') {
    acciones.innerHTML = `
      <button class="btn btn-primary btn-sm"
        onclick="abrirModalReserva('${idZona}', ${numero})">
        Reservar puesto
      </button>`;
  }

  else if (puesto.estado === 'Reservado') {
    if (esMiReserva) {
      acciones.innerHTML = `
        <p style="font-size:0.82rem; color:var(--color-text-secondary); margin:0 0 8px 0">
          🔑 Placa registrada: <strong>${miPlaca}</strong>
        </p>
        <button class="btn btn-sm" style="background:#F59E0B; color:white; width:100%"
          onclick="simularEntrada('${idZona}', ${numero})">
          🚗 Simular llegada del vehículo
        </button>
        <button class="btn btn-outline btn-sm" style="margin-top:6px; width:100%; color:var(--color-danger)"
          onclick="cancelarReserva('${idZona}', ${numero})">
          Cancelar mi reserva
        </button>`;
    } else {
      acciones.innerHTML = `
        <div style="
          background: var(--color-blue-light);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: 0.82rem;
          color: var(--color-text-secondary);
          text-align: center">
          🔒 Este puesto ya fue reservado por otro usuario
        </div>`;
    }
  }

  else if (puesto.estado === 'Ocupado') {
    const miAcceso = sessionStorage.getItem(`acceso-${idZona}-${numero}`);

    if (miAcceso) {
      acciones.innerHTML = `
        <p style="font-size:0.82rem;color:var(--color-text-secondary);margin:0 0 8px 0">
          🚗 Tu vehículo: <strong>${miAcceso}</strong>
        </p>
        <button class="btn btn-outline btn-sm" style="width:100%"
          onclick="simularSalida('${idZona}', ${numero})">
          🏁 Simular salida del vehículo
        </button>`;
    } else {
      acciones.innerHTML = `
        <div style="
          background:#FFF7ED; border-radius:var(--radius-md);
          padding:var(--space-3); font-size:0.82rem;
          color:var(--color-text-secondary); text-align:center">
          🚗 Puesto en uso
        </div>`;
    }
  }

  else if (puesto.estado === 'Mantenimiento') {
    acciones.innerHTML = `
      <div style="
        background: #FEF2F2;
        border-radius: var(--radius-md);
        padding: var(--space-3);
        font-size: 0.82rem;
        color: var(--color-danger);
        text-align: center">
        🔧 Puesto fuera de servicio
      </div>`;
  }

  if (esAdmin && puesto.estado !== 'Reservado') {
    const sep = document.createElement('div');
    sep.style.marginTop = '8px';
    sep.innerHTML = puesto.estado === 'Mantenimiento'
      ? `<button class="btn btn-sm" style="width:100%;background:#22C55E;color:white"
           onclick="cambiarEstado('${idZona}', ${numero}, 'Libre')">
           ✓ Quitar mantenimiento
         </button>`
      : `<button class="btn btn-sm" style="width:100%;background:#EF4444;color:white"
           onclick="cambiarEstado('${idZona}', ${numero}, 'Mantenimiento')">
           🔧 Poner en mantenimiento
         </button>`;
    acciones.appendChild(sep);
  }
}
window.seleccionarPuesto = seleccionarPuesto;

async function cambiarEstado(idZona, numero, nuevoEstado) {
  try {
    await apiFetch(
      `/api/estacionamiento/puestos/${idZona}/${numero}`,
      { method: 'PATCH', body: JSON.stringify({ estado: nuevoEstado }) }
    );

    showToast(
      `Puesto actualizado a ${nuevoEstado}`,
      nuevoEstado === 'Libre' ? 'success' : 'info'
    );

    await refrescarZona(idZona, numero);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.cambiarEstado = cambiarEstado;

async function cancelarReserva(idZona, numero) {
  if (!confirm('¿Seguro que quieres cancelar tu reserva?')) return;
  try {
    await apiFetch(`/api/estacionamiento/puestos/${idZona}/${numero}`,
      { method: 'PATCH', body: JSON.stringify({ estado: 'Libre' }) });
    sessionStorage.removeItem(`placa-${idZona}-${numero}`);
    sessionStorage.removeItem(`acceso-${idZona}-${numero}`);
    showToast('Reserva cancelada', 'success');
    await refrescarZona(idZona, numero);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.cancelarReserva = cancelarReserva;

function abrirModalReserva(idZona, numero) {
  document.getElementById('modal-reserva-zona').value   = idZona;
  document.getElementById('modal-reserva-numero').value = numero;
  document.getElementById('modal-reserva-placa').value  = '';

  const prefijo = puestosCache.find(p => p.numero_puesto === numero)?.tipo_vehiculo;
  const label   = `${({ Moto: 'M', Carga: 'C', Preferencial: 'P' }[prefijo] || 'S')}-${String(numero).padStart(2, '0')}`;
  setField('modal-reserva-titulo', `Reservar puesto ${label}`);

  openModal('modal-reserva');
}
window.abrirModalReserva = abrirModalReserva;

async function confirmarReserva() {
  const idZona = document.getElementById('modal-reserva-zona').value;
  const numero = parseInt(document.getElementById('modal-reserva-numero').value);
  const placa  = document.getElementById('modal-reserva-placa').value.trim().toUpperCase();

  if (!placa) {
    showToast('Ingresa la placa del vehículo', 'warning');
    return;
  }
  if (!/^[A-Za-z]{2,3}-?\d{2,3}[A-Za-z]?$/.test(placa)) {
    showToast('Formato de placa inválido. Ejemplo: ABC-123', 'warning');
    return;
  }

  try {
    await apiFetch(`/api/estacionamiento/puestos/${idZona}/${numero}`,
      { method: 'PATCH', body: JSON.stringify({ estado: 'Reservado' }) });

    sessionStorage.setItem(`placa-${idZona}-${numero}`, placa);

    showToast('Puesto reservado exitosamente', 'success');
    closeModal('modal-reserva');
    await refrescarZona(idZona, numero);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.confirmarReserva = confirmarReserva;

async function simularEntrada(idZona, numero) {
  const placa = sessionStorage.getItem(`placa-${idZona}-${numero}`)
    || prompt('Placa del vehículo que llega:');
  if (!placa) return;

  try {
    await apiFetch('/api/estacionamiento/entrada', {
      method: 'POST',
      body: JSON.stringify({ idZona, numeroPuesto: numero, placa })
    });

    sessionStorage.removeItem(`placa-${idZona}-${numero}`);
    sessionStorage.setItem(`acceso-${idZona}-${numero}`, placa);

    showToast('Entrada registrada — puesto Ocupado', 'info');
    await refrescarZona(idZona, numero);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.simularEntrada = simularEntrada;

async function simularSalida(idZona, numero) {
  try {
    const data = await apiFetch('/api/estacionamiento/salida', {
      method: 'POST',
      body:   JSON.stringify({ idZona, numeroPuesto: numero })
    });
    sessionStorage.removeItem(`acceso-${idZona}-${numero}`);
    showToast(data.aviso, 'success');
    await refrescarZona(idZona, numero);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.simularSalida = simularSalida;

async function refrescarZona(idZona, numero) {
  const { zonas } = await apiFetch('/api/estacionamiento/zonas');
  zonasCache = zonas;
  const zona = zonasCache.find(z => z.id_zona === idZona);
  if (zona) actualizarStats(zona);
  await cargarPuestos(idZona);
  seleccionarPuesto(idZona, numero);
}
window.refrescarZona = refrescarZona;

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '—';
}

window.renderForRole = function () { /* all roles see the same parking view */ };
