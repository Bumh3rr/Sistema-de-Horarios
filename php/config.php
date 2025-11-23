<?php
// php/config.php

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cargar autoload de Composer si existe
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
    // Cargar .env de forma segura (no lanza excepción si no existe)
    try {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
        $dotenv->safeLoad();
    } catch (Throwable $e) {
        // No hacer nada: safeLoad ya evita exceptions, pero por seguridad
    }
}

// Obtener y normalizar variables (prefiere \$_ENV, luego getenv)
function env($key, $default = null) {
    if (isset($_ENV[$key])) return $_ENV[$key];
    $val = getenv($key);
    return $val === false ? $default : $val;
}

// Configuración de la base de datos con limpieza y casteo de puerto
define('DB_HOST', trim((string) env('MY_DB_HOST', '')));
define('DB_USER', trim((string) env('MY_DB_USER', '')));
define('DB_PASS', trim((string) env('MY_DB_PASS', '')));
define('DB_NAME', trim((string) env('MY_DB_NAME', '')));
define('DB_PORT', intval(trim((string) env('MY_DB_PORT', '0'))));

// Zona horaria
date_default_timezone_set('America/Mexico_City');

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    die("Error al conectar con la base de datos: " . $e->getMessage());
}

// Función para verificar si el usuario está autenticado
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Función para redirigir si no está autenticado
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: ../index.php');
        exit();
    }
}

// Función para limpiar datos de entrada
function cleanInput($data) {
    global $conn;
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $conn->real_escape_string($data);
}

// Función para generar respuestas JSON
function jsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}
?>
