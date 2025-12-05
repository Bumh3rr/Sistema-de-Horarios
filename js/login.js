import {notyf} from './notify/Config.js';

const showLoading = (isVisible) => {
    if (isVisible) {
        document.getElementById("loading").style.display = "block";
    } else {
        document.getElementById("loading").style.display = "none";
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');


    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            showLoading(true);
            const response = await fetch('../php/auth.php?action=login&email='+email+'&password='+password);
            const data = await response.json();

            if (data.success) {
                notyf.success("¡Inicio de sesión exitoso!");
                window.location.href = data.data.redirect; // <- Redirigir según la respuesta del servidor
            } else {
                notyf.error(data.message || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error(error);
            notyf.error("Error de red o del servidor");
        } finally {
            showLoading(false);
        }
    });
});
