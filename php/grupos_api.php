<?php
require_once 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        listGrupos();
        break;
    case 'get':
        getGrupo();
        break;
    case 'create':
    case 'update':
    case 'delete':
        if ($action === 'create') createGrupo();
        if ($action === 'update') updateGrupo();
        if ($action === 'delete') deleteGrupo();
        break;
    case 'generar':
        generarGrupos();
        break;
    default:
        jsonResponse(false, 'Acción no válida');
}

function listGrupos() {
    global $conn;

    $search = cleanInput($_GET['search'] ?? '');
    $carrera = cleanInput($_GET['carrera'] ?? '');
    $semestre = cleanInput($_GET['semestre'] ?? '');

    $where = "1=1";
    $params = [];
    $types = '';

    if ($search !== '') {
        $where .= " AND (g.nombre LIKE ? OR m.nombre LIKE ?)";
        $like = "%{$search}%";
        $params[] = $like;
        $params[] = $like;
        $types .= 'ss';
    }

    if ($carrera !== '') {
        // asegurar entero
        $where .= " AND m.carrera_id = ?";
        $params[] = (int)$carrera;
        $types .= 'i';
    }

    if ($semestre !== '') {
        $where .= " AND m.semestre = ?";
        $params[] = (int)$semestre;
        $types .= 'i';
    }


    $sql = "SELECT g.*, 
            m.nombre as materia_nombre,
            COALESCE(CONCAT_WS(' ', u.nombre, u.apellido), '') as profesor_nombre,
            g.alumnos_inscriptos as num_estudiantes
            FROM grupos g
            JOIN materias m ON g.materia_id = m.id
            LEFT JOIN docente u ON g.profesor_id = u.id
            WHERE $where
            ORDER BY g.periodo_academico DESC, m.nombre";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        jsonResponse(false, 'Error en la consulta: ' . $conn->error);
    }

    if (!empty($params)) {
        // bind_param requiere referencias
        $bind_names = [];
        $bind_names[] = $types;
        for ($i = 0; $i < count($params); $i++) {
            $bind_names[] = &$params[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);
    }

    if (!$stmt->execute()) {
        jsonResponse(false, 'Error al ejecutar la consulta');
    }

    $result = $stmt->get_result();
    $grupos = [];

    while ($row = $result->fetch_assoc()) {
        $grupos[] = $row;
    }

    jsonResponse(true, 'Grupos obtenidos exitosamente', $grupos);
}

function getGrupo() {
    global $conn;
    
    $id = cleanInput($_GET['id'] ?? '');
    
    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }
    
    $sql = "SELECT * FROM grupos WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(false, 'Grupo no encontrado');
    }
    
    $grupo = $result->fetch_assoc();
    jsonResponse(true, 'Grupo obtenido exitosamente', $grupo);
}

function createGrupo() {
    global $conn;
    
    $materia_id = cleanInput($_POST['materia_id'] ?? '');
    $profesor_id = cleanInput($_POST['profesor_id'] ?? '');
    $nombre = cleanInput($_POST['nombre'] ?? '');
    $cupo_maximo = cleanInput($_POST['cupo_maximo'] ?? '');
    $semestre_actual = cleanInput($_POST['semestre_actual'] ?? '');
    $periodo_academico = cleanInput($_POST['periodo_academico'] ?? '');
    $alumnos_inscriptos = cleanInput($_POST['alumnos_inscriptos'] ?? '');

    if (empty($materia_id) || empty($profesor_id) || empty($nombre) || empty($cupo_maximo) || empty($alumnos_inscriptos)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }

    if($alumnos_inscriptos > $cupo_maximo){
        jsonResponse(false, 'El número de alumnos inscritos no puede ser mayor que el cupo máximo');
    }
    
    $sql = "INSERT INTO grupos (materia_id, profesor_id, nombre, cupo_maximo, semestre_actual, periodo_academico, alumnos_inscriptos) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iisissi", $materia_id, $profesor_id, $nombre, $cupo_maximo, $semestre_actual, $periodo_academico, $alumnos_inscriptos);
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Grupo creado exitosamente');
    } else {
        jsonResponse(false, 'Error al crear el grupo');
    }
}

function updateGrupo() {
    global $conn;
    
    $id = cleanInput($_POST['grupo_id'] ?? '');
    $materia_id = cleanInput($_POST['materia_id'] ?? '');
    $profesor_id = cleanInput($_POST['profesor_id'] ?? '');
    $nombre = cleanInput($_POST['nombre'] ?? '');
    $cupo_maximo = cleanInput($_POST['cupo_maximo'] ?? '');
    $semestre_actual = cleanInput($_POST['semestre_actual'] ?? '');
    $periodo_academico = cleanInput($_POST['periodo_academico'] ?? '');
    $alumnos_inscriptos = cleanInput($_POST['alumnos_inscriptos'] ?? '');
    
    if (empty($id) || empty($materia_id) || empty($profesor_id) || empty($nombre) || empty($cupo_maximo) || empty($alumnos_inscriptos)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }

    if ($alumnos_inscriptos < 7){
        jsonResponse(false, 'El número de alumnos inscritos no puede ser menor que 7');
    }

    if ($alumnos_inscriptos > $cupo_maximo) {
        jsonResponse(false, 'El número de alumnos inscritos no puede ser mayor que el cupo máximo');
    }
    
    $sql = "UPDATE grupos SET materia_id = ?, profesor_id = ?, nombre = ?, cupo_maximo = ?, semestre_actual = ?, periodo_academico = ?, alumnos_inscriptos = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iisissii", $materia_id, $profesor_id, $nombre, $cupo_maximo, $semestre_actual, $periodo_academico, $alumnos_inscriptos, $id);
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Grupo actualizado exitosamente');
    } else {
        jsonResponse(false, 'Error al actualizar el grupo');
    }
}

function deleteGrupo() {
    global $conn;
    
    $id = cleanInput($_POST['id'] ?? '');
    
    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }
    
    $sql = "DELETE FROM grupos WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        jsonResponse(true, 'Grupo eliminado exitosamente');
    } else {
        jsonResponse(false, 'Error al eliminar el grupo');
    }
}

function generarGrupos()
{
    global $conn;

    $materia_id = cleanInput($_POST['materia_id'] ?? '');
    $numero_alumnos = cleanInput($_POST['numero_alumnos'] ?? '');
    $max_alumnos = cleanInput($_POST['max_alumnos'] ?? '');
    $min_alumnos = cleanInput($_POST['min_alumnos'] ?? 7);
    $periodo_academico = cleanInput($_POST['periodo_academico'] ?? '');
    $semestre_actual = cleanInput($_POST['semestre_actual'] ?? '');

    if (empty($materia_id) || empty($numero_alumnos) || empty($max_alumnos) || empty($periodo_academico) || empty($semestre_actual)) {
        jsonResponse(false, 'Todos los campos obligatorios deben ser completados');
    }

    // Obtener la informacion de la materia
    $sql = "SELECT * FROM materias WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $materia_id);
    $stmt->execute();
    $result_materia = $stmt->get_result();
    if ($result_materia->num_rows === 0) {
        jsonResponse(false, 'Materia no encontrada');
    }

    $iniciales_grupo = strtoupper(substr($result_materia->fetch_assoc()['nombre'], 0, 3));
    $iniciales_grupo .= '-';

    $map_grupo = [
        1 => 'A',
        2 => 'B',
        3 => 'C',
        4 => 'D',
        5 => 'E',
        6 => 'F',
        7 => 'G',
        8 => 'H',
        9 => 'I',
        10 => 'J',
    ];

    $numero_grupos_a_crear = ceil($numero_alumnos / $max_alumnos);
    $data = [];
    $grupo_omitido =[];

    for ($i = 1; $i <= $numero_grupos_a_crear; $i++) {

        $nombre_grupo = $iniciales_grupo . $map_grupo[$i];
        $alumnos_inscriptos = ($i < $numero_grupos_a_crear) ? $max_alumnos : ($numero_alumnos - ($max_alumnos * ($i - 1)));
        if ($alumnos_inscriptos < $min_alumnos) {
            $grupo_omitido[] = [
                'nombre_grupo' => $nombre_grupo,
                'alumnos_inscriptos' => $alumnos_inscriptos,
                'motivo' => 'No cumple con el mínimo de alumnos requerido'
            ];
            continue;
        }

        $sql = "INSERT INTO grupos (materia_id, nombre, cupo_maximo, alumnos_inscriptos, semestre_actual, periodo_academico) VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isiiss", $materia_id, $nombre_grupo, $max_alumnos, $alumnos_inscriptos, $semestre_actual, $periodo_academico);

        if (!$stmt->execute()) {
            jsonResponse(false, 'Error al crear el grupo ' . $nombre_grupo);
        }

        $data [] = [
            'grupo_id' => $stmt->insert_id,
            'nombre_grupo' => $nombre_grupo,
            'alumnos_inscriptos' => $alumnos_inscriptos
        ];
    }
    // Actualizar alumnos_inscriptos en la tabla materias
    $sql_update = "UPDATE materias SET alumnos_inscriptos =  ? WHERE id = ?";
    $stmt_update = $conn->prepare($sql_update);
    $var1 = true;
    $stmt_update->bind_param("si", $var1, $materia_id);
    $stmt_update->execute();

    $data_summary = [
        'grupos_creados' => $data,
        'grupos_omitidos' => $grupo_omitido
    ];

    jsonResponse(true, 'Grupos creados exitosamente', $data_summary);
}

?>
