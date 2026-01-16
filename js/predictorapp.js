// Auto-cargar cliente si viene ID en la URL
document.addEventListener('DOMContentLoaded', () => {
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idCliente = parametrosUrl.get('id');

    if (idCliente) {
        document.getElementById('customerId').value = idCliente;
        analizarCliente();
    }

    document.getElementById('customerId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analizarCliente();
    });

    // Inicializar botón de recomendación desde el inicio
    const btnAccion = document.getElementById('btnRecommendation');
    if (btnAccion) {
        btnAccion.onclick = mostrarRecomendacion;
    }
});

async function analizarCliente() {
    const idABuscar = document.getElementById('customerId').value.trim();
    if (!idABuscar) return notify.error("ID Requerido", "Por favor, introduce un ID válido para el análisis.");

    // Validación de número y rango
    if (!/^\d+$/.test(idABuscar)) {
        return notify.error("ID Inválido", "El ID debe contener solo números.");
    }

    if (parseInt(idABuscar) > 2147483647) {
        return notify.error("ID fuera de rango", "El identificador es demasiado largo. Introduce un número menor.");
    }

    const btn = document.querySelector('button[onclick="analizarCliente()"]');
    const textoOriginal = btn.innerText;
    btn.innerText = "Analizando...";
    btn.disabled = true;

    try {
        const data = await apiFetch(`/${idABuscar}`);
        actualizarInterfaz(data);
    } catch (error) {
        console.error("Error:", error);
        notify.error("Error de Análisis", error.message);
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

let currentDataIA = null;

function actualizarInterfaz(datos) {
    currentDataIA = datos; // Guardamos para la acción recomendada
    // Mapeo de propiedades del Backend a la UI
    document.getElementById('resId').innerText = datos.idCliente || 'N/A';
    const generoMap = { 'MASCULINO': 'Hombre', 'FEMENINO': 'Mujer' };
    document.getElementById('resGenero').innerText = generoMap[datos.genero] || datos.genero || 'N/A';
    document.getElementById('resPlan').innerText = datos.plan || 'N/A';
    document.getElementById('resTiempo').innerText = format.months(datos.tiempoContratoMeses);
    document.getElementById('resUso').innerText = format.hours(datos.usoMensual);
    document.getElementById('resTickets').innerText = datos.ticketsSoporte || 0;
    document.getElementById('resRetrasos').innerText = format.months(datos.retrasosPago);

    document.getElementById('resAutoPay').innerText = datos.pagoAutomatico ? 'SÍ' : 'NO';
    document.getElementById('resCambioPlan').innerText = datos.cambioPlan ? 'SÍ' : 'NO';

    const porcentajeProb = Math.round(datos.probabilidad * 100);
    document.getElementById('probValue').innerText = format.percent(datos.probabilidad);

    const estadoRiesgo = document.querySelector('.alert');
    if (estadoRiesgo) {
        estadoRiesgo.innerText = "ESTADO DE RIESGO: " + datos.prevision.toUpperCase();
        estadoRiesgo.className = porcentajeProb > 50
            ? 'alert alert-danger text-center fw-bold py-2 mb-4'
            : 'alert alert-success text-center fw-bold py-2 mb-4';
    }

    const contenedorFactores = document.getElementById('riskFactorsList');
    contenedorFactores.innerHTML = '';

    if (datos.factores && datos.factores.length > 0) {
        datos.factores.forEach(factor => {
            const li = document.createElement('li');
            li.innerHTML = `• ${factor}`;
            contenedorFactores.appendChild(li);
        });
    } else {
        contenedorFactores.innerHTML = '<li class="text-success">✅ Sin factores de riesgo detectados</li>';
    }

    // Activar botón de acción
    const btnAccion = document.getElementById('btnRecommendation');
    if (btnAccion) {
        btnAccion.onclick = mostrarRecomendacion;
        btnAccion.classList.remove('disabled', 'opacity-50');
    }

    actualizarGrafico(porcentajeProb);
}

function mostrarRecomendacion() {
    if (!currentDataIA || !currentDataIA.accionRecomendada) {
        return notify.error("Análisis Pendiente", "Por favor, analiza primero al cliente usando su ID para que la IA pueda generar una recomendación estratégica.");
    }

    Swal.fire({
        icon: 'info',
        title: 'Estrategia de Retención Sugerida',
        html: `
            <div class="text-start mt-3">
                <p class="mb-2"><strong>Se recomienda la siguiente acción proactiva:</strong></p>
                <div class="alert alert-info border-0 shadow-sm mb-0" style="background: rgba(129, 140, 248, 0.1); color: #818cf8; font-size: 1.1rem; border-left: 4px solid #818cf8 !important; border-radius: 12px;">
                    <i class="fas fa-lightbulb me-2"></i> ${currentDataIA.accionRecomendada}
                </div>
                <p class="small text-muted mt-3">
                    * Esta sugerencia se basa en el análisis profundo del comportamiento histórico y actual del suscriptor.
                </p>
            </div>
        `,
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#818cf8',
        confirmButtonText: 'Entendido, aplicar',
        borderRadius: '24px',
        backdrop: `rgba(15, 23, 42, 0.9)`,
        target: 'body', // Forzar que se ancle al body
        didOpen: () => {
            // Forzar z-index máximo en el contenedor de SweetAlert manualmente
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '99999';
        }
    });
}

let miGrafico;
function actualizarGrafico(valor) {
    const ctx = document.getElementById('gaugeChart').getContext('2d');

    let colorFondo = '#198754';
    if (valor >= 70) colorFondo = '#dc3545';
    else if (valor >= 40) colorFondo = '#ffc107';

    if (miGrafico) miGrafico.destroy();

    miGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [valor, 100 - valor],
                backgroundColor: [colorFondo, '#e9ecef'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
                cutout: '85%'
            }]
        },
        options: {
            aspectRatio: 1.5,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}
