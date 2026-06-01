/* ── SAP TAG · app.js ── */
'use strict';

(function () {

    // ── Elementos ──────────────────────────────────────────────
    const empInput   = document.getElementById('inp-emp');
    const orderInput = document.getElementById('inp-order');
    const btnTag     = document.getElementById('btn-tag');
    const btnClear   = document.getElementById('btn-clear');
    const statusCard = document.getElementById('status-card');
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    const tagContent = document.getElementById('tag-content');
    const badge1     = document.getElementById('badge1');
    const badge2     = document.getElementById('badge2');
    const connDot    = document.getElementById('conn-dot');
    const connText   = document.getElementById('conn-text');

    // ── SVG icons inline ───────────────────────────────────────
    const ICONS = {
        info:    `<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4.5M10 13.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
        check:   `<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6 10l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
        warn:    `<path d="M10 2L1 17h18L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
        error:   `<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
        clock:   `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    };

    function setIcon(el, key) {
        el.innerHTML = ICONS[key] || ICONS.info;
    }

    // ── Estado visual ──────────────────────────────────────────
    function setStatus(type, iconKey, msg) {
        statusCard.className = 'status-card' + (type ? ' ' + type : '');
        setIcon(statusIcon, iconKey);
        statusText.textContent = msg;
    }

    // ── Lógica de flujo ────────────────────────────────────────
    function updateFlow() {
        const hasEmp   = empInput.value.trim().length > 0;
        const hasOrder = orderInput.value.trim().length > 0;

        empInput.classList.toggle('filled', hasEmp);
        orderInput.classList.toggle('filled', hasOrder);

        // Badges
        if (hasEmp) {
            badge1.className = 'step-badge done';
            badge1.textContent = '✓';
        } else {
            badge1.className = 'step-badge active';
            badge1.textContent = '1';
        }

        if (hasOrder) {
            badge2.className = 'step-badge done';
            badge2.textContent = '✓';
        } else {
            badge2.className = hasEmp ? 'step-badge active' : 'step-badge';
            badge2.textContent = '2';
        }

        // Status message
        if (!hasEmp) {
            setStatus('', 'info', 'Escanee el carnet del funcionario');
        } else if (!hasOrder) {
            setStatus('warning', 'warn', 'Funcionario capturado · Escanee la orden');
        } else {
            setStatus('', 'check', 'Listo · Presione TAG para registrar');
        }

        btnTag.disabled = !(hasEmp && hasOrder);
    }

    // ── Eventos de campos ──────────────────────────────────────
    empInput.addEventListener('input', updateFlow);
    orderInput.addEventListener('input', updateFlow);

    // Salto de foco con Enter (comportamiento estándar de lectores Zebra)
    empInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            orderInput.focus();
        }
    });

    orderInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !btnTag.disabled) {
            btnTag.click();
        }
    });

    // ── Limpiar ────────────────────────────────────────────────
    btnClear.addEventListener('click', function () {
        empInput.value  = '';
        orderInput.value = '';
        updateFlow();
        empInput.focus();
    });

    // ── TAG ────────────────────────────────────────────────────
    btnTag.addEventListener('click', async function () {
        const empId  = empInput.value.trim();
        const docNum = orderInput.value.trim();
        if (!empId || !docNum) return;

        // Loading state
        btnTag.disabled = true;
        tagContent.innerHTML = '<div class="spinner"></div>';
        setStatus('warning', 'info', 'Procesando en SAP Business One…');

        try {
            const res = await fetch(
                `/api/sap/tag?empId=${encodeURIComponent(empId)}&docNum=${encodeURIComponent(docNum)}`
            );

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (data.ok) {
                setStatus('success', 'check', data.message || 'Registro exitoso en SAP B1');
                empInput.value  = '';
                orderInput.value = '';
                updateFlow();
                setTimeout(() => empInput.focus(), 200);
            } else {
                setStatus('error', 'error', data.message || 'Error al registrar. Verifique los datos.');
                btnTag.disabled = false;
            }

        } catch (err) {
            setStatus('error', 'error', 'Error de red. Verifique la conexión.');
            btnTag.disabled = false;
            console.error('TAG error:', err);
        } finally {
            // Restaurar botón TAG
            tagContent.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    ${ICONS.clock}
                </svg>
                TAG`;
        }
    });

    // ── Verificar conexión SAP al iniciar ──────────────────────
    async function checkConnection() {
        try {
            const res  = await fetch('/api/sap/status');
            const data = await res.json();
            const ok   = data.status && !data.status.includes('SIN');

            connDot.className  = ok ? 'dot' : 'dot error';
            connText.textContent = ok ? 'CONECTADO' : 'SIN CONEXIÓN';
        } catch {
            connDot.className  = 'dot error';
            connText.textContent = 'SIN CONEXIÓN';
        }
    }

    // ── Service Worker (PWA) ───────────────────────────────────
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .catch(err => console.warn('SW no registrado:', err));
        });
    }

    // ── Init ───────────────────────────────────────────────────
    checkConnection();
    updateFlow();
    empInput.focus();

})();
