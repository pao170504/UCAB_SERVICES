/* =============================================================
   payment-modal.js — Reusable 3-step payment modal
   Usage: PaymentModal.open({ facturaId, invoiceId, concept, amountUSD, bcvRate, onSuccess })
   ============================================================= */

var PaymentModal = (function () {

  var BCV_RATE = 37.68;
  var cfg = {};
  var currentStep = 1;
  var selectedMethod = null;
  var partialAmount = 0;
  var _lastResult = null;

  /* ---- Public API ---- */
  function open(config) {
    cfg = Object.assign(
      { facturaId: null, invoiceId: '', concept: '', amountUSD: 0, bcvRate: BCV_RATE, onSuccess: null },
      config
    );
    partialAmount = cfg.amountUSD;
    selectedMethod = null;
    currentStep = 1;
    _lastResult = null;
    _ensureDOM();
    _renderStep(1);
    openModal('pm-overlay');
  }

  function close() {
    closeModal('pm-overlay');
  }

  /* ---- DOM setup ---- */
  function _ensureDOM() {
    if (document.getElementById('pm-overlay')) return;
    var div = document.createElement('div');
    div.innerHTML =
      '<div class="modal-overlay" id="pm-overlay">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title">Registrar Pago</h3>' +
            '<button class="modal-close" onclick="PaymentModal.close()">×</button>' +
          '</div>' +
          '<div id="pm-steps" class="step-indicator"></div>' +
          '<div id="pm-body"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div.firstChild);
  }

  /* ---- Step indicator ---- */
  function _updateSteps(step) {
    var labels = ['Resumen', 'Método de Pago', 'Confirmación'];
    var el = document.getElementById('pm-steps');
    if (!el) return;
    var html = '';
    for (var i = 1; i <= 3; i++) {
      var cls = i < step ? 'completed' : (i === step ? 'active' : '');
      html += '<div class="step-item">' +
                '<div class="step-dot ' + cls + '">' + (i < step ? '✓' : i) + '</div>' +
                '<div class="step-label ' + (i === step ? 'active' : '') + '">' + labels[i-1] + '</div>' +
              '</div>';
      if (i < 3) html += '<div class="step-line ' + (i < step ? 'completed' : '') + '"></div>';
    }
    el.innerHTML = html;
  }

  /* ---- Step routing ---- */
  function _renderStep(step) {
    currentStep = step;
    _updateSteps(step);
    var body = document.getElementById('pm-body');
    if (!body) return;
    if (step === 1) body.innerHTML = _step1();
    else if (step === 2) body.innerHTML = _step2();
    else if (step === 3) body.innerHTML = _step3();
  }

  /* ---- Step 1: Summary ---- */
  function _step1() {
    var bsAmount = (cfg.amountUSD * cfg.bcvRate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '<div style="display:flex;flex-direction:column;gap:var(--space-4);">' +
      '<div class="receipt-card">' +
        '<div class="receipt-header"><span>' + (cfg.invoiceId || '') + '</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">Concepto</span><span class="receipt-value">' + (cfg.concept || '') + '</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">Total</span><span class="receipt-value">$' + cfg.amountUSD.toFixed(2) + ' | Bs. ' + bsAmount + '</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">Tasa BCV</span><span class="receipt-value">' + cfg.bcvRate + ' Bs/$</span></div>' +
        '<div class="receipt-row"><span class="receipt-label" style="font-weight:700;color:var(--color-blue);">Saldo pendiente</span><span class="receipt-value" style="font-size:1.2rem;color:var(--color-blue);">$' + cfg.amountUSD.toFixed(2) + '</span></div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Monto a pagar ahora ($)</label>' +
        '<input class="form-input" type="number" id="pm-partial-amount" value="' + cfg.amountUSD.toFixed(2) + '" min="0.01" max="' + cfg.amountUSD + '" step="0.01">' +
      '</div>' +
      '<div class="info-box">ℹ Puede realizar un abono parcial. El saldo restante quedará como <strong>PARCIAL</strong>.</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-primary" onclick="PaymentModal._goStep2()">Seleccionar método de pago →</button>' +
      '</div>' +
    '</div>';
  }

  function _goStep2() {
    var input = document.getElementById('pm-partial-amount');
    if (input) {
      var val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) { showToast('Ingrese un monto válido mayor a 0', 'warning'); return; }
      if (val > cfg.amountUSD + 0.001) { showToast('El monto excede el saldo pendiente', 'warning'); return; }
      partialAmount = val;
    }
    _renderStep(2);
  }

  /* ---- Step 2: Payment method ---- */
  var METHODS = [
    { id: 'tai',    icon: '🎓', name: 'TAI — Carnet Universitario', desc: 'Pago por NFC con tu carnet' },
    { id: 'movil',  icon: '📱', name: 'Pago Móvil',                  desc: 'Transferencia bancaria móvil' },
    { id: 'zelle',  icon: '💵', name: 'Zelle',                        desc: 'Transferencia en dólares' },
    { id: 'tarjeta',icon: '💳', name: 'Tarjeta Crédito/Débito',       desc: 'Visa, Mastercard, AmEx' },
    { id: 'efectivo',icon: '💶',name: 'Efectivo',                      desc: 'Pago en taquilla' },
    { id: 'cripto', icon: '₿',  name: 'Criptomoneda',                  desc: 'USDT, BTC u otras' },
  ];

  function _step2() {
    var cards = METHODS.map(function (m) {
      return '<div class="payment-method-card" data-method="' + m.id + '" onclick="PaymentModal._selectMethod(\'' + m.id + '\')">' +
               '<span class="payment-method-icon">' + m.icon + '</span>' +
               '<div><div class="payment-method-name">' + m.name + '</div><div class="payment-method-desc">' + m.desc + '</div></div>' +
             '</div>';
    }).join('');

    return '<div style="display:flex;flex-direction:column;gap:var(--space-4);">' +
      '<div class="payment-methods-grid">' + cards + '</div>' +
      '<div id="pm-method-form"></div>' +
      '<div class="modal-footer" id="pm-step2-footer" style="display:none;">' +
        '<button class="btn btn-secondary" onclick="PaymentModal._renderStep(1)">← Atrás</button>' +
        '<button class="btn btn-primary" id="pm-btn-continuar" onclick="PaymentModal._goStep3()">Continuar →</button>' +
      '</div>' +
    '</div>';
  }

  function _selectMethod(methodId) {
    selectedMethod = methodId;
    document.querySelectorAll('.payment-method-card').forEach(function (c) {
      c.classList.toggle('selected', c.dataset.method === methodId);
    });
    document.getElementById('pm-method-form').innerHTML = _methodForm(methodId);
    var footer = document.getElementById('pm-step2-footer');
    if (footer) footer.style.display = '';
  }

  function _methodForm(id) {
    var BANKS = ['Banesco','Mercantil','BBVA Provincial','BNC','Banco de Venezuela','Bicentenario','Otros'];
    var bankOpts = BANKS.map(function (b) { return '<option>' + b + '</option>'; }).join('');

    if (id === 'tai') {
      return '<div class="nfc-animation">' +
               '<div class="nfc-pulse">🎓</div>' +
               '<div style="font-weight:700;text-align:center;">Acerque su Carnet Universitario al lector</div>' +
             '</div>' +
             '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">UID del chip</label><input class="form-input" id="pm-tai-uuid" value="A3F2-9C81-4E7D" style="font-family:var(--font-mono);background:var(--color-bg);"></div>' +
               '<div class="form-group"><label class="form-label">Terminal POS</label><input class="form-input" id="pm-tai-pos" value="POS-MONTALBÁN-03" style="background:var(--color-bg);"></div>' +
             '</div>';
    }

    if (id === 'movil') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Teléfono emisor</label><input class="form-input" id="pm-movil-tel" type="tel" placeholder="0412-123-4567"></div>' +
               '<div class="form-group"><label class="form-label">Banco de origen</label><select class="form-select" id="pm-movil-banco"><option value="">Seleccione...</option>' + bankOpts + '</select></div>' +
               '<div class="form-group"><label class="form-label">Número de referencia</label><input class="form-input" id="pm-movil-ref" type="text" placeholder="8–12 dígitos" maxlength="20"></div>' +
             '</div>';
    }

    if (id === 'zelle') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Correo cuenta origen</label><input class="form-input" id="pm-zelle-correo" type="email" placeholder="ejemplo@correo.com"></div>' +
               '<div class="form-group"><label class="form-label">Nombre completo del titular</label><input class="form-input" id="pm-zelle-nombre" type="text" placeholder="Nombre Apellido"></div>' +
               '<div class="form-group"><label class="form-label">Código de confirmación</label><input class="form-input" id="pm-zelle-confirm" type="text" placeholder="ZLLE-2024-XXXXX"></div>' +
               '<div class="info-box">ℹ Tasa BCV aplicada: <strong>' + cfg.bcvRate + ' Bs/$</strong></div>' +
             '</div>';
    }

    if (id === 'tarjeta') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Número de tarjeta</label><input class="form-input" type="text" id="pm-card-num" placeholder="0000 0000 0000 0000" maxlength="19" oninput="PaymentModal._formatCard(this)"></div>' +
               '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-3);">' +
                 '<div class="form-group"><label class="form-label">Mes</label><select class="form-select" id="pm-card-mes">' + Array.from({length:12},function(_,i){var m=String(i+1).padStart(2,'0');return '<option>'+m+'</option>';}).join('') + '</select></div>' +
                 '<div class="form-group"><label class="form-label">Año</label><select class="form-select" id="pm-card-ano">' + Array.from({length:8},function(_,i){var y=2025+i;return '<option>'+y+'</option>';}).join('') + '</select></div>' +
                 '<div class="form-group"><label class="form-label">Emisora</label><select class="form-select" id="pm-card-emisora"><option>Visa</option><option>Mastercard</option><option>AmEx</option><option>Maestro</option></select></div>' +
               '</div>' +
               '<div class="form-group"><label class="form-label">Tipo de red</label><div style="display:flex;gap:var(--space-4);margin-top:var(--space-1);">' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-network" value="Nacional" checked> Nacional</label>' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-network" value="Internacional" onchange="PaymentModal._toggleIntlNote(this)"> Internacional</label>' +
               '</div></div>' +
               '<div id="pm-intl-note" style="display:none;" class="info-box">ℹ Se aplicará la tasa BCV vigente: <strong>' + cfg.bcvRate + ' Bs/$</strong></div>' +
             '</div>';
    }

    if (id === 'efectivo') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Moneda</label><div style="display:flex;gap:var(--space-4);margin-top:var(--space-1);">' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-currency" value="Bolívares" onchange="PaymentModal._changeCurrency(this)"> Bolívares (Bs.)</label>' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-currency" value="USD" onchange="PaymentModal._changeCurrency(this)" checked> USD</label>' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-currency" value="EUR" onchange="PaymentModal._changeCurrency(this)"> EUR</label>' +
               '</div></div>' +
               '<div class="form-group"><label class="form-label">Monto exacto recibido</label>' +
                 '<input class="form-input" type="number" id="pm-cash-amount" placeholder="0.00" oninput="PaymentModal._calcEquivalent(this)">' +
               '</div>' +
               '<div id="pm-cash-equiv" style="display:none;" class="info-box"></div>' +
               '<div class="info-box">⚠ Este pago será validado por el cajero en taquilla.</div>' +
             '</div>';
    }

    if (id === 'cripto') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Hash de la transacción (TXID)</label><input class="form-input" type="text" id="pm-crypto-txid" placeholder="0x..." style="font-family:var(--font-mono);font-size:.8rem;"></div>' +
               '<div class="form-group"><label class="form-label">Red utilizada</label><select class="form-select" id="pm-crypto-red"><option>USDT (TRC20)</option><option>USDT (ERC20)</option><option>Bitcoin (BTC)</option><option>Ethereum (ETH)</option></select></div>' +
               '<div class="form-group"><label class="form-label">Dirección de billetera origen</label><input class="form-input" type="text" id="pm-crypto-wallet" placeholder="Dirección..." style="font-family:var(--font-mono);font-size:.8rem;"></div>' +
               '<div class="info-box">₿ Tasa al momento de confirmación en blockchain: <strong>' + cfg.bcvRate + ' Bs/$</strong></div>' +
             '</div>';
    }

    return '';
  }

  /* ---- Collect method data from form ---- */
  function _collectMethodData(methodId) {
    if (methodId === 'tai') {
      var uuid = (document.getElementById('pm-tai-uuid') || {}).value || 'A3F2-9C81-4E7D';
      var pos  = (document.getElementById('pm-tai-pos')  || {}).value || 'POS-MONTALBÁN-03';
      return { uuid: uuid.trim(), pos: pos.trim() };
    }
    if (methodId === 'movil') {
      var tel  = ((document.getElementById('pm-movil-tel')   || {}).value || '').trim();
      var ban  = ((document.getElementById('pm-movil-banco') || {}).value || '').trim();
      var ref  = ((document.getElementById('pm-movil-ref')   || {}).value || '').trim();
      if (!tel || !ban || !ref) { showToast('Complete teléfono, banco y referencia', 'warning'); return null; }
      return { telefono: tel, banco: ban, referencia: ref };
    }
    if (methodId === 'zelle') {
      var correo  = ((document.getElementById('pm-zelle-correo')  || {}).value || '').trim();
      var nombre  = ((document.getElementById('pm-zelle-nombre')  || {}).value || '').trim();
      var confirm = ((document.getElementById('pm-zelle-confirm') || {}).value || '').trim();
      if (!correo || !nombre || !confirm) { showToast('Complete correo, nombre y código de confirmación Zelle', 'warning'); return null; }
      return { correo: correo, nombre_titular: nombre, confirmacion: confirm };
    }
    if (methodId === 'tarjeta') {
      var num     = ((document.getElementById('pm-card-num')    || {}).value || '').replace(/\s/g,'');
      var emisora = ((document.getElementById('pm-card-emisora')|| {}).value || '').trim();
      var redEl   = document.querySelector('input[name="pm-network"]:checked');
      var red     = redEl ? redEl.value : 'Nacional';
      if (!num || num.length < 13) { showToast('Ingrese un número de tarjeta válido', 'warning'); return null; }
      return { numero: num, emisora: emisora, tipo_red: red };
    }
    if (methodId === 'efectivo') {
      var monedaEl  = document.querySelector('input[name="pm-currency"]:checked');
      var montoEl   = document.getElementById('pm-cash-amount');
      var moneda    = monedaEl ? monedaEl.value : 'USD';
      var monto_rec = montoEl  ? parseFloat(montoEl.value) : 0;
      if (!monto_rec || monto_rec <= 0) { showToast('Ingrese el monto recibido en efectivo', 'warning'); return null; }
      return { moneda: moneda, monto_recibido: monto_rec };
    }
    if (methodId === 'cripto') {
      var txid    = ((document.getElementById('pm-crypto-txid')   || {}).value || '').trim();
      var red2    = ((document.getElementById('pm-crypto-red')    || {}).value || '').trim();
      var wallet  = ((document.getElementById('pm-crypto-wallet') || {}).value || '').trim();
      if (!txid || !wallet) { showToast('Complete TXID y dirección de billetera', 'warning'); return null; }
      return { txid: txid, red: red2, billetera: wallet };
    }
    return {};
  }

  /* ---- Card number formatter ---- */
  function _formatCard(input) {
    var v = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
  }

  function _toggleIntlNote(radio) {
    var note = document.getElementById('pm-intl-note');
    if (note) note.style.display = radio.checked ? '' : 'none';
  }

  function _changeCurrency(radio) {
    var amountInput = document.getElementById('pm-cash-amount');
    if (amountInput) _calcEquivalent(amountInput);
  }

  function _calcEquivalent(input) {
    var currency = document.querySelector('input[name="pm-currency"]:checked');
    var equiv    = document.getElementById('pm-cash-equiv');
    if (!equiv || !currency) return;
    var val = parseFloat(input.value) || 0;
    if (currency.value === 'USD' || currency.value === 'EUR') {
      var rate = currency.value === 'USD' ? cfg.bcvRate : cfg.bcvRate * 1.05;
      equiv.style.display = '';
      equiv.innerHTML = 'ℹ Equivalente en Bs.: <strong>Bs. ' + (val * rate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</strong>';
    } else {
      equiv.style.display = 'none';
    }
  }

  /* ---- Go to step 3 — submit to API ---- */
  function _goStep3() {
    if (!selectedMethod) { showToast('Seleccione un método de pago', 'warning'); return; }

    var datos = _collectMethodData(selectedMethod);
    if (datos === null) return; /* validation failed */

    /* No real factura ID → just show simulation confirmation */
    if (!cfg.facturaId) {
      _lastResult = { is_paid: (partialAmount >= cfg.amountUSD), saldo: Math.max(0, cfg.amountUSD - partialAmount), id_pago: randomReceipt() };
      _renderStep(3);
      if (cfg.onSuccess) cfg.onSuccess({ method: selectedMethod, amount: partialAmount });
      return;
    }

    /* Show loading state */
    var btn = document.getElementById('pm-btn-continuar');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    var sid = sessionStorage.getItem('sessionID') || '';
    fetch('/api/pagos/facturas/' + cfg.facturaId + '/pagar', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + sid, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ monto: partialAmount, metodo: selectedMethod, datos: datos })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (btn) { btn.disabled = false; btn.textContent = 'Continuar →'; }
        if (data.error) { showToast(data.error, 'error'); return; }
        _lastResult = data;
        _renderStep(3);
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Continuar →'; }
        showToast('Error al procesar el pago. Intente nuevamente.', 'error');
      });
  }

  /* ---- Step 3: Confirmation receipt ---- */
  function _step3() {
    var result  = _lastResult || {};
    var isPaid  = result.is_paid !== undefined ? result.is_paid : (partialAmount >= cfg.amountUSD);
    var saldo   = result.saldo  !== undefined ? parseFloat(result.saldo) : Math.max(0, cfg.amountUSD - partialAmount);
    var idPago  = result.id_pago || randomReceipt();

    var methodLabels = {
      tai:'TAI — Carnet NFC', movil:'Pago Móvil', zelle:'Zelle',
      tarjeta:'Tarjeta Crédito/Débito', efectivo:'Efectivo', cripto:'Criptomoneda'
    };
    var bsAmount = (partialAmount * cfg.bcvRate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var needBCV  = (selectedMethod !== 'tai');

    return '<div class="success-anim">' +
             '<div class="checkmark-circle">✓</div>' +
             '<div style="font-size:1.2rem;font-weight:700;">¡Pago Procesado Exitosamente!</div>' +
           '</div>' +
           '<div class="receipt-card" style="margin-bottom:var(--space-5);">' +
             '<div class="receipt-header"><span>RECIBO</span><span>' + idPago + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Concepto</span><span class="receipt-value">' + cfg.concept + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Monto pagado</span><span class="receipt-value">$' + partialAmount.toFixed(2) + '</span></div>' +
             (needBCV ? '<div class="receipt-row"><span class="receipt-label">Monto en Bs.</span><span class="receipt-value">Bs. ' + bsAmount + '</span></div>' : '') +
             (needBCV ? '<div class="receipt-row"><span class="receipt-label">Tasa BCV aplicada</span><span class="receipt-value">' + cfg.bcvRate + ' Bs/$</span></div>' : '') +
             '<div class="receipt-row"><span class="receipt-label">Método</span><span class="receipt-value">' + (methodLabels[selectedMethod] || selectedMethod) + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Fecha y hora</span><span class="receipt-value">' + formatDateTime() + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Saldo restante</span><span class="receipt-value">$' + saldo.toFixed(2) + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Estado factura</span><span class="receipt-value">' + (isPaid ? '<span class="badge badge-success">PAGADA</span>' : '<span class="badge badge-warning">PARCIAL</span>') + '</span></div>' +
           '</div>' +
           '<div class="modal-footer">' +
             '<button class="btn btn-secondary" onclick="showToast(\'Recibo enviado al correo institucional\', \'success\')">📧 Enviar recibo</button>' +
             '<button class="btn btn-primary" onclick="PaymentModal._closeAndUpdate()">Cerrar</button>' +
           '</div>';
  }

  function _closeAndUpdate() {
    close();
    if (typeof window.onPaymentComplete === 'function') {
      window.onPaymentComplete({
        paid:      _lastResult ? _lastResult.is_paid : false,
        is_paid:   _lastResult ? _lastResult.is_paid : false,
        remaining: _lastResult ? parseFloat(_lastResult.saldo || 0) : 0,
        saldo:     _lastResult ? parseFloat(_lastResult.saldo || 0) : 0,
        invoiceId: cfg.invoiceId,
        facturaId: cfg.facturaId
      });
    }
  }

  /* ---- Expose ---- */
  return {
    open:            open,
    close:           close,
    _goStep2:        _goStep2,
    _goStep3:        _goStep3,
    _renderStep:     _renderStep,
    _selectMethod:   _selectMethod,
    _formatCard:     _formatCard,
    _toggleIntlNote: _toggleIntlNote,
    _changeCurrency: _changeCurrency,
    _calcEquivalent: _calcEquivalent,
    _closeAndUpdate: _closeAndUpdate
  };

})();
