/**
 * Configuración global y funciones compartidas
 */
const URL_API = "https://dark-chicken-smile.loca.lt/predict";

/**
 * Maneja errores de fetch de forma centralizada
 */
async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${URL_API}${endpoint}`, options);
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: "Error desconocido en el servidor" };
        }
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    return response.status !== 204 ? await response.json() : null;
}

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
