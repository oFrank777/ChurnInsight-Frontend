/**
 * ChurnInsight - Lógica de Registro de Clientes
 */

document.addEventListener('DOMContentLoaded', () => {
    asignarSiguienteID();
});

async function asignarSiguienteID() {
    const inputID = document.getElementById('ClienteID');
    if (!inputID) return;

    try {
        const ids = await apiFetch('/clients/ids');
        const nuevoID = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        inputID.value = nuevoID;
    } catch (error) {
        console.error('Error obteniendo IDs:', error);
        let ultimoID = localStorage.getItem('ultimoClienteID');
        inputID.value = ultimoID ? parseInt(ultimoID) + 1 : 1;
    }
}

document.getElementById('registroForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const idGenerado = document.getElementById('ClienteID').value;
    const generoRaw = document.getElementById('Genero').value;
    const generoVal = generoRaw === 'Masculino' ? 'MASCULINO' : 'FEMENINO';

    const nuevoRegistro = {
        id_cliente: parseInt(idGenerado),
        tiempo_contrato_meses: parseInt(document.getElementById('tiempo_meses').value),
        retrasos_pago: parseInt(document.getElementById('retrasos_pago').value),
        uso_mensual: parseFloat(document.getElementById('uso_mensual_horas').value),
        plan: document.getElementById('plan').value.toUpperCase(),
        tickets_soporte: parseInt(document.getElementById('soporte_tickets').value),
        genero: generoVal,
        cambio_plan: document.getElementById('cambio_plan').checked,
        pago_automatico: document.getElementById('pago_automatico').checked
    };

    const btnSubmit = document.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerText;
    btnSubmit.innerText = "Registrando...";
    btnSubmit.disabled = true;

    try {
        localStorage.setItem('ultimoClienteID', idGenerado);
        const resultado = await apiFetch('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoRegistro)
        });

        await notify.success('¡Registro Exitoso!', `Cliente #${idGenerado} ha sido añadido al sistema.`);
        window.location.href = "predictor.html";

    } catch (error) {
        console.error("Error al registrar:", error);
        notify.error("Error al registrar", error.message);
    } finally {
        btnSubmit.innerText = textoOriginal;
        btnSubmit.disabled = false;
    }
});

function limpiarFormulario() {
    document.getElementById('registroForm').reset();
    asignarSiguienteID();
}
