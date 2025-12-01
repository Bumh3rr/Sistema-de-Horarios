<?php
require_once 'config.php';
requireLogin();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        listDocentes();
        break;
    case 'get':
        getDocente();
        break;
    case 'horario':
        getHorarioDocente();
        break;
    case 'create':
        createDocente();
        break;
    case 'update':
        updateDocente();
        break;
    case 'delete':
        deleteDocente();
        break;
    default:
        jsonResponse(false, 'Acción no válida');
}

function listDocentes()
{
    global $conn;

    $search = cleanInput($_GET['search'] ?? '');
    $activo = cleanInput($_GET['activo'] ?? '');

    $sql = "SELECT id, nombre, apellido, email, telefono, rfc, activo, fecha_registro 
            FROM docente WHERE 1=1";

    if ($search) {
        $sql .= " AND (nombre LIKE '%$search%' OR apellido LIKE '%$search%' OR email LIKE '%$search%' OR rfc LIKE '%$search%')";
    }

    if ($activo !== '') {
        $sql .= " AND activo = '$activo'";
    }

    $sql .= " ORDER BY fecha_registro DESC";

    $result = $conn->query($sql);
    $docentes = [];

    while ($row = $result->fetch_assoc()) {
        $docentes[] = $row;
    }

    jsonResponse(true, 'Docentes obtenidos exitosamente', $docentes);
}

function getDocente()
{
    global $conn;

    $id = cleanInput($_GET['id'] ?? '');

    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }

    $sql = "SELECT id, nombre, apellido, email, password, telefono, rfc, activo FROM docente WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        jsonResponse(false, 'Docente no encontrado');
    }
    $docente = $result->fetch_assoc();

    // Obtener materias asignadas
    $sql2 = "SELECT materia_id FROM docente_materias WHERE docente_id = ?";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("i", $id);
    $stmt2->execute();
    $res2 = $stmt2->get_result();

    $materias = [];
    while ($row = $res2->fetch_assoc()) {
        $materias[] = $row['materia_id'];
    }
    $docente['materias'] = $materias;
    jsonResponse(true, 'Docente obtenido exitosamente', $docente);
}

function getHorarioDocente()
{
    global $conn;

    $id = cleanInput($_GET['id'] ?? '');

    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }

    $sql = "SELECT h.*, 
            g.nombre as grupo_nombre,
            m.nombre as materia_nombre,
            a.nombre as aula_nombre,
            a.edificio as aula_edificio
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            JOIN materias m ON g.materia_id = m.id
            JOIN aulas a ON h.aula_id = a.id
            WHERE g.profesor_id = ?
            ORDER BY 
              FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'),
              h.hora_inicio";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    $horarios = [];
    while ($row = $result->fetch_assoc()) {
        $horarios[] = $row;
    }

    jsonResponse(true, 'Horario obtenido exitosamente', $horarios);
}

function createDocente()
{
    global $conn;

    $nombre = cleanInput($_POST['nombre'] ?? '');
    $apellido = cleanInput($_POST['apellido'] ?? '');
    $email = cleanInput($_POST['email'] ?? '');
    $password = cleanInput($_POST['password'] ?? '');
    $telefono = cleanInput($_POST['telefono'] ?? '');
    $rfc = cleanInput($_POST['rfc'] ?? '');
    $activo = cleanInput($_POST['activo'] ?? '1');

    // Validaciones
    if (empty($nombre) || empty($apellido) || empty($email) || empty($password)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }
    if (strlen($password) < 6) {
        jsonResponse(false, 'La contraseña debe tener al menos 6 caracteres');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'El formato del email no es válido');
    }
    if (!empty($rfc) && strlen($rfc) !== 13) {
        jsonResponse(false, 'El RFC debe tener 13 caracteres');
    }

    // Verificaciones de email / rfc (igual que antes)...
    $sql = "SELECT id FROM docente WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        jsonResponse(false, 'El email ya está registrado');
    }
    if (!empty($rfc)) {
        $sql = "SELECT id FROM docente WHERE rfc = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $rfc);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            jsonResponse(false, 'El RFC ya está registrado');
        }
    }

    // Insertar docente
    $conn->begin_transaction();
    try {
        $sql = "INSERT INTO docente (nombre, apellido, email, password, telefono, rfc, activo) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssi", $nombre, $apellido, $email, $password, $telefono, $rfc, $activo);
        if (!$stmt->execute()) {
            throw new Exception('Error al crear el docente');
        }

        $docenteId = $conn->insert_id;

        // Insertar materias si se enviaron
        if (!empty($_POST['materias']) && is_array($_POST['materias'])) {
            $sqlIns = "INSERT IGNORE INTO docente_materias (docente_id, materia_id) VALUES (?, ?)";
            $stmtIns = $conn->prepare($sqlIns);
            foreach ($_POST['materias'] as $m) {
                $mId = intval($m);
                if ($mId <= 0) continue;
                $stmtIns->bind_param("ii", $docenteId, $mId);
                $stmtIns->execute();
            }
        }
        $conn->commit();
        jsonResponse(true, 'Docente creado exitosamente');
    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(false, $e->getMessage());
    }
}

function updateDocente()
{
    global $conn;

    $id = cleanInput($_POST['docente_id'] ?? '');
    $nombre = cleanInput($_POST['nombre'] ?? '');
    $apellido = cleanInput($_POST['apellido'] ?? '');
    $email = cleanInput($_POST['email'] ?? '');
    $password = cleanInput($_POST['password'] ?? '');
    $telefono = cleanInput($_POST['telefono'] ?? '');
    $rfc = cleanInput($_POST['rfc'] ?? '');
    $activo = cleanInput($_POST['activo'] ?? '1');

    // Validaciones
    if (empty($id) || empty($nombre) || empty($apellido) || empty($email) || empty($password)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }

    // validar password (mínimo 6 caracteres)
    if (strlen($password) < 6) {
        jsonResponse(false, 'La contraseña debe tener al menos 6 caracteres');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'El formato del email no es válido');
    }

    if (!empty($rfc) && strlen($rfc) !== 13) {
        jsonResponse(false, 'El RFC debe tener 13 caracteres');
    }

    // Verificar si el email ya existe (excluyendo el docente actual)
    $sql = "SELECT id FROM docente WHERE email = ? AND id != ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $email, $id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        jsonResponse(false, 'El email ya está registrado por otro docente');
    }

    // Verificar si el RFC ya existe (excluyendo el docente actual)
    if (!empty($rfc)) {
        $sql = "SELECT id FROM docente WHERE rfc = ? AND id != ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $rfc, $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            jsonResponse(false, 'El RFC ya está registrado por otro docente');
        }
    }

    // Iniciar transacción para actualizar docente y materias
    $conn->begin_transaction();
    try {
        $sql = "UPDATE docente SET nombre = ?, apellido = ?, email = ?, password = ?, telefono = ?, rfc = ?, activo = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssii", $nombre, $apellido, $email, $password, $telefono, $rfc, $activo, $id);
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar el docente');
        }

        // Borrar asignaciones antiguas y agregar las nuevas (si llegan)
        $sqlDel = "DELETE FROM docente_materias WHERE docente_id = ?";
        $stmtDel = $conn->prepare($sqlDel);
        $stmtDel->bind_param("i", $id);
        $stmtDel->execute();
        if (!empty($_POST['materias']) && is_array($_POST['materias'])) {
            $sqlIns = "INSERT IGNORE INTO docente_materias (docente_id, materia_id) VALUES (?, ?)";
            $stmtIns = $conn->prepare($sqlIns);
            foreach ($_POST['materias'] as $m) {
                $mId = intval($m);
                if ($mId <= 0) continue;
                $stmtIns->bind_param("ii", $id, $mId);
                $stmtIns->execute();
            }
        }

        $conn->commit();
        jsonResponse(true, 'Docente actualizado exitosamente');
    } catch (Exception $e) {
        $conn->rollback();
        jsonResponse(false, $e->getMessage());
    }
}

function deleteDocente()
{
    global $conn;

    $id = cleanInput($_POST['id'] ?? '');

    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }

    // Obtener info del docente antes de eliminar
    $sql = "SELECT nombre, apellido, email FROM docente WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $docente = $stmt->get_result()->fetch_assoc();

    // Eliminar docente
    $sql = "DELETE FROM docente WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        jsonResponse(true, 'Docente eliminado exitosamente');
    } else {
        jsonResponse(false, 'Error al eliminar el docente');
    }
}

?>