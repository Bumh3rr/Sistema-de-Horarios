<?php
session_start();
require_once 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'login') {
    handleLogin();
} elseif ($action === 'logout') {
    handleLogout();
}

function handleLogin()
{
    $email = $_GET['email'] ?? '';
    $password = $_GET['password'] ?? '';

    if ($email === '' || $password === '') {
        jsonResponse(false, 'Datos de inicio de sesión inválidos');
        return;
    }

    $user = getUser($email, $password);
    if ($user === null) {
        $email_admin = 'admin@gmail.com';
        $password_admin = '12345';

        if ($email === $email_admin && $password === $password_admin) {
            successLogin($email_admin, 'admin');
            return;
        }

        jsonResponse(false, 'Correo o contraseña incorrectos');
        return;
    }

    if ($user['activo'] != 1) {
        jsonResponse(false, 'El usuario no está activo');
        return;
    }

    $id = $user['docente_id'] ?? null;
    $rol = $user['rol'] ?? null;

    if ($id === null || $rol === null) {
        jsonResponse(false, 'Faltan datos de inicio de sesión');
        return;
    }
    successLogin($id, $rol);
}

function successLogin($id, $rol)
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $id;
    $_SESSION['role'] = $rol;

    if ($rol === 'admin') {
        jsonResponse(true, 'Inicio de sesión exitoso', ['redirect' => 'pages/dashboard.php']);
    }else if ($rol === 'docente') {
        jsonResponse(true, 'Inicio de sesión exitoso', ['redirect' => 'pages/horario_usuario.php']);
    }
}


function getUser($email, $password)
{
    global $conn;

    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ? AND password = ?");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return null;
    }

    return $result->fetch_assoc();
}

function handleLogout()
{
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
