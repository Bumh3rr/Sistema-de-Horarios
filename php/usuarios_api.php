<?php
require_once 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list_docentes_sin_registro':
        listDocentesSinRegistro();
        break;

    case 'list':
        getUsuarios();
        break;

    case 'create':
        crear();
        break;

    case 'delete':
        eliminar();
        break;

    case 'update':
        actualizar();
        break;

    case 'get':
        obtener();
        break;
    default:
        jsonResponse(false, 'Acción no válida');
}

// php/usuarios_api.php
function listDocentesSinRegistro()
{
    // Asegurarse de usar la conexión definida en config.php
    global $pdo, $conn, $mysqli;

    try {
        // Consulta que devuelve docentes que NO tienen un usuario asociado
        $sql = "SELECT d.id, d.nombre, d.apellido, d.telefono, d.rfc
                FROM docente d
                WHERE NOT EXISTS (
                    SELECT 1 FROM usuarios u WHERE u.docente_id = d.id
                )
                AND (d.isAccount = 0 OR d.isAccount IS NULL)
                ORDER BY d.apellido, d.nombre";

        $data = [];

        if (isset($pdo) && $pdo instanceof PDO) {
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif (isset($conn) && $conn instanceof mysqli) {
            $result = $conn->query($sql);
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
                $result->free();
            }
        } elseif (isset($mysqli) && $mysqli instanceof mysqli) {
            $result = $mysqli->query($sql);
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
                $result->free();
            }
        } else {
            // Si no hay conexión conocida
            jsonResponse(false, 'No se encontró una conexión a la base de datos');
            return;
        }

        jsonResponse(true, '', $data);
    } catch (Exception $e) {
        jsonResponse(false, 'Error al listar docentes: ' . $e->getMessage());
    }
}

function getUsuarios()
{
    global $conn;

    $search = cleanInput($_GET['search'] ?? '');
    $activo = cleanInput($_GET['activo'] ?? '');

    $where = "1=1";
    $params = [];
    $types = '';

    if ($search !== '') {
        $where .= " AND (u.email LIKE ? OR CONCAT_WS(' ', d.nombre, d.apellido) LIKE ?)";
        $likeSearch = '%' . $search . '%';
        $params[] = $likeSearch;
        $params[] = $likeSearch;
        $types .= 'ss';
    }

    if ($activo !== '') {
        $where .= " AND u.activo = ?";
        $params[] = ($activo === '1') ? 1 : 0;
        $types .= 'i';
    }

    $sql = "SELECT u.*, 
            CONCAT_WS(' ', d.nombre, d.apellido) as docente_nombre
            FROM usuarios u
            LEFT JOIN docente d ON u.docente_id = d.id
            WHERE $where
            ORDER BY d.apellido, d.nombre";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        jsonResponse(false, 'Error en la consulta: ' . $conn->error);
        return;
    }

    if (!empty($params)) {
        $bind_names = [];
        $bind_names[] = $types;
        for ($i = 0; $i < count($params); $i++) {
            $bind_names[] = &$params[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);
    }

    if (!$stmt->execute()) {
        jsonResponse(false, 'Error al ejecutar la consulta');
        return;
    }

    $result = $stmt->get_result();
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    jsonResponse(true, '', $data);
}

function crear()
{
    global $conn;

    $docente_id = cleanInput($_POST['docente_id'] ?? '');
    $email = cleanInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $passwordConfirm = $_POST['passwordConfirm'] ?? '';
    $rol = cleanInput($_POST['rol'] ?? 'docente');
    $activo = cleanInput($_POST['activo'] ?? 0);

    if (empty($docente_id) || empty($email) || empty($password) || empty($passwordConfirm)) {
        jsonResponse(false, 'Faltan datos obligatorios');
        return;
    }

    if (!filter_var($docente_id, FILTER_VALIDATE_INT)) {
        jsonResponse(false, 'El ID del docente no es válido');
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'El email no es válido');
        return;
    }

    if ($password !== $passwordConfirm) {
        jsonResponse(false, 'Las contraseñas no coinciden');
        return;
    }

    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        jsonResponse(false, 'El email ya está registrado');
        return;
    }
    $stmt->close();

    $hashedPassword = $password;

    $conn->begin_transaction();

    $insertStmt = $conn->prepare("INSERT INTO usuarios (docente_id, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)");
    if (!$insertStmt) {
        $conn->rollback();
        jsonResponse(false, 'Error al preparar la inserción de usuario');
        return;
    }
    $insertStmt->bind_param('isssi', $docente_id, $email, $hashedPassword, $rol, $activo);

    if (!$insertStmt->execute()) {
        $insertStmt->close();
        $conn->rollback();
        jsonResponse(false, 'Error al crear el usuario: ' . $insertStmt->error);
        return;
    }
    $insertStmt->close();

    $updateStmt = $conn->prepare("UPDATE docente SET isAccount = 1 WHERE id = ?");
    if (!$updateStmt) {
        $conn->rollback();
        jsonResponse(false, 'Error al preparar la actualización del docente');
        return;
    }
    $updateStmt->bind_param('i', $docente_id);

    if (!$updateStmt->execute() || $updateStmt->affected_rows === 0) {
        $updateStmt->close();
        $conn->rollback();
        jsonResponse(false, 'No se pudo actualizar el docente');
        return;
    }
    $updateStmt->close();

    if ($conn->commit()) {
        jsonResponse(true, 'Usuario creado exitosamente');
    } else {
        $conn->rollback();
        jsonResponse(false, 'Error al confirmar la transacción');
    }
}

function eliminar()
{
    global $conn;

    $usuario_id = cleanInput($_POST['id'] ?? '');

    if (empty($usuario_id) || !filter_var($usuario_id, FILTER_VALIDATE_INT)) {
        jsonResponse(false, 'ID de usuario no válido');
        return;
    }

    $docente_id = null;
    $stmt = $conn->prepare("SELECT docente_id FROM usuarios WHERE id = ?");
    $stmt->bind_param('i', $usuario_id);
    $stmt->execute();
    $stmt->bind_result($docente_id);
    if (!$stmt->fetch()) {
        $stmt->close();
        jsonResponse(false, 'Usuario no encontrado');
        return;
    }
    $stmt->close();

    $conn->begin_transaction();

    $deleteStmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    if (!$deleteStmt) {
        $conn->rollback();
        jsonResponse(false, 'Error al preparar la eliminación del usuario');
        return;
    }
    $deleteStmt->bind_param('i', $usuario_id);

    if (!$deleteStmt->execute()) {
        $deleteStmt->close();
        $conn->rollback();
        jsonResponse(false, 'Error al eliminar el usuario: ' . $deleteStmt->error);
        return;
    }
    $deleteStmt->close();

    $updateStmt = $conn->prepare("UPDATE docente SET isAccount = 0 WHERE id = ?");
    if (!$updateStmt) {
        $conn->rollback();
        jsonResponse(false, 'Error al preparar la actualización del docente');
        return;
    }
    $updateStmt->bind_param('i', $docente_id);

    if (!$updateStmt->execute() || $updateStmt->affected_rows === 0) {
        $updateStmt->close();
        $conn->rollback();
        jsonResponse(false, 'No se pudo actualizar el docente');
        return;
    }
    $updateStmt->close();

    if ($conn->commit()) {
        jsonResponse(true, 'Usuario eliminado exitosamente');
    } else {
        $conn->rollback();
        jsonResponse(false, 'Error al confirmar la transacción');
    }
}

function obtener()
{
    global $conn;

    $usuario_id = cleanInput($_GET['id'] ?? '');

    if (empty($usuario_id) || !filter_var($usuario_id, FILTER_VALIDATE_INT)) {
        jsonResponse(false, 'ID de usuario no válido');
        return;
    }

    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->bind_param('i', $usuario_id);
    if (!$stmt->execute()) {
        jsonResponse(false, 'Error al ejecutar la consulta');
        return;
    }

    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        jsonResponse(false, 'Usuario no encontrado');
        return;
    }

    $data = $result->fetch_assoc();
    jsonResponse(true, '', $data);
}

function actualizar()
{
    global $conn;

    $usuario_id = cleanInput($_POST['usuario_id'] ?? '');
    $email = cleanInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $passwordConfirm = $_POST['passwordConfirm'] ?? '';
    $activo = cleanInput($_POST['activo'] ?? 0);

    if (empty($usuario_id) || !filter_var($usuario_id, FILTER_VALIDATE_INT)) {
        jsonResponse(false, 'ID de usuario no válido');
        return;
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'El email no es válido');
        return;
    }

    if (!empty($password) && $password !== $passwordConfirm) {
        jsonResponse(false, 'Las contraseñas no coinciden');
        return;
    }

    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
    $stmt->bind_param('si', $email, $usuario_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        jsonResponse(false, 'El email ya está registrado por otro usuario');
        return;
    }
    $stmt->close();

    if (!empty($password)) {
        $hashedPassword = $password;
        $updateStmt = $conn->prepare("UPDATE usuarios SET email = ?, password = ?, activo = ? WHERE id = ?");
        $updateStmt->bind_param('ssii', $email, $hashedPassword, $activo, $usuario_id);
    } else {
        $updateStmt = $conn->prepare("UPDATE usuarios SET email = ?, activo = ? WHERE id = ?");
        $updateStmt->bind_param('sii', $email, $activo, $usuario_id);
    }

    if (!$updateStmt->execute()) {
        $updateStmt->close();
        jsonResponse(false, 'Error al actualizar el usuario: ' . $updateStmt->error);
        return;
    }
    $updateStmt->close();

    jsonResponse(true, 'Usuario actualizado exitosamente');
}
?>
