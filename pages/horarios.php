<?php
require_once '../php/config.php';
requireLogin();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Horarios</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/styles-modal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
    <style>
        /* Estilos adicionales para el grid de horarios */
        .schedule-grid {
            display: grid;
            grid-template-columns: 100px repeat(5, 1fr);
            gap: 1px;
            background: #ddd;
            border: 1px solid #ddd;
            margin-bottom: 20px;
        }

        .schedule-header {
            background: var(--primary-color);
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
        }

        .schedule-time {
            background: #f8f9fa;
            padding: 12px;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .schedule-cell {
            background: white;
            padding: 8px;
            min-height: 60px;
            position: relative;
            transition: background-color 0.2s;
        }

        .schedule-cell:hover {
            background: #f8f9fa;
        }

        .schedule-cell.occupied {
            background: #e8f4ff;
            cursor: pointer;
        }

        .schedule-item {
            font-size: 12px;
            line-height: 1.4;
            padding: 6px;
            border-left: 3px solid var(--primary-color);
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            height: 100%;
        }

        .schedule-item:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
        }

        .schedule-item strong {
            color: var(--primary-color);
            display: block;
            margin-bottom: 4px;
        }

        .schedule-item small {
            display: block;
            color: #666;
            margin-bottom: 2px;
        }

        .schedule-item small.text-muted {
            color: #999;
            font-style: italic;
        }

        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            border: 1px solid transparent;
        }

        .alert-success {
            background-color: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
        }

        .alert-danger {
            background-color: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }

        .alert-warning {
            background-color: #fff3cd;
            border-color: #ffeaa7;
            color: #856404;
        }

        .alert-info {
            background-color: #d1ecf1;
            border-color: #bee5eb;
            color: #0c5460;
        }

        #form-validation {
            margin-top: 16px;
        }

        #profesor-info {
            margin-bottom: 16px;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .badge-success {
            background: #28a745;
            color: white;
        }

        .badge-warning {
            background: #ffc107;
            color: #212529;
        }

        .legend {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }

        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            text-align: center;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 14px;
            color: #666;
        }

        .time-info {
            font-size: 13px;
            color: #666;
            margin-top: 8px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid var(--primary-color);
        }

        #hora_fin {
            cursor: not-allowed;
            background-color: #f8f9fa !important;
        }

        #hora_fin:disabled {
            opacity: 0.6;
        }


        .schedule-cell {
            background: white;
            padding: 4px;
            min-height: 60px;
            position: relative;
            transition: background-color 0.2s;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .schedule-cell:hover {
            background: #f8f9fa;
        }

        .schedule-cell.occupied {
            background: #e8f4ff;
            cursor: pointer;
        }

        .schedule-item {
            font-size: 11px;
            line-height: 1.3;
            padding: 6px;
            border-left: 3px solid var(--primary-color);
            background: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            width: 100%;
            box-sizing: border-box;
        }

        .schedule-item:hover {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
        }

        .schedule-item strong {
            color: var(--primary-color);
            display: block;
            margin-bottom: 3px;
            font-size: 12px;
        }

        .schedule-item small {
            display: block;
            color: #666;
            margin-bottom: 2px;
            line-height: 1.2;
        }

        .schedule-item small.text-muted {
            color: #999;
            font-style: italic;
            font-size: 10px;
        }
    </style>
</head>
<body>
<div class="dashboard">
    <?php include './components/sidebar.php'; ?>
    <?php include './components/loading.php'; ?>
    <?php include './components/modal-success.php'; ?>
    <?php include './components/modal-warning.php'; ?>
    <?php include './components/modal-info.php'; ?>

    <div class="main-content">
        <div class="topbar">
            <h1 class="topbar-title">Gestión de Horarios</h1>
            <div class="topbar-actions">
                <button class="btn btn-primary" onclick="openModalHorario()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Asignar Horario
                </button>
            </div>
        </div>

        <div class="content-wrapper">
            <!-- Filtros -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="grid grid-2">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Carrera</label>
                            <select id="filterCarrera" class="form-input">
                                <option value="">Todas las carreras</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Semestre</label>
                            <select id="filterSemestre" class="form-input">
                                <option value="">Todos los semestres</option>
                                <option value="1">1er Semestre</option>
                                <option value="2">2do Semestre</option>
                                <option value="3">3er Semestre</option>
                                <option value="4">4to Semestre</option>
                                <option value="5">5to Semestre</option>
                                <option value="6">6to Semestre</option>
                                <option value="7">7mo Semestre</option>
                                <option value="8">8vo Semestre</option>
                                <option value="9">9no Semestre</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Grupo</label>
                            <select id="filterGrupo" class="form-input">
                                <option value="">Todos los grupos</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Aula</label>
                            <select id="filterAula" class="form-input">
                                <option value="">Todas las aulas</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vista de Horario Semanal -->
            <div class="card mb-3">
                <div class="card-header">
                    <h2 class="card-title">Horario Semanal</h2>
                </div>
                <div class="card-body">
                    <div class="legend">
                        <div class="legend-item">
                            <div class="legend-color" style="background: #e8f4ff;"></div>
                            <span>Hora ocupada</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: white; border: 1px solid #ddd;"></div>
                            <span>Hora disponible</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: #fff3cd;"></div>
                            <span>Recreo</span>
                        </div>
                    </div>

                    <div id="scheduleContainer">
                        <div class="schedule-grid">
                            <div class="schedule-header">Hora</div>
                            <div class="schedule-header">Lunes</div>
                            <div class="schedule-header">Martes</div>
                            <div class="schedule-header">Miércoles</div>
                            <div class="schedule-header">Jueves</div>
                            <div class="schedule-header">Viernes</div>

                            <?php
                            $horas = [
                                    ['07:00', '07:00 - 08:00'],
                                    ['08:00', '08:00 - 09:00'],
                                    ['09:00', '09:00 - 10:00'],
                                    ['10:00', '10:00 - 11:00'],
                                    ['11:00', '11:00 - 12:00'],
                                    ['12:00', '12:00 - 13:00'],
                                    ['13:00', '13:00 - 14:00'],
                                    ['14:00', '14:00 - 15:00']
                            ];
                            $dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

                            foreach ($horas as $hora) {
                                echo "<div class='schedule-time'>{$hora[1]}</div>";
                                foreach ($dias as $dia) {
                                    if ($hora[0] === '10:00') {
                                        echo "<div class='schedule-cell recreo' data-dia='{$dia}' data-hora='{$hora[0]}'><div class='recreo-item'>RECREO</div></div>";
                                    } else {
                                        echo "<div class='schedule-cell' data-dia='{$dia}' data-hora='{$hora[0]}'></div>";
                                    }
                                }
                            }
                            ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Horarios -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Lista de Horarios Asignados</h2>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                            <tr>
                                <th>Grupo</th>
                                <th>Materia</th>
                                <th>Profesor</th>
                                <th>Aula</th>
                                <th>Día</th>
                                <th>Horario</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody id="horariosTableBody">
                            <tr>
                                <td colspan="7" class="text-center">Cargando...</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Horario Mejorado -->
<div id="modalHorario" class="modal">
    <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
            <div class="content-title-modal">
                <div class="ico-modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                        <g fill="none" stroke="#5046e5" stroke-linecap="round" stroke-width="2.5">
                            <rect width="22" height="20" x="3" y="5" stroke-linejoin="round" rx="2"/>
                            <path d="M8 3v4m6-4v4m-7 6h8m-8 4h8"/>
                        </g>
                    </svg>
                </div>
                <h3 class="modal-title">Asignar Horario</h3>
            </div>
            <button class="modal-close" onclick="closeModal('modalHorario')">&times;</button>
        </div>
        <form id="formHorario">
            <div class="modal-body">
                <input type="hidden" id="horario_id" name="horario_id">

                <div class="form-group">
                    <label class="form-label">Grupo *</label>
                    <select id="grupo_id" name="grupo_id" class="form-input" required>
                        <option value="">Seleccionar grupo...</option>
                    </select>
                    <small class="text-muted">Selecciona el grupo para ver la información del profesor</small>
                </div>

                <div class="form-group">
                    <label class="form-label">Día de la semana *</label>
                    <select id="dia_semana" name="dia_semana" class="form-input" required disabled>
                        <option value="">Seleccionar día...</option>
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                    </select>
                </div>

                <div class="grid grid-2">
                    <div class="form-group">
                        <label class="form-label">Hora inicio *</label>
                        <select id="hora_inicio" name="hora_inicio" class="form-input" required disabled
                                aria-describedby="horaHelp">
                            <option value="">Seleccionar hora...</option>
                            <option value="07:00" data-end="08:00">07:00 - 08:00</option>
                            <option value="08:00" data-end="09:00">08:00 - 09:00</option>
                            <option value="09:00" data-end="10:00">09:00 - 10:00</option>
                            <!-- Recreo: opción no seleccionable -->
                            <option value="10:00" data-end="11:00" disabled class="recreo-option" aria-disabled="true">
                                10:00 - 11:00 (RECREO)
                            </option>
                            <option value="11:00" data-end="12:00">11:00 - 12:00</option>
                            <option value="12:00" data-end="13:00">12:00 - 13:00</option>
                            <option value="13:00" data-end="14:00">13:00 - 14:00</option>
                            <option value="14:00" data-end="15:00">14:00 - 15:00</option>
                        </select>
                        <small id="horaHelp" class="text-muted">Cada clase dura 1 hora.</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hora fin *</label>
                        <input type="time" id="hora_fin" name="hora_fin" class="form-input" required
                               style="background-color: #f0f0f0;">
                        <small class="text-muted">Se calcula automáticamente</small>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Aula *</label>
                    <select id="aula_id" name="aula_id" class="form-input" required disabled>
                        <option value="">Seleccionar aula...</option>
                    </select>
                    <small class="text-muted">Se verificará automáticamente la disponibilidad</small>
                </div>

                <div id="form-validation" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('modalHorario')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
        </form>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"></script>
<script src="../js/main.js"></script>
<script type="module" src="../js/horarios.js"></script>
</body>
</html>