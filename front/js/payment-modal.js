/* =============================================================
   payment-modal.js — Reusable 3-step payment modal
   Usage: PaymentModal.open({ invoiceId, concept, amountUSD, bcvRate, onSuccess })
   ============================================================= */

var PaymentModal = (function () {

  var BCV_RATE = 36.80;
  var cfg = {};
  var currentStep = 1;
  var selectedMethod = null;
  var partialAmount = 0;

  /* ---- Public API ---- */
  function open(config) {
    cfg = Object.assign({ invoiceId: '', concept: '', amountUSD: 0, bcvRate: BCV_RATE, onSuccess: null }, config);
    partialAmount = cfg.amountUSD;
    selectedMethod = null;
    currentStep = 1;
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
    if (input) partialAmount = parseFloat(input.value) || cfg.amountUSD;
    _renderStep(2);
  }

  /* ---- Step 2: Payment method ---- */
  var METHODS = [
    { id: 'tai',   icon: '🎓', name: 'TAI — Carnet Universitario', desc: 'Pago por NFC con tu carnet' },
    { id: 'movil', icon: '📱', name: 'Pago Móvil',                  desc: 'Transferencia bancaria móvil' },
    { id: 'zelle', icon: '💵', name: 'Zelle',                        desc: 'Transferencia en dólares' },
    { id: 'card',  icon: '💳', name: 'Tarjeta Crédito/Débito',       desc: 'Visa, Mastercard, AmEx' },
    { id: 'cash',  icon: '💶', name: 'Efectivo',                      desc: 'Pago en taquilla' },
    { id: 'crypto',icon: '₿',  name: 'Criptomoneda',                  desc: 'USDT, BTC u otras' },
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
        '<button class="btn btn-primary" onclick="PaymentModal._goStep3()">Continuar →</button>' +
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
               '<div class="form-group"><label class="form-label">UID del chip</label><input class="form-input" value="UID: A3F2-9C81-4E7D" readonly style="font-family:var(--font-mono);background:var(--color-bg);"></div>' +
               '<div class="form-group"><label class="form-label">Terminal POS</label><input class="form-input" value="POS-MONTALBÁN-03" readonly style="background:var(--color-bg);"></div>' +
             '</div>' +
             '<div class="receipt-row" style="background:var(--color-blue-light);border-radius:var(--radius-sm);padding:var(--space-3);"><span>Saldo TAI actual:</span><strong>$1,240.50 → $' + (1240.50 - partialAmount).toFixed(2) + '</strong></div>';
    }

    if (id === 'movil') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Teléfono emisor</label><input class="form-input" type="tel" placeholder="0412-123-4567"></div>' +
               '<div class="form-group"><label class="form-label">Banco de origen</label><select class="form-select"><option value="">Seleccione...</option>' + bankOpts + '</select></div>' +
               '<div class="form-group"><label class="form-label">Número de referencia</label><input class="form-input" type="text" placeholder="8–12 dígitos" maxlength="12"></div>' +
               '<div class="form-group"><label class="form-label">Fecha del movimiento</label><input class="form-input" type="date" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
             '</div>';
    }

    if (id === 'zelle') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Correo cuenta origen</label><input class="form-input" type="email" placeholder="ejemplo@correo.com"></div>' +
               '<div class="form-group"><label class="form-label">Nombre completo del titular</label><input class="form-input" type="text" placeholder="Nombre Apellido"></div>' +
               '<div class="form-group"><label class="form-label">Código de confirmación</label><input class="form-input" type="text" placeholder="ZLLE-2024-XXXXX"></div>' +
               '<div class="info-box">ℹ La tasa BCV vigente al momento de la confirmación se registrará automáticamente. <strong>Tasa actual: ' + cfg.bcvRate + ' Bs/$</strong></div>' +
             '</div>';
    }

    if (id === 'card') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Número de tarjeta</label><input class="form-input" type="text" id="pm-card-num" placeholder="0000 0000 0000 0000" maxlength="19" oninput="PaymentModal._formatCard(this)"></div>' +
               '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-3);">' +
                 '<div class="form-group"><label class="form-label">Mes</label><select class="form-select">' + Array.from({length:12},function(_,i){var m=String(i+1).padStart(2,'0');return '<option>'+m+'</option>';}).join('') + '</select></div>' +
                 '<div class="form-group"><label class="form-label">Año</label><select class="form-select">' + Array.from({length:8},function(_,i){var y=2025+i;return '<option>'+y+'</option>';}).join('') + '</select></div>' +
                 '<div class="form-group"><label class="form-label">Emisora</label><select class="form-select"><option>Visa</option><option>Mastercard</option><option>AmEx</option><option>Maestro</option></select></div>' +
               '</div>' +
               '<div class="form-group"><label class="form-label">Tipo de red</label><div style="display:flex;gap:var(--space-4);margin-top:var(--space-1);">' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-network" value="nacional" checked> Nacional</label>' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-network" value="internacional" onchange="PaymentModal._toggleIntlNote(this)"> Internacional</label>' +
               '</div></div>' +
               '<div id="pm-intl-note" style="display:none;" class="info-box">ℹ Se aplicará la tasa BCV vigente: <strong>' + cfg.bcvRate + ' Bs/$</strong></div>' +
             '</div>';
    }

    if (id === 'cash') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Moneda</label><div style="display:flex;gap:var(--space-4);margin-top:var(--space-1);">' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-currency" value="bs" onchange="PaymentModal._changeCurrency(this)"> Bolívares (Bs.)</label>' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-currency" value="usd" onchange="PaymentModal._changeCurrency(this)" checked> USD</label>' +
                 '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;"><input type="radio" name="pm-currency" value="eur" onchange="PaymentModal._changeCurrency(this)"> EUR</label>' +
               '</div></div>' +
               '<div class="form-group"><label class="form-label">Monto exacto recibido</label>' +
                 '<input class="form-input" type="number" id="pm-cash-amount" placeholder="0.00" oninput="PaymentModal._calcEquivalent(this)">' +
               '</div>' +
               '<div id="pm-cash-equiv" style="display:none;" class="info-box"></div>' +
               '<div class="info-box">⚠ Este pago será validado por el cajero en taquilla.</div>' +
             '</div>';
    }

    if (id === 'crypto') {
      return '<div style="display:flex;flex-direction:column;gap:var(--space-3);">' +
               '<div class="form-group"><label class="form-label">Hash de la transacción (TXID)</label><input class="form-input" type="text" placeholder="0x..." style="font-family:var(--font-mono);font-size:.8rem;"></div>' +
               '<div class="form-group"><label class="form-label">Red utilizada</label><select class="form-select"><option>USDT (TRC20)</option><option>USDT (ERC20)</option><option>Bitcoin (BTC)</option><option>Ethereum (ETH)</option></select></div>' +
               '<div class="form-group"><label class="form-label">Dirección de billetera origen</label><input class="form-input" type="text" placeholder="Dirección..." style="font-family:var(--font-mono);font-size:.8rem;"></div>' +
               '<div class="form-group"><label class="form-label">Tasa de conversión</label><input class="form-input" value="1 USDT = 1.000 USD | Tasa BCV: ' + cfg.bcvRate + ' Bs/$" readonly style="background:var(--color-bg);"></div>' +
               '<div class="info-box">₿ La tasa se registrará en el segundo exacto de la confirmación en la blockchain.</div>' +
             '</div>';
    }

    return '';
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
    var equiv = document.getElementById('pm-cash-equiv');
    if (!equiv || !currency) return;
    var val = parseFloat(input.value) || 0;
    if (currency.value === 'usd' || currency.value === 'eur') {
      var rate = currency.value === 'usd' ? cfg.bcvRate : cfg.bcvRate * 1.05;
      equiv.style.display = '';
      equiv.innerHTML = 'ℹ Equivalente en Bs.: <strong>Bs. ' + (val * rate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</strong>';
    } else {
      equiv.style.display = 'none';
    }
  }

  /* ---- Go to step 3 ---- */
  function _goStep3() {
    if (!selectedMethod) { showToast('Seleccione un método de pago', 'warning'); return; }
    _renderStep(3);
    if (cfg.onSuccess) cfg.onSuccess({ method: selectedMethod, amount: partialAmount, receiptId: randomReceipt() });
  }

  /* ---- Step 3: Confirmation receipt ---- */
  function _step3() {
    var methodLabels = { tai:'TAI — Carnet NFC', movil:'Pago Móvil', zelle:'Zelle', card:'Tarjeta Crédito/Débito', cash:'Efectivo', crypto:'Criptomoneda' };
    var receiptId = randomReceipt();
    var isPaid = (partialAmount >= cfg.amountUSD);
    var remaining = Math.max(0, cfg.amountUSD - partialAmount).toFixed(2);
    var bsAmount = (partialAmount * cfg.bcvRate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var needBCV = (selectedMethod !== 'tai');

    return '<div class="success-anim">' +
             '<div class="checkmark-circle">✓</div>' +
             '<div style="font-size:1.2rem;font-weight:700;">¡Pago Procesado Exitosamente!</div>' +
           '</div>' +
           '<div class="receipt-card" style="margin-bottom:var(--space-5);">' +
             '<div class="receipt-header"><span>RECIBO</span><span>' + receiptId + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Concepto</span><span class="receipt-value">' + cfg.concept + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Monto pagado</span><span class="receipt-value">$' + partialAmount.toFixed(2) + '</span></div>' +
             (needBCV ? '<div class="receipt-row"><span class="receipt-label">Monto en Bs.</span><span class="receipt-value">Bs. ' + bsAmount + '</span></div>' : '') +
             (needBCV ? '<div class="receipt-row"><span class="receipt-label">Tasa BCV aplicada</span><span class="receipt-value">' + cfg.bcvRate + ' Bs/$</span></div>' : '') +
             '<div class="receipt-row"><span class="receipt-label">Método</span><span class="receipt-value">' + (methodLabels[selectedMethod] || '') + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Fecha y hora</span><span class="receipt-value">' + formatDateTime() + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Saldo restante</span><span class="receipt-value">$' + remaining + '</span></div>' +
             '<div class="receipt-row"><span class="receipt-label">Estado factura</span><span class="receipt-value">' + (isPaid ? '<span class="badge badge-success">PAGADO</span>' : '<span class="badge badge-warning">PARCIAL</span>') + '</span></div>' +
           '</div>' +
           '<div class="modal-footer">' +
             '<button class="btn btn-secondary" onclick="showToast(\'Recibo enviado a maria.perez@ucab.edu.ve\', \'success\')">📧 Enviar recibo</button>' +
             '<button class="btn btn-primary" onclick="PaymentModal._closeAndUpdate(' + isPaid + ', \'' + remaining + '\')">Cerrar</button>' +
           '</div>';
  }

  function _closeAndUpdate(isPaid, remaining) {
    close();
    /* Notify the calling page */
    if (typeof window.onPaymentComplete === 'function') {
      window.onPaymentComplete({ paid: isPaid, remaining: parseFloat(remaining), invoiceId: cfg.invoiceId });
    }
  }

  /* ---- Expose ---- */
  return {
    open: open,
    close: close,
    _goStep2: _goStep2,
    _goStep3: _goStep3,
    _renderStep: _renderStep,
    _selectMethod: _selectMethod,
    _formatCard: _formatCard,
    _toggleIntlNote: _toggleIntlNote,
    _changeCurrency: _changeCurrency,
    _calcEquivalent: _calcEquivalent,
    _closeAndUpdate: _closeAndUpdate
  };

})();
