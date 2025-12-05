<?php
require_once 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        listDocentes();
        break;
    case 'get':
        getDocente();
        break;
    case 'get_v1':
        getDocenteV1();
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
    case 'top':
        topDocentes();
        break;
    default:
        jsonResponse(false, 'Acción no válida');
}

function topDocentes()
{
    global $conn;
    $limit = intval($_GET['limit'] ?? 5);

    $sql = "SELECT d.id,
                   CONCAT(d.nombre, ' ', d.apellido) AS nombre,
                   COUNT(DISTINCT g.id) AS grupos,
                   d.turno AS turno,
                   COALESCE(SUM(TIME_TO_SEC(TIMEDIFF(h.hora_fin, h.hora_inicio))/3600), 0) AS horas
            FROM docente d
            LEFT JOIN grupos g ON g.profesor_id = d.id
            LEFT JOIN horarios h ON h.grupo_id = g.id
            WHERE d.activo = 1
            GROUP BY d.id
            ORDER BY horas DESC, grupos DESC
            LIMIT ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) jsonResponse(false, 'Error en la consulta: ' . $conn->error);
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $row['grupos'] = (int)$row['grupos'];
        $row['horas'] = (float)$row['horas'];
        $data[] = $row;
    }
    jsonResponse(true, 'Top docentes obtenidos', $data);
}

function listDocentes()
{
    global $conn;

    $search = cleanInput($_GET['search'] ?? '');
    $activo = cleanInput($_GET['activo'] ?? '');
    $materia_id = cleanInput($_GET['materia_id'] ?? '');

    $sql = "SELECT * FROM docente WHERE 1=1";

    if ($search) {
        $sql .= " AND (nombre LIKE '%$search%' OR apellido LIKE '%$search%' OR rfc LIKE '%$search%')";
    }

    if ($activo !== '') {
        $sql .= " AND activo = '$activo'";
    }

    if ($materia_id !== '') {
        $mid = intval($materia_id);
        if ($mid > 0) {
            // Filtrar docentes que están asignados a la materia indicada
            $sql .= " AND id IN (SELECT docente_id FROM docente_materias WHERE materia_id = $mid)";
        }
    }

    $sql .= " ORDER BY fecha_registro DESC";

    $result = $conn->query($sql);
    if (!$result) {
        jsonResponse(false, 'Error en la consulta de docentes');
    }

    $docentes = [];
    while ($row = $result->fetch_assoc()) {
        $docentes[] = $row;
    }

    jsonResponse(true, 'Docentes obtenidos exitosamente', $docentes);
}

function getDocente()
{
    global $conn;

    $id = $_GET['id'] ?? '';

    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
        return;
    }

    $id = intval($id);

    $sql = "SELECT * FROM docente WHERE id = {$id}";
    $result = $conn->query($sql);

    if ($result->num_rows === 0) {
        jsonResponse(false, 'Docente no encontrado');
        return;
    }

    $docente = $result->fetch_assoc();

    // Obtener materias asignadas
    $sql_materias = "SELECT materia_id FROM docente_materias WHERE docente_id = {$id}";
    $result_materias = $conn->query($sql_materias);

    $materias = [];
    while ($row = $result_materias->fetch_assoc()) {
        $materias[] = $row['materia_id'];
    }

    $docente['materias'] = $materias;

    jsonResponse(true, 'Docente obtenido', $docente);
}

function getDocenteV1()
{
    global $conn;
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
        return;
    }
    $id = intval($id);
    $sql = "SELECT d.*,
                   GROUP_CONCAT(dm.materia_id) AS materias
            FROM docente d
            LEFT JOIN docente_materias dm ON d.id = dm.docente_id
            WHERE d.id = ?
            GROUP BY d.id";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        jsonResponse(false, 'Error en la consulta: ' . $conn->error);
        return;
    }
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        jsonResponse(false, 'Docente no encontrado');
        return;
    }
    $docente = $result->fetch_assoc();

    // Normalizar materias a arreglo de enteros
    if (!empty($docente['materias'])) {
        $parts = array_filter(array_map('trim', explode(',', $docente['materias'])), function ($v) {
            return $v !== '';
        });
        $docente['materias'] = array_map('intval', $parts);
    } else {
        $docente['materias'] = [];
    }

    jsonResponse(true, 'Docente obtenido', $docente);
}


function getHorarioDocente()
{
    global $conn;

    $id = $_GET['id'] ?? '';

    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
        return;
    }

    $id = intval($id);

    $sql = "SELECT h.*,
            g.nombre as grupo_nombre,
            g.id as grupo_id,
            m.nombre as materia_nombre,
            m.codigo as materia_codigo,
            m.creditos,
            c.nombre as carrera_nombre,
            a.nombre as aula_nombre,
            a.edificio as aula_edificio,
            a.tipo as aula_tipo
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            JOIN materias m ON g.materia_id = m.id
            JOIN carreras c ON m.carrera_id = c.id
            JOIN aulas a ON h.aula_id = a.id
            WHERE g.profesor_id = {$id}
            ORDER BY 
                FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
                h.hora_inicio";

    $result = $conn->query($sql);
    $horarios = [];

    while ($row = $result->fetch_assoc()) {
        $horarios[] = $row;
    }

    jsonResponse(true, 'Horario obtenido', $horarios);
}

function createDocente()
{
    global $conn;

    $nombre = cleanInput($_POST['nombre'] ?? '');
    $apellido = cleanInput($_POST['apellido'] ?? '');
    $telefono = cleanInput($_POST['telefono'] ?? '');
    $rfc = cleanInput($_POST['rfc'] ?? '');
    $activo = cleanInput($_POST['activo'] ?? '1');
    $turno = cleanInput($_POST['turno'] ?? '');

    // Validaciones
    if (empty($nombre) || empty($apellido) || empty($turno)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }
    if (!empty($rfc) && strlen($rfc) !== 13) {
        jsonResponse(false, 'El RFC debe tener 13 caracteres');
    }

    $horas_min = 0;
    $horas_max = 0;
    if ($turno === 'medio') {
        $horas_min = 18;
        $horas_max = 20;
    } elseif ($turno === 'completo') {
        $horas_min = 20;
        $horas_max = 22;
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
        $sql = "INSERT INTO docente (nombre, apellido, telefono, rfc, activo, turno, horas_min_semana, horas_max_semana) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssisii", $nombre, $apellido, $telefono, $rfc, $activo, $turno, $horas_min, $horas_max);
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
    $telefono = cleanInput($_POST['telefono'] ?? '');
    $rfc = cleanInput($_POST['rfc'] ?? '');
    $activo = cleanInput($_POST['activo'] ?? '1');
    $turno = cleanInput($_POST['turno'] ?? '');


    // Validaciones
    if (empty($id) || empty($nombre) || empty($apellido)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }
    if (!empty($rfc) && strlen($rfc) !== 13) {
        jsonResponse(false, 'El RFC debe tener 13 caracteres');
    }

    $horas_min = 0;
    $horas_max = 0;
    if ($turno === 'medio') {
        $horas_min = 18;
        $horas_max = 20;
    } elseif ($turno === 'completo') {
        $horas_min = 20;
        $horas_max = 22;
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
        $sql = "UPDATE docente SET nombre = ?, apellido = ?, telefono = ?, rfc = ?, activo = ?, turno = ?, horas_min_semana = ?, horas_max_semana = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssisiii", $nombre, $apellido, $telefono, $rfc, $activo, $turno, $horas_min, $horas_max, $id);
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