document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Evita que la página se recargue

    const user = document.getElementById('userInput').value;
    const pass = document.getElementById('passInput').value;

    const btn = document.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Autenticando...";
    btn.disabled = true;

    // Simulación de retraso de red
    setTimeout(() => {
        // Validación MOCK (Simulada)
        if (user === "admin@churn.com" && pass === "Contraseña12345") {
            // Guardamos en session storage del navegador que el usuario entró
            sessionStorage.setItem('isLogged', 'true');

            // Redirigir al Dashboard
            window.location.href = "dashboard.html";
        } else {
            notify.error("Credenciales incorrectas", "Prueba con: admin@churn.com / Contraseña12345");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }, 800);
});