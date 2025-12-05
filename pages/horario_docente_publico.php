<?php
require_once '../php/config.php';

$docente_id = $_GET['id'] ?? '';

if (empty($docente_id)) {
    die('ID de docente no proporcionado');
}

$docente_id = intval($docente_id);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Horario del Docente</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/docente.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
    <style>
        body {
            background: var(--background);
            padding: 20px;
        }
        
        .public-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .public-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 32px;
            border-radius: var(--radius);
            margin-bottom: 24px;
            text-align: center;
            box-shadow: var(--shadow-lg);
        }
        
        .public-header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
        }
        
        .public-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        
        .card {
            background: var(--surface);
            border-radius: var(--radius);
            padding: 24px;
            box-shadow: var(--shadow-md);
            margin-bottom: 24px;
        }
        
        .print-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1000;
        }
        
        @media print {
            .print-button {
                display: none;
            }
        }
        
        @media (max-width: 768px) {
            .public-container {
                padding: 10px;
            }
            
            .public-header {
                padding: 20px;
            }
            
            .public-header h1 {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="public-container">
        <div class="public-header">
            <h1>Tecnológico Nacional de México</h1>
            <p>Campus Chilpancingo - Horario de Clases</p>
        </div>

        <div class="card">
            <div id="docenteInfo" class="docente-info-card">
                <!-- Información del docente -->
            </div>
        </div>

        <div class="card">
            <div class="horario-container">
                <div class="schedule-grid-wrapper">
                    <table class="schedule-table" id="scheduleTableDocente">
                        <thead>
                            <tr>
                                <th class="hora-column">Hora</th>
                                <th>Lunes</th>
                                <th>Martes</th>
                                <th>Miércoles</th>
                                <th>Jueves</th>
                                <th>Viernes</th>
                            </tr>
                        </thead>
                        <tbody id="scheduleBodyDocente">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px;">
                                    Cargando horario...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="horario-leyenda">
                    <div class="leyenda-item">
                        <div class="leyenda-color" style="background: var(--primary-color);"></div>
                        <span>Clase asignada</span>
                    </div>
                    <div class="leyenda-item">
                        <div class="leyenda-color" style="background: #f8f9fa; border: 1px solid #dee2e6;"></div>
                        <span>Hora libre</span>
                    </div>
                </div>

                <div class="horario-resumen" id="horarioResumen">
                    <!-- Resumen -->
                </div>
            </div>
        </div>
    </div>

    <button class="btn btn-primary print-button" onclick="window.print()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Imprimir
    </button>

    <script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"></script>
    <script>
        const notyf = new Notyf({
            duration: 3000,
            position: { x: 'right', y: 'top' }
        });

        const docenteId = <?php echo $docente_id; ?>;
        
        document.addEventListener('DOMContentLoaded', function() {
            loadHorarioPublico(docenteId);
        });

        async function loadHorarioPublico(id) {
            try {
                // Obtener datos del docente
                const responseDocente = await fetch(`../php/docentes_api.php?action=get&id=${id}`);
                const dataDocente = await responseDocente.json();

                if (!dataDocente.success) {
                    notyf.error('Error al cargar datos del docente');
                    return;
                }

                const docente = dataDocente.data;

                // Obtener horario
                const responseHorario = await fetch(`../php/docentes_api.php?action=horario&id=${id}`);
                const dataHorario = await responseHorario.json();

                if (!dataHorario.success) {
                    notyf.error('Error al cargar el horario');
                    return;
                }

                const horarios = dataHorario.data || [];

                // Renderizar
                renderDocenteInfo(docente, horarios);
                generateHorarioTable(horarios);
                generateResumen(horarios);

            } catch (error) {
                console.error('Error:', error);
                notyf.error('Error al cargar el horario');
            }
        }

        function renderDocenteInfo(docente, horarios) {
            const container = document.getElementById('docenteInfo');
            
            const totalHoras = horarios.length;
            const materiasUnicas = new Set(horarios.map(h => h.materia_nombre)).size;
            const gruposUnicos = new Set(horarios.map(h => h.grupo_nombre)).size;
            const limiteHoras = docente.horas_max_semana || (docente.turno === 'medio' ? 20 : 22);
            
            container.innerHTML = `
                <h4>${docente.nombre} ${docente.apellido}</h4>
                <p style="margin-bottom: 16px;">
                    <strong>RFC:</strong> ${docente.rfc || 'No especificado'} | 
                    <strong>Teléfono:</strong> ${docente.telefono || 'No especificado'} | 
                    <strong>Turno:</strong> ${docente.turno === 'medio' ? 'Medio Tiempo' : 'Tiempo Completo'}
                </p>
                <div class="docente-info-stats">
                    <div class="info-stat">
                        <span class="info-stat-value">${totalHoras}h</span>
                        <span class="info-stat-label">Horas Asignadas</span>
                    </div>
                    <div class="info-stat">
                        <span class="info-stat-value">${limiteHoras}h</span>
                        <span class="info-stat-label">Límite Máximo</span>
                    </div>
                    <div class="info-stat">
                        <span class="info-stat-value">${materiasUnicas}</span>
                        <span class="info-stat-label">Materias</span>
                    </div>
                    <div class="info-stat">
                        <span class="info-stat-value">${gruposUnicos}</span>
                        <span class="info-stat-label">Grupos</span>
                    </div>
                </div>
            `;
        }

        function generateHorarioTable(horarios) {
            const tbody = document.getElementById('scheduleBodyDocente');
            tbody.innerHTML = '';

            const bloques = [
                { inicio: '07:00', fin: '08:00', label: '07:00 - 08:00' },
                { inicio: '08:00', fin: '09:00', label: '08:00 - 09:00' },
                { inicio: '09:00', fin: '10:00', label: '09:00 - 10:00' },
                { inicio: '10:00', fin: '11:00', label: '10:00 - 11:00' },
                { inicio: '11:00', fin: '12:00', label: '11:00 - 12:00' },
                { inicio: '12:00', fin: '13:00', label: '12:00 - 13:00' },
                { inicio: '13:00', fin: '14:00', label: '13:00 - 14:00' },
                { inicio: '14:00', fin: '15:00', label: '14:00 - 15:00' }
            ];

            const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

            const horarioMap = {};
            horarios.forEach(h => {
                const horaNorm = formatTime(h.hora_inicio);
                const key = `${h.dia_semana}-${horaNorm}`;
                horarioMap[key] = h;
            });

            bloques.forEach(bloque => {
                const row = document.createElement('tr');
                
                const horaCell = document.createElement('td');
                horaCell.className = 'hora-cell';
                horaCell.textContent = bloque.label;
                row.appendChild(horaCell);

                dias.forEach(dia => {
                    const cell = document.createElement('td');
                    const key = `${dia}-${bloque.inicio}`;
                    const horario = horarioMap[key];

                    if (horario) {
                        cell.innerHTML = `
                            <div class="schedule-class">
                                <div class="schedule-class-header">
                                    <div class="schedule-class-name">${horario.materia_nombre}</div>
                                    <div class="schedule-class-grupo">Grupo: ${horario.grupo_nombre}</div>
                                </div>
                                <div class="schedule-class-body">
                                    <div class="schedule-class-info">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                        <span>${horario.aula_nombre}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        cell.className = 'empty-cell';
                        cell.innerHTML = '<div style="text-align: center; color: #adb5bd; font-size: 12px;">—</div>';
                    }

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });
        }

        function generateResumen(horarios) {
            const container = document.getElementById('horarioResumen');
            
            const totalHoras = horarios.length;
            const materiasUnicas = new Set(horarios.map(h => h.materia_nombre)).size;
            const gruposUnicos = new Set(horarios.map(h => h.grupo_nombre)).size;
            
            const horasPorDia = {};
            ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].forEach(dia => {
                horasPorDia[dia] = horarios.filter(h => h.dia_semana === dia).length;
            });
            
            const diaMaxHoras = Object.entries(horasPorDia).sort((a, b) => b[1] - a[1])[0];

            container.innerHTML = `
                <div class="resumen-item">
                    <span class="resumen-item-value">${totalHoras}</span>
                    <span class="resumen-item-label">Horas Totales</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-item-value">${materiasUnicas}</span>
                    <span class="resumen-item-label">Materias</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-item-value">${gruposUnicos}</span>
                    <span class="resumen-item-label">Grupos</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-item-value">${diaMaxHoras ? diaMaxHoras[0] : '-'}</span>
                    <span class="resumen-item-label">Día + Horas</span>
                </div>
            `;
        }

        function formatTime(time) {
            if (!time) return '';
            const parts = time.split(':');
            return `${parts[0]}:${parts[1]}`;
        }
    </script>
</body>
</html>
