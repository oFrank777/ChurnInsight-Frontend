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
});

async function analizarCliente() {
    const idABuscar = document.getElementById('customerId').value;
    if (!idABuscar) return alert("Por favor, introduce un ID válido");

    const btn = document.querySelector('button[onclick="analizarCliente()"]');
    const textoOriginal = btn.innerText;
    btn.innerText = "Analizando...";
    btn.disabled = true;

    try {
        const data = await apiFetch(`/${idABuscar}`);
        actualizarInterfaz(data);
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

function actualizarInterfaz(datos) {
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

    actualizarGrafico(porcentajeProb);
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
