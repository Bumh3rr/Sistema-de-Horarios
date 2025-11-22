<?php
require_once 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        listAulas();
        break;
    case 'get':
        getAula();
        break;
    case 'create':
    case 'update':
    case 'delete':
        if ($action === 'create') createAula();
        if ($action === 'update') updateAula();
        if ($action === 'delete') deleteAula();
        break;
    default:
        jsonResponse(false, 'Acción no válida');
}

function listAulas() {
    global $conn;
    
    $sql = "SELECT * FROM aulas WHERE activo = 1 ORDER BY edificio, nombre";
    $result = $conn->query($sql);
    $aulas = [];
    
    while ($row = $result->fetch_assoc()) {
        $aulas[] = $row;
    }
    
    jsonResponse(true, 'Aulas obtenidas exitosamente', $aulas);
}

function getAula() {
    global $conn;
    
    $id = cleanInput($_GET['id'] ?? '');
    
    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }
    
    $sql = "SELECT * FROM aulas WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(false, 'Aula no encontrada');
    }
    
    $aula = $result->fetch_assoc();
    jsonResponse(true, 'Aula obtenida exitosamente', $aula);
}

function createAula() {
    global $conn;
    
    $nombre = cleanInput($_POST['nombre'] ?? '');
    $edificio = cleanInput($_POST['edificio'] ?? '');
    $capacidad = cleanInput($_POST['capacidad'] ?? '');
    $tipo = cleanInput($_POST['tipo'] ?? 'teorica');
    $recursos = cleanInput($_POST['recursos'] ?? '');
    
    if (empty($nombre) || empty($edificio) || empty($capacidad)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }
    
    $sql = "INSERT INTO aulas (nombre, edificio, capacidad, tipo, recursos) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssiss", $nombre, $edificio, $capacidad, $tipo, $recursos);
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Aula creada exitosamente');
    } else {
        jsonResponse(false, 'Error al crear el aula');
    }
}

function updateAula() {
    global $conn;
    
    $id = cleanInput($_POST['aula_id'] ?? '');
    $nombre = cleanInput($_POST['nombre'] ?? '');
    $edificio = cleanInput($_POST['edificio'] ?? '');
    $capacidad = cleanInput($_POST['capacidad'] ?? '');
    $tipo = cleanInput($_POST['tipo'] ?? 'teorica');
    $recursos = cleanInput($_POST['recursos'] ?? '');
    
    if (empty($id) || empty($nombre) || empty($edificio) || empty($capacidad)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }
    
    $sql = "UPDATE aulas SET nombre = ?, edificio = ?, capacidad = ?, tipo = ?, recursos = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssissi", $nombre, $edificio, $capacidad, $tipo, $recursos, $id);
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Aula actualizada exitosamente');
    } else {
        jsonResponse(false, 'Error al actualizar el aula');
    }
}

function deleteAula() {
    global $conn;
    
    $id = cleanInput($_POST['id'] ?? '');
    
    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }
    
    $sql = "DELETE FROM aulas WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Aula eliminada exitosamente');
    } else {
        jsonResponse(false, 'Error al eliminar el aula');
    }
}
?>
