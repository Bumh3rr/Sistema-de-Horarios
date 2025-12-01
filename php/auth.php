<?php
session_start();
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        handleLogin();
    } elseif ($action === 'logout') {
        handleLogout();
    }
}

function handleLogin() {
    $rol = cleanInput($_POST['rol'] ?? '');
    $id = cleanInput($_POST['id'] ?? '');
    if ($rol === '' || $id === '') {
        jsonResponse(false, 'Faltan datos de inicio de sesión');
        return;
    }

    // Se guardar el ID de usuario en la sesión
    $_SESSION['user_id'] = $id;
    $_SESSION['role'] = $rol;

    // Determinar redirección
    $redirect = 'pages/dashboard.php';

    jsonResponse(true, 'Inicio de sesión exitoso', ['redirect' => $redirect]);
}

function handleLogout() {
    // Limpiar sesión y cookie
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();

    jsonResponse(true, 'Sesión cerrada exitosamente', ['redirect' => '../index.php']);
}
?>
