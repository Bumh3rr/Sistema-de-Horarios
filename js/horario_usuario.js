import {showLoading, notyf} from './notify/Config.js';

let currentDocenteData = null;
let currentHorariosDocente = [];

document.addEventListener('DOMContentLoaded', function () {
    const id = document.getElementById('id_usuario').value;
    loadHorario(id);
});

async function loadHorario(id) {
    try {
        showLoading(true);

        // Obtener datos del docente
        const responseDocente = await fetch(`../php/docentes_api.php?action=get&id=${id}`);
        const dataDocente = await responseDocente.json();

        showLoading(false);
        if (!dataDocente.success) {
            notyf.error('Error al cargar datos del docente');
            return;
        }

        const docente = dataDocente.data;
        currentDocenteData = docente;

        // Obtener horario del docente
        const responseHorario = await fetch(`../php/docentes_api.php?action=horario&id=${id}`);
        const dataHorario = await responseHorario.json();

        if (!dataHorario.success) {
            notyf.error('Error al cargar el horario');
            return;
        }

        currentHorariosDocente = dataHorario.data || [];

        // Renderizar información del docente
        renderDocenteInfo(docente, currentHorariosDocente);

        // Generar tabla de horario
        generateHorarioTable(currentHorariosDocente);

    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al cargar el horario');
    } finally {
        showLoading(false);
    }
}

function renderDocenteInfo(docente, horarios) {
    const container = document.getElementById('docenteInfo');

    // Calcular estadísticas
    const totalHoras = horarios.length;
    const materiasUnicas = new Set(horarios.map(h => h.materia_nombre)).size;
    const gruposUnicos = new Set(horarios.map(h => h.grupo_nombre)).size;

    // Determinar límites según turno
    const limiteHoras = docente.horas_max_semana || (docente.turno === 'medio' ? 20 : 22);
    const porcentajeCarga = ((totalHoras / limiteHoras) * 100).toFixed(0);

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

    // Actualizar información para PDF
    document.getElementById('docenteNombrePrint').textContent =
        `Docente: ${docente.nombre} ${docente.apellido}`;
    document.getElementById('periodoActual').textContent =
        `Periodo: Agosto - Diciembre 2025`;
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

    // Crear mapa de horarios normalizando hora a HH:MM
    const horarioMap = {};
    horarios.forEach(h => {
        const horaNorm = formatTime(h.hora_inicio); // asegura HH:MM
        const key = `${h.dia_semana}-${horaNorm}`;
        horarioMap[key] = h;
    });

    // Generar filas
    bloques.forEach(bloque => {
        const row = document.createElement('tr');

        // Celda de hora
        const horaCell = document.createElement('td');
        horaCell.className = 'hora-cell';
        horaCell.textContent = bloque.label;
        row.appendChild(horaCell);

        // Celdas para cada día
        dias.forEach(dia => {
            const cell = document.createElement('td');
            const key = `${dia}-${bloque.inicio}`; // bloque.inicio ya es HH:MM
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
                            <div class="schedule-class-info">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>${formatTime(horario.hora_inicio)} - ${formatTime(horario.hora_fin)}</span>
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

    // Generar resumen
    generateResumen(horarios);
}

function generateResumen(horarios) {
    const container = document.getElementById('horarioResumen');

    const totalHoras = horarios.length;
    const materiasUnicas = new Set(horarios.map(h => h.materia_nombre)).size;
    const gruposUnicos = new Set(horarios.map(h => h.grupo_nombre)).size;

    // Horas por día
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