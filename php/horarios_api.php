<?php
require_once 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        listHorarios();
        break;
    case 'schedule':
        getSchedule();
        break;
    case 'check_availability':
        checkAvailability();
        break;
    case 'create':
        createHorario();
        break;
    case 'delete':
        deleteHorario();
        break;
    case 'get_disponibilidad':
        getDisponibilidad();
        break;
    case 'validate_horario':
        validateHorario();
        break;

    case 'verificar_creditos':
        verificarCreditos();
        break;
    default:
        jsonResponse(false, 'Acción no válida');
}

/**
 * Verificar si el grupo puede tener más horarios según sus créditos
 */
function verificarCreditos() {
    global $conn;

    $grupo_id = cleanInput($_GET['grupo_id'] ?? '');

    if (empty($grupo_id)) {
        jsonResponse(false, 'ID de grupo no proporcionado');
    }

    $sql = "SELECT m.creditos, m.nombre as materia_nombre, 
            COUNT(h.id) as horas_asignadas
            FROM materias m
            JOIN grupos g ON m.id = g.materia_id
            LEFT JOIN horarios h ON g.id = h.grupo_id
            WHERE g.id = ?
            GROUP BY m.id, m.creditos, m.nombre";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $grupo_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $info = $result->fetch_assoc();

    if ($info) {
        $creditos = $info['creditos'];
        $horas_asignadas = $info['horas_asignadas'];
        $horas_maximas = $creditos;
        $puede_agregar = $horas_asignadas < $horas_maximas;

        $mensaje = $puede_agregar
            ? "Puedes agregar más horarios ({$horas_asignadas}/{$horas_maximas} horas asignadas)"
            : "Esta materia ya tiene {$horas_asignadas}/{$horas_maximas} horas asignadas (máximo según créditos)";

        jsonResponse(true, $mensaje, [
            'creditos' => $creditos,
            'horas_asignadas' => $horas_asignadas,
            'horas_maximas' => $horas_maximas,
            'puede_agregar' => $puede_agregar,
            'mensaje' => $mensaje
        ]);
    } else {
        jsonResponse(false, 'Grupo no encontrado');
    }
}

/**
 * Listar todos los horarios con filtros
 */
function listHorarios() {
    global $conn;

    $grupo = cleanInput($_GET['grupo'] ?? '');
    $carrera = cleanInput($_GET['carrera'] ?? '');
    $semestre = cleanInput($_GET['semestre'] ?? '');
    $aula = cleanInput($_GET['aula'] ?? '');

    $sql = "SELECT h.*, 
            g.nombre as grupo_nombre,
            m.nombre as materia_nombre,
            m.semestre,
            m.carrera_id,
            c.nombre as carrera_nombre,
            CONCAT(d.nombre, ' ', d.apellido) as profesor_nombre,
            d.turno as profesor_turno,
            a.nombre as aula_nombre,
            a.edificio as aula_edificio,
            a.tipo as aula_tipo
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            JOIN materias m ON g.materia_id = m.id
            JOIN carreras c ON m.carrera_id = c.id
            LEFT JOIN docente d ON g.profesor_id = d.id
            JOIN aulas a ON h.aula_id = a.id
            WHERE 1=1";

    if ($grupo) {
        $sql .= " AND h.grupo_id = " . intval($grupo);
    }

    if ($carrera) {
        $sql .= " AND m.carrera_id = " . intval($carrera);
    }

    if ($semestre) {
        $sql .= " AND m.semestre = " . intval($semestre);
    }

    if ($aula) {
        $sql .= " AND h.aula_id = " . intval($aula);
    }

    $sql .= " ORDER BY 
              FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
              h.hora_inicio";

    $result = $conn->query($sql);
    $horarios = [];

    while ($row = $result->fetch_assoc()) {
        $horarios[] = $row;
    }

    jsonResponse(true, 'Horarios obtenidos exitosamente', $horarios);
}

/**
 * Obtener el horario en formato de cuadrícula
 */
function getSchedule() {
    global $conn;

    $grupo = cleanInput($_GET['grupo'] ?? '');
    $carrera = cleanInput($_GET['carrera'] ?? '');
    $semestre = cleanInput($_GET['semestre'] ?? '');

    $sql = "SELECT h.*,
            g.nombre as grupo_nombre,
            g.id as grupo_id,
            m.nombre as materia_nombre,
            m.codigo as materia_codigo,
            CONCAT(d.nombre, ' ', d.apellido) as profesor_nombre,
            a.nombre as aula_nombre,
            a.edificio as aula_edificio
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            JOIN materias m ON g.materia_id = m.id
            LEFT JOIN docente d ON g.profesor_id = d.id
            JOIN aulas a ON h.aula_id = a.id
            WHERE 1=1";

    if ($grupo) {
        $sql .= " AND h.grupo_id = " . intval($grupo);
    }

    if ($carrera) {
        $sql .= " AND m.carrera_id = " . intval($carrera);
    }

    if ($semestre) {
        $sql .= " AND m.semestre = " . intval($semestre);
    }

    $result = $conn->query($sql);
    $horarios = [];

    while ($row = $result->fetch_assoc()) {
        $horarios[] = $row;
    }

    jsonResponse(true, 'Horario obtenido exitosamente', $horarios);
}

/**
 * Verificar disponibilidad de aula y profesor antes de asignar
 */
function checkAvailability() {
    global $conn;

    $aula_id = cleanInput($_GET['aula_id'] ?? '');
    $grupo_id = cleanInput($_GET['grupo_id'] ?? '');
    $dia_semana = cleanInput($_GET['dia_semana'] ?? '');
    $hora_inicio = cleanInput($_GET['hora_inicio'] ?? '');
    $hora_fin = cleanInput($_GET['hora_fin'] ?? '');
    $horario_id = cleanInput($_GET['horario_id'] ?? ''); // Para edición

    if (empty($aula_id) || empty($grupo_id) || empty($dia_semana) || empty($hora_inicio) || empty($hora_fin)) {
        jsonResponse(false, 'Faltan datos requeridos');
    }

    $conflictos = [];

    // Verificar conflicto de aula
    $sql = "SELECT h.*, g.nombre as grupo_nombre, m.nombre as materia_nombre
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            JOIN materias m ON g.materia_id = m.id
            WHERE h.aula_id = ?
            AND h.dia_semana = ?
            AND (
                (h.hora_inicio < ? AND h.hora_fin > ?) OR
                (h.hora_inicio < ? AND h.hora_fin > ?) OR
                (h.hora_inicio >= ? AND h.hora_fin <= ?)
            )";

    if (!empty($horario_id)) {
        $sql .= " AND h.id != " . intval($horario_id);
    }

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isssssss", $aula_id, $dia_semana, $hora_fin, $hora_inicio, $hora_fin, $hora_fin, $hora_inicio, $hora_fin);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $conflictos[] = [
                'tipo' => 'aula',
                'mensaje' => "El aula ya está ocupada por el grupo {$row['grupo_nombre']} ({$row['materia_nombre']}) de {$row['hora_inicio']} a {$row['hora_fin']}"
            ];
        }
    }

    // Obtener el profesor del grupo
    $sql_prof = "SELECT profesor_id FROM grupos WHERE id = ?";
    $stmt_prof = $conn->prepare($sql_prof);
    $stmt_prof->bind_param("i", $grupo_id);
    $stmt_prof->execute();
    $result_prof = $stmt_prof->get_result();
    $grupo = $result_prof->fetch_assoc();

    if ($grupo && $grupo['profesor_id']) {
        $profesor_id = $grupo['profesor_id'];

        // Verificar conflicto de profesor
        $sql = "SELECT h.*, g.nombre as grupo_nombre, m.nombre as materia_nombre,
                CONCAT(d.nombre, ' ', d.apellido) as profesor_nombre
                FROM horarios h
                JOIN grupos g ON h.grupo_id = g.id
                JOIN materias m ON g.materia_id = m.id
                JOIN docente d ON g.profesor_id = d.id
                WHERE g.profesor_id = ?
                AND h.dia_semana = ?
                AND (
                    (h.hora_inicio < ? AND h.hora_fin > ?) OR
                    (h.hora_inicio < ? AND h.hora_fin > ?) OR
                    (h.hora_inicio >= ? AND h.hora_fin <= ?)
                )";

        if (!empty($horario_id)) {
            $sql .= " AND h.id != " . intval($horario_id);
        }

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssssss", $profesor_id, $dia_semana, $hora_fin, $hora_inicio, $hora_fin, $hora_fin, $hora_inicio, $hora_fin);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $conflictos[] = [
                    'tipo' => 'profesor',
                    'mensaje' => "El profesor {$row['profesor_nombre']} ya tiene asignado el grupo {$row['grupo_nombre']} ({$row['materia_nombre']}) de {$row['hora_inicio']} a {$row['hora_fin']}"
                ];
            }
        }

        // Verificar carga horaria del profesor
        $carga = verificarCargaProfesor($profesor_id, $grupo_id, $hora_inicio, $hora_fin, $horario_id);
        if (!$carga['valido']) {
            $conflictos[] = [
                'tipo' => 'carga_horaria',
                'mensaje' => $carga['mensaje']
            ];
        }
    }

    if (count($conflictos) > 0) {
        jsonResponse(false, 'Se encontraron conflictos', ['conflictos' => $conflictos]);
    } else {
        jsonResponse(true, 'No hay conflictos, el horario está disponible');
    }
}

/**
 * Verificar la carga horaria del profesor
 */
function verificarCargaProfesor($profesor_id, $grupo_id_nuevo, $hora_inicio, $hora_fin, $horario_id_excluir = null) {
    global $conn;

    // Obtener información del profesor
    $sql = "SELECT turno, horas_min_semana, horas_max_semana FROM docente WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $profesor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $profesor = $result->fetch_assoc();

    if (!$profesor) {
        return ['valido' => false, 'mensaje' => 'Profesor no encontrado'];
    }

    // Calcular horas actuales del profesor
    $sql = "SELECT h.hora_inicio, h.hora_fin
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            WHERE g.profesor_id = ?";

    if ($horario_id_excluir) {
        $sql .= " AND h.id != " . intval($horario_id_excluir);
    }

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $profesor_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $horas_actuales = 0;
    while ($row = $result->fetch_assoc()) {
        $inicio = strtotime($row['hora_inicio']);
        $fin = strtotime($row['hora_fin']);
        $horas_actuales += ($fin - $inicio) / 3600;
    }

    // Calcular horas del nuevo horario
    $inicio_nuevo = strtotime($hora_inicio);
    $fin_nuevo = strtotime($hora_fin);
    $horas_nuevo = ($fin_nuevo - $inicio_nuevo) / 3600;

    $horas_totales = $horas_actuales + $horas_nuevo;

    if ($horas_totales < $profesor['horas_min_semana']) {
        return [
            'valido' => true,
            'mensaje' => "El profesor tiene {$horas_actuales} horas asignadas. Con este horario tendrá {$horas_totales} horas (Mínimo: {$profesor['horas_min_semana']})"
        ];
    } elseif ($horas_totales > $profesor['horas_max_semana']) {
        return [
            'valido' => false,
            'mensaje' => "El profesor excedería su carga máxima. Tiene {$horas_actuales} horas y el máximo es {$profesor['horas_max_semana']} horas semanales. Este horario agregaría {$horas_nuevo} horas más."
        ];
    } else {
        return [
            'valido' => true,
            'mensaje' => "El profesor tiene {$horas_actuales} horas asignadas. Con este horario tendrá {$horas_totales} horas (entre {$profesor['horas_min_semana']} y {$profesor['horas_max_semana']} horas)"
        ];
    }
}

/**
 * Obtener disponibilidad de aulas y profesores para un horario específico
 */
function getDisponibilidad() {
    global $conn;

    $dia_semana = cleanInput($_GET['dia_semana'] ?? '');
    $hora_inicio = cleanInput($_GET['hora_inicio'] ?? '');
    $hora_fin = cleanInput($_GET['hora_fin'] ?? '');

    if (empty($dia_semana) || empty($hora_inicio) || empty($hora_fin)) {
        jsonResponse(false, 'Faltan datos requeridos');
    }

    // Aulas disponibles
    $sql_aulas = "SELECT a.id, a.nombre, a.edificio, a.tipo, a.capacidad
                  FROM aulas a
                  WHERE a.activo = 1
                  AND a.id NOT IN (
                      SELECT h.aula_id
                      FROM horarios h
                      WHERE h.dia_semana = ?
                      AND (
                          (h.hora_inicio < ? AND h.hora_fin > ?) OR
                          (h.hora_inicio < ? AND h.hora_fin > ?) OR
                          (h.hora_inicio >= ? AND h.hora_fin <= ?)
                      )
                  )
                  ORDER BY a.edificio, a.nombre";

    $stmt = $conn->prepare($sql_aulas);
    $stmt->bind_param("sssssss", $dia_semana, $hora_fin, $hora_inicio, $hora_fin, $hora_fin, $hora_inicio, $hora_fin);
    $stmt->execute();
    $result = $stmt->get_result();

    $aulas_disponibles = [];
    while ($row = $result->fetch_assoc()) {
        $aulas_disponibles[] = $row;
    }

    // Profesores disponibles
    $sql_profesores = "SELECT d.id, CONCAT(d.nombre, ' ', d.apellido) as nombre, d.turno
                       FROM docente d
                       WHERE d.activo = 1
                       AND d.id NOT IN (
                           SELECT g.profesor_id
                           FROM horarios h
                           JOIN grupos g ON h.grupo_id = g.id
                           WHERE h.dia_semana = ?
                           AND g.profesor_id IS NOT NULL
                           AND (
                               (h.hora_inicio < ? AND h.hora_fin > ?) OR
                               (h.hora_inicio < ? AND h.hora_fin > ?) OR
                               (h.hora_inicio >= ? AND h.hora_fin <= ?)
                           )
                       )
                       ORDER BY d.apellido, d.nombre";

    $stmt = $conn->prepare($sql_profesores);
    $stmt->bind_param("sssssss", $dia_semana, $hora_fin, $hora_inicio, $hora_fin, $hora_fin, $hora_inicio, $hora_fin);
    $stmt->execute();
    $result = $stmt->get_result();

    $profesores_disponibles = [];
    while ($row = $result->fetch_assoc()) {
        $profesores_disponibles[] = $row;
    }

    jsonResponse(true, 'Disponibilidad obtenida', [
        'aulas' => $aulas_disponibles,
        'profesores' => $profesores_disponibles
    ]);
}

/**
 * Validar horario completo antes de crear
 */
function validateHorario() {
    global $conn;

    $grupo_id = cleanInput($_POST['grupo_id'] ?? '');
    $aula_id = cleanInput($_POST['aula_id'] ?? '');
    $dia_semana = cleanInput($_POST['dia_semana'] ?? '');
    $hora_inicio = cleanInput($_POST['hora_inicio'] ?? '');
    $hora_fin = cleanInput($_POST['hora_fin'] ?? '');

    $errores = [];

    // Validar campos requeridos
    if (empty($grupo_id)) $errores[] = 'Debe seleccionar un grupo';
    if (empty($aula_id)) $errores[] = 'Debe seleccionar un aula';
    if (empty($dia_semana)) $errores[] = 'Debe seleccionar un día';
    if (empty($hora_inicio)) $errores[] = 'Debe especificar hora de inicio';
    if (empty($hora_fin)) $errores[] = 'Debe especificar hora de fin';

    if (count($errores) > 0) {
        jsonResponse(false, 'Datos incompletos', ['errores' => $errores]);
    }

    // Validar horario institucional (7:00 - 15:00)
    $hora_inicio_time = strtotime($hora_inicio);
    $hora_fin_time = strtotime($hora_fin);
    $hora_limite_inicio = strtotime('07:00:00');
    $hora_limite_fin = strtotime('15:00:00');

    if ($hora_inicio_time < $hora_limite_inicio) {
        $errores[] = 'El horario institucional inicia a las 7:00 AM';
    }

    if ($hora_fin_time > $hora_limite_fin) {
        $errores[] = 'El horario institucional termina a las 3:00 PM';
    }

    if ($hora_inicio_time >= $hora_fin_time) {
        $errores[] = 'La hora de fin debe ser mayor que la hora de inicio';
    }

    // Validar duración mínima y máxima
    $duracion = ($hora_fin_time - $hora_inicio_time) / 3600;
    if ($duracion < 1) {
        $errores[] = 'La clase debe durar al menos 1 hora';
    }
    if ($duracion > 4) {
        $errores[] = 'La clase no puede durar más de 4 horas';
    }

    if (count($errores) > 0) {
        jsonResponse(false, 'Validación fallida', ['errores' => $errores]);
    }

    jsonResponse(true, 'Validación exitosa');
}

/**
 * Crear nuevo horario con validaciones completas
 */
function createHorario() {
    global $conn;

    $grupo_id = cleanInput($_POST['grupo_id'] ?? '');
    $aula_id = cleanInput($_POST['aula_id'] ?? '');
    $dia_semana = cleanInput($_POST['dia_semana'] ?? '');
    $hora_inicio = cleanInput($_POST['hora_inicio'] ?? '');
    $hora_fin = cleanInput($_POST['hora_fin'] ?? '');

    // Validaciones básicas
    if (empty($grupo_id) || empty($aula_id) || empty($dia_semana) || empty($hora_inicio) || empty($hora_fin)) {
        jsonResponse(false, 'Todos los campos son obligatorios');
    }

    // Validar horario institucional
    $hora_inicio_time = strtotime($hora_inicio);
    $hora_fin_time = strtotime($hora_fin);
    $hora_limite_inicio = strtotime('07:00:00');
    $hora_limite_fin = strtotime('15:00:00');

    $hora_inicio_recreo = strtotime('10:00:00');
    $hora_fin_recreo = strtotime('11:00:00');

    $duracion = ($hora_fin_time - $hora_inicio_time) / 3600;
    if ($duracion != 1) {
        jsonResponse(false, 'Cada clase debe durar exactamente 1 hora');
    }

    if ($hora_inicio_time < $hora_limite_inicio || $hora_fin_time > $hora_limite_fin) {
        jsonResponse(false, 'El horario debe estar entre las 7:00 AM y 3:00 PM');
    }

    if ($hora_inicio_time >= $hora_fin_time) {
        jsonResponse(false, 'La hora de fin debe ser mayor que la hora de inicio');
    }

    if ($hora_inicio_time >= $hora_inicio_recreo && $hora_fin_time <= $hora_fin_recreo) {
        jsonResponse(false, 'No se pueden programar clases durante el recreo (10:00 AM - 11:00 AM)');
    }

    $sql_creditos = "SELECT m.creditos, m.nombre as materia_nombre, 
                 COUNT(h.id) as horas_asignadas
                 FROM materias m
                 JOIN grupos g ON m.id = g.materia_id
                 LEFT JOIN horarios h ON g.id = h.grupo_id
                 WHERE g.id = ?
                 GROUP BY m.id, m.creditos, m.nombre";

    $stmt_creditos = $conn->prepare($sql_creditos);
    $stmt_creditos->bind_param("i", $grupo_id);
    $stmt_creditos->execute();
    $result_creditos = $stmt_creditos->get_result();
    $info_materia = $result_creditos->fetch_assoc();

    if ($info_materia) {
        $creditos = $info_materia['creditos'];
        $horas_asignadas = $info_materia['horas_asignadas'];
        $materia_nombre = $info_materia['materia_nombre'];

        // Los créditos determinan las horas semanales permitidas
        // 4 créditos = 4 horas/semana (4 días)
        // 5 créditos = 5 horas/semana (5 días)
        $horas_maximas = $creditos;

        if ($horas_asignadas >= $horas_maximas) {
            jsonResponse(false, "La materia '{$materia_nombre}' tiene {$creditos} créditos y ya tiene asignadas {$horas_asignadas} horas a la semana. No se pueden agregar más horarios.");
        }
    }

    // Verificar conflicto de aula
    $sql = "SELECT h.*, g.nombre as grupo_nombre
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            WHERE h.aula_id = ?
            AND h.dia_semana = ?
            AND (
                (h.hora_inicio < ? AND h.hora_fin > ?) OR
                (h.hora_inicio < ? AND h.hora_fin > ?) OR
                (h.hora_inicio >= ? AND h.hora_fin <= ?)
            )";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isssssss", $aula_id, $dia_semana, $hora_fin, $hora_inicio, $hora_fin, $hora_fin, $hora_inicio, $hora_fin);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $conflicto = $result->fetch_assoc();
        jsonResponse(false, "El aula ya está ocupada en ese horario por el grupo {$conflicto['grupo_nombre']}");
    }

    // Verificar conflicto de profesor
    $sql = "SELECT COUNT(*) as conflictos
            FROM horarios h
            JOIN grupos g ON h.grupo_id = g.id
            WHERE g.profesor_id = (SELECT profesor_id FROM grupos WHERE id = ?)
            AND h.dia_semana = ?
            AND (
                (h.hora_inicio < ? AND h.hora_fin > ?) OR
                (h.hora_inicio < ? AND h.hora_fin > ?) OR
                (h.hora_inicio >= ? AND h.hora_fin <= ?)
            )";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isssssss", $grupo_id, $dia_semana, $hora_fin, $hora_inicio, $hora_fin, $hora_fin, $hora_inicio, $hora_fin);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if ($result['conflictos'] > 0) {
        jsonResponse(false, 'El profesor ya tiene una clase asignada en ese horario');
    }

    // Verificar carga horaria del profesor
    $sql_prof = "SELECT profesor_id FROM grupos WHERE id = ?";
    $stmt_prof = $conn->prepare($sql_prof);
    $stmt_prof->bind_param("i", $grupo_id);
    $stmt_prof->execute();
    $result_prof = $stmt_prof->get_result();
    $grupo = $result_prof->fetch_assoc();

    if ($grupo && $grupo['profesor_id']) {
        $carga = verificarCargaProfesor($grupo['profesor_id'], $grupo_id, $hora_inicio, $hora_fin);
        if (!$carga['valido']) {
            jsonResponse(false, $carga['mensaje']);
        }
    }

    // Insertar horario
    $sql = "INSERT INTO horarios (grupo_id, aula_id, dia_semana, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iisss", $grupo_id, $aula_id, $dia_semana, $hora_inicio, $hora_fin);

    if ($stmt->execute()) {
        jsonResponse(true, 'Horario asignado exitosamente');
    } else {
        jsonResponse(false, 'Error al asignar el horario: ' . $conn->error);
    }
}

/**
 * Eliminar horario
 */
function deleteHorario() {
    global $conn;

    $id = cleanInput($_POST['id'] ?? '');

    if (empty($id)) {
        jsonResponse(false, 'ID no proporcionado');
    }

    $sql = "DELETE FROM horarios WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        jsonResponse(true, 'Horario eliminado exitosamente');
    } else {
        jsonResponse(false, 'Error al eliminar el horario');
    }
}
?>