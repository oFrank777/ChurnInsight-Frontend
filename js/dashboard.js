/**
 * Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    cargarEstadisticas();
    cargarAltoRiesgo();
    configurarCargaArchivo();
    inicializarGraficos();

    document.getElementById('tableSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#riskTableBody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });

    // Configurar ordenamiento de tabla
    configurarOrdenamientoTabla();
});

let datosTablaOriginal = []; // Para mantener copia de los datos
let ordenActual = { columna: null, ascendente: true };

function configurarOrdenamientoTabla() {
    const headers = document.querySelectorAll('.table-glass thead th');
    headers.forEach((th, index) => {
        if (index < 3) { // Solo ID, Probabilidad y Plan son ordenables
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => ordenarTabla(index));
            th.title = "Click para ordenar";
        }
    });
}

function ordenarTabla(colIndex) {
    const cuerpoTabla = document.getElementById('riskTableBody');
    const filas = Array.from(cuerpoTabla.querySelectorAll('tr'));

    // Si ya estábamos ordenando por esta columna, invertimos el sentido
    if (ordenActual.columna === colIndex) {
        ordenActual.ascendente = !ordenActual.ascendente;
    } else {
        ordenActual.columna = colIndex;
        ordenActual.ascendente = true;
    }

    // Actualizar iconos visuales en headers
    document.querySelectorAll('.table-glass thead th').forEach((th, idx) => {
        const baseText = th.innerText.replace(' ▲', '').replace(' ▼', '');
        if (idx === colIndex) {
            th.innerText = baseText + (ordenActual.ascendente ? ' ▲' : ' ▼');
        } else {
            th.innerText = baseText;
        }
    });

    filas.sort((a, b) => {
        let valA = a.cells[colIndex].innerText.replace('#', '').replace('%', '').trim();
        let valB = b.cells[colIndex].innerText.replace('#', '').replace('%', '').trim();

        // Convertir a número si es posible
        if (!isNaN(valA) && !isNaN(valB)) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        }

        if (valA < valB) return ordenActual.ascendente ? -1 : 1;
        if (valA > valB) return ordenActual.ascendente ? 1 : -1;
        return 0;
    });

    cuerpoTabla.append(...filas);
}

async function cargarEstadisticas() {
    try {
        const datos = await apiFetch('/stats');

        document.getElementById('totalEvaluados').innerText = datos.totalEvaluados;
        document.getElementById('tasaChurn').innerText = format.percent(datos.tasaChurn);
        document.getElementById('tasaRetencion').innerText = format.percent(1 - datos.tasaChurn);

        await cargarRangoIDs();
    } catch (error) {
        console.error("Error estadísticas:", error);
    }
}

async function cargarRangoIDs() {
    try {
        const listaIds = await apiFetch('/clients/ids');
        if (listaIds.length > 0) {
            const minId = Math.min(...listaIds);
            const maxId = Math.max(...listaIds);
            const elementoRango = document.getElementById('rangoIds');
            if (elementoRango) {
                elementoRango.innerText = `IDs: ${minId} - ${maxId}`;
            }
        }
    } catch (error) {
        console.error("Error cargando IDs:", error);
    }
}

async function cargarAltoRiesgo() {
    try {
        const datos = await apiFetch('/high-risk');
        const cuerpoTabla = document.getElementById('riskTableBody');
        cuerpoTabla.innerHTML = '';

        if (datos.length === 0) {
            cuerpoTabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay clientes de alto riesgo detectados recientemente.</td></tr>';
            return;
        }

        datos.forEach(item => {
            const fila = document.createElement('tr');
            const planVisual = item.plan || 'N/A';
            const clasePlan = planVisual === 'PREMIUM' ? 'bg-warning' :
                planVisual === 'ESTANDAR' ? 'bg-info' :
                    planVisual === 'BASICO' ? 'bg-secondary' : 'bg-dark';

            const textoCompleto = item.factores && item.factores.length > 0 ? item.factores.join('. ') : 'Sin factores detectados';
            const factoresVisual = textoCompleto.length > 50 ? textoCompleto.substring(0, 47) + '...' : textoCompleto;

            fila.innerHTML = `
                <td class="id-highlight">#${item.idCliente}</td>
                <td><span class="badge bg-danger">${format.percent(item.probabilidad)}</span></td>
                <td><span class="badge ${clasePlan}">${planVisual}</span></td>
                <td class="small text-muted">${factoresVisual}</td>
                <td>
                    <a href="predictor.html?id=${item.idCliente}" class="btn btn-sm btn-outline-primary">Ver Detalle</a>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    } catch (error) {
        console.error("Error alto riesgo:", error);
    }
}

function configurarCargaArchivo() {
    const zonaDrop = document.getElementById('dropZone');
    const inputArchivo = document.getElementById('csvFile');
    if (!zonaDrop || !inputArchivo) return;

    zonaDrop.addEventListener('click', () => inputArchivo.click());
    inputArchivo.addEventListener('change', (e) => e.target.files.length > 0 && procesarCSV(e.target.files[0]));

    ['dragover', 'dragleave', 'drop'].forEach(evt => {
        zonaDrop.addEventListener(evt, (e) => {
            e.preventDefault();
            if (evt === 'dragover') {
                zonaDrop.style.borderColor = "#818cf8";
                zonaDrop.style.background = "rgba(129, 140, 248, 0.1)";
            } else {
                zonaDrop.style.borderColor = "rgba(255, 255, 255, 0.2)";
                zonaDrop.style.background = "transparent";
                if (evt === 'drop' && e.dataTransfer.files.length > 0) procesarCSV(e.dataTransfer.files[0]);
            }
        });
    });
}

async function procesarCSV(archivo) {
    const divEstado = document.getElementById('uploadStatus');
    divEstado?.classList.remove('d-none');

    const formData = new FormData();
    formData.append('file', archivo);

    try {
        const resultadosLote = await apiFetch('/batch', {
            method: 'POST',
            body: formData
        });

        notify.success('Carga Completada', `Se han procesado ${resultadosLote.length} clientes correctamente.`);
        cargarEstadisticas();
        cargarAltoRiesgo();
        cargarDatosGraficos();
    } catch (error) {
        notify.error("Error en Carga Masiva", error.message);
    } finally {
        divEstado?.classList.add('d-none');
        if (document.getElementById('csvFile')) document.getElementById('csvFile').value = '';
    }
}



// ========== GRÁFICOS ==========
let graficoChurn, graficoPlan, graficoRiesgo;

function inicializarGraficos() {
    const createConfig = (type, labels, colors) => ({
        type,
        data: { labels, datasets: [{ data: [], backgroundColor: colors, borderWidth: 0, borderRadius: 8 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: type === 'doughnut', position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } } }
        }
    });

    const ctxC = document.getElementById('graficoChurn')?.getContext('2d');
    if (ctxC) graficoChurn = new Chart(ctxC, createConfig('doughnut', ['Retención', 'Riesgo Churn'], ['#22c55e', '#ef4444']));

    const ctxP = document.getElementById('graficoPlan')?.getContext('2d');
    if (ctxP) graficoPlan = new Chart(ctxP, createConfig('bar', ['Básico', 'Estándar', 'Premium'], ['#64748b', '#3b82f6', '#f59e0b']));

    const ctxR = document.getElementById('graficoRiesgo')?.getContext('2d');
    if (ctxR) {
        const cfg = createConfig('bar', ['Bajo (<40%)', 'Medio (40-70%)', 'Alto (>70%)'], ['#22c55e', '#f59e0b', '#ef4444']);
        cfg.options.indexAxis = 'y';
        graficoRiesgo = new Chart(ctxR, cfg);
    }

    cargarDatosGraficos();
}

async function cargarDatosGraficos() {
    try {
        const stats = await apiFetch('/stats-charts');

        if (graficoChurn) {
            graficoChurn.data.datasets[0].data = [stats.retencion, stats.churn];
            graficoChurn.update();
        }
        if (graficoPlan) {
            graficoPlan.data.datasets[0].data = [stats.planBasico, stats.planEstandar, stats.planPremium];
            graficoPlan.update();
        }
        if (graficoRiesgo) {
            graficoRiesgo.data.datasets[0].data = [stats.riesgoBajo, stats.riesgoMedio, stats.riesgoAlto];
            graficoRiesgo.update();
        }
    } catch (e) {
        console.error('Error gráficos:', e);
        // Mostrar aviso visual si fallan los gráficos
        const container = document.querySelector('.charts-container');
        if (container && !document.getElementById('chartError')) {
            const alert = document.createElement('div');
            alert.id = 'chartError';
            alert.className = 'alert alert-warning m-3';
            alert.innerText = '⚠️ No se pudieron cargar algunos gráficos. Intenta recargar la página.';
            container.prepend(alert);
        }
    }
}
