/**
 * Configuración global y funciones compartidas
 */
const URL_API = "https://churninsight-backend-production.up.railway.app/predict";
const API_TIMEOUT = 15000; // 15 segundos

/**
 * Maneja errores de fetch de forma centralizada con soporte para Timeouts
 */
async function apiFetch(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const response = await fetch(`${URL_API}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                ...options.headers,
                'bypass-tunnel-reminder': 'true' // Bypass localtunnel warning automatically
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: "Error crítico en el servidor" };
            }
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        return response.status !== 204 ? await response.json() : null;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error("⏳ El servidor tardó demasiado en responder. Revisa tu conexión.");
        }
        throw error;
    }
}

/**
 * Sistema de Notificaciones Premium (SweetAlert2)
 */
const notify = {
    success: (title, text) => {
        return Swal.fire({
            icon: 'success',
            title: title || '¡Éxito!',
            text: text,
            background: '#1e293b',
            color: '#f8fafc',
            confirmButtonColor: '#818cf8',
            confirmButtonText: 'Entendido',
            borderRadius: '24px',
            backdrop: `rgba(15, 23, 42, 0.8)`
        });
    },
    error: (title, text) => {
        return Swal.fire({
            icon: 'error',
            title: title || 'Mmm...',
            text: text || 'Algo salió mal. Inténtalo de nuevo.',
            background: '#1e293b',
            color: '#f8fafc',
            confirmButtonColor: '#ef4444',
            borderRadius: '24px',
            backdrop: `rgba(15, 23, 42, 0.8)`
        });
    },
    confirm: (title, text) => {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '24px',
            backdrop: `rgba(15, 23, 42, 0.8)`
        });
    }
};

/**
 * Formatea valores numéricos
 */
const format = {
    percent: (val) => `${Math.round(val * 100)}%`,
    hours: (val) => `${val || 0} hrs`,
    months: (val) => `${val || 0} meses`
};

/**
 * Logout unificado
 */
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

/**
 * Verifica sesión activa
 */
function checkAuth() {
    if (!sessionStorage.getItem('isLogged')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
