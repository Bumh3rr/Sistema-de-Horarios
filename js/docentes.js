import {showLoading, notyf} from './notify/Config.js';
import {ModalManager} from './utils/ModalManager.js';

const modalManager = new ModalManager();
let currentDocenteData = null;
let currentHorariosDocente = [];

// Gestión de Docentes
document.addEventListener('DOMContentLoaded', function () {
    loadDocentes();
    generateScheduleGrid();

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            loadDocentes();
        }, 550));
    }

    // Filtro por estado
    const filterActivo = document.getElementById('filterActivo');
    if (filterActivo) {
        filterActivo.addEventListener('change', function () {
            loadDocentes();
        });
    }

    // Formulario de docente
    const formDocente = document.getElementById('formDocente');
    if (formDocente) {
        formDocente.addEventListener('submit', handleSubmitDocente);
    }

    // Botón de nuevo docente
    const btnNew = document.getElementById('btnNewDocente');
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            // limpiar form antes de abrir
            const form = document.getElementById('formDocente');
            if (form) form.reset();
            document.getElementById('docente_id').value = '';
            document.getElementById('modalDocenteTitle').textContent = 'Nuevo Docente';
            loadMaterias([]);
        });
    }
});

// Generar grid de horario
function generateScheduleGrid() {
    const grid = document.getElementById('scheduleGridDocente');
    if (!grid) return;

    // Horarios de 7:00 AM a 3:00 PM (8 horas)
    const horas = [
        '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
        '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00'
    ];
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    horas.forEach(hora => {
        const horaInicio = hora.split(' - ')[0];

        // Celda de hora
        const timeCell = document.createElement('div');
        timeCell.className = 'schedule-time';
        timeCell.textContent = hora;
        grid.appendChild(timeCell);

        // Celdas para cada día
        dias.forEach(dia => {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell';
            cell.setAttribute('data-dia', dia);
            cell.setAttribute('data-hora', horaInicio);
            grid.appendChild(cell);
        });
    });
}

// Cargar docentes
async function loadDocentes() {
    const tbody = document.getElementById('docentesTableBody');
    const search = document.getElementById('searchInput')?.value || '';
    const activo = document.getElementById('filterActivo')?.value || '';

    try {
        showLoading(true);
        // delay to show loading
        const response = await fetch(`../php/docentes_api.php?action=list&search=${encodeURIComponent(search)}&activo=${activo}`);
        const data = await response.json();

        if (data.success) {
            renderDocentes(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar docentes</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar docentes</td></tr>';
        notyf.error('Error al cargar docentes');
    } finally {
        showLoading(false);
    }
}

async function loadMaterias(selected = []) {
    const container = document.getElementById('docenteMateriasContainer');
    if (!container) return;
    container.innerHTML = '<div class="text-muted">Cargando materias...</div>';

    try {
        showLoading(true);
        const res = await fetch('../php/materias_api.php?action=list');
        const data = await res.json();
        showLoading(false);
        if (!data.success) {
            container.innerHTML = '<div class="text-danger">Error al cargar materias</div>';
            return;
        }
        const materias = data.data;
        if (materias.length === 0) {
            container.innerHTML = '<div class="text-muted">No hay materias disponibles</div>';
            return;
        }

        container.innerHTML = materias.map(m => {
            const checked = selected.includes(m.id) ? 'checked' : '';
            const palabrasIgnoradas = ['en', 'de', 'y', 'la', 'el', 'los', 'las'];
            const iniciales = m.carrera_nombre.split(' ').filter(p => !palabrasIgnoradas.includes(p)).map(p => p.charAt(0).toUpperCase()).join('');
            return `
                <label style="display:block; padding:4px 0;">
                    <input class="ui-checkbox" type="checkbox" name="materias[]" value="${m.id}" ${checked}> 
                        ${m.nombre} - ${iniciales}
                </label>
            `;
        }).join('');
    } catch (err) {
        notyf.error('Error al cargar materias');
        container.innerHTML = '<div class="text-danger">Error al cargar materias</div>';
    }finally {
        showLoading(false);
    }
}

// Renderizar docentes en tabla
function renderDocentes(docentes) {
    const tbody = document.getElementById('docentesTableBody');

    if (docentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron docentes</td></tr>';
        return;
    }
    console.log(docentes);

    tbody.innerHTML = docentes.map(docente => `
        <tr>
            <td>${docente.id}</td>
            <td><strong>${docente.nombre} ${docente.apellido}</strong></td>
            <td><span class="badge badge-secondary">${docente.rfc || '-'}</span></td>
            <td>${docente.telefono || '-'}</td>
            <td>
                <span class="badge badge-${docente.turno === 'medio' ? 'warning' : 'info'}">
                    ${docente.turno === 'medio' ? 'Medio Tiempo ' : 'Tiempo Completo'}
                </span>
            </td>
            <td>
                <span class="badge badge-${docente.activo == 1 ? 'success' : 'error'}">
                    ${docente.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-primary" onclick="viewHorarioDocente(${docente.id})" title="Ver Horario">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="mostrarQRDocente(${docente.id})" title="Código QR">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editDocente(${docente.id})" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocente(${docente.id})" title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Manejar envío de formulario
async function handleSubmitDocente(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const docente_id = formData.get('docente_id');
    const action = docente_id ? 'update' : 'create';
    appendSelectedMateriasToFormData(formData);


    // Validaciones
    const nombre = formData.get('nombre');
    const apellido = formData.get('apellido');
    if (!isNameValid(nombre) || !isNameValid(apellido)) {
        notyf.error('El nombre y apellido solo deben contener letras y espacios (máximo 40 caracteres)');
        return;
    }

    const rfc = formData.get('rfc');
    if (rfc && rfc.length !== 13) {
        notyf.error('El RFC debe tener 13 caracteres');
        return;
    }

    const telefono = formData.get('telefono');
    if (telefono && !isValidPhone(telefono)) {
        notyf.error('El formato del teléfono no es válido (10 dígitos)');
        return;
    }

    // Agregar activo como checkbox
    formData.set('activo', document.getElementById('activo').checked ? '1' : '0');
    formData.set('action', action);

    modalManager.openInfo(
        'Confirmar Acción',
        `¿Estás seguro de que deseas ${action === 'create' ? 'crear' : 'actualizar'} este docente?`,
        async () => {
            await submitDocenteForm(formData, form, action);
            modalManager.closeModal(ModalManager.ModalType.INFO);
        });
}

// Enviar formulario al servidor
async function submitDocenteForm(formData, form, action) {
    try {
        showLoading(true);
        const response = await fetch('../php/docentes_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            notyf.success(data.message);
            closeModal('modalDocente');
            form.reset();

            modalManager.openSuccess(
                'Operación Exitosa',
                `El docente ha sido ${action === 'create' ? 'registrado' : 'actualizado'} exitosamente.`,
                () => {
                    loadDocentes();
                    modalManager.closeModalPop();
                });
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al guardar el docente');
    } finally {
        showLoading(false);
    }
}

async function performDeleteDocente(id) {
    try {
        showLoading(true);

        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);


        const response = await fetch('../php/docentes_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);

        if (data.success) {
            notyf.success(data.message);
            await loadDocentes();
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        notyf.error('Error al eliminar el docente');
    } finally {
        showLoading(false);
    }
}

function appendSelectedMateriasToFormData(formData) {
    // eliminar posibles entradas previas
    try { formData.delete('materias[]'); } catch(e){}
    const checked = document.querySelectorAll('#docenteMateriasContainer input[name="materias[]"]:checked');
    checked.forEach(ch => formData.append('materias[]', ch.value));
}

// Eliminar docente
window.deleteDocente = async (id) => {
    modalManager.openWarning('Confirmar Eliminación',
        '¿Estás seguro de que deseas eliminar este docente?', async () => {
            await performDeleteDocente(id);
            modalManager.closeModalPop();
        });
}

// Editar docente
window.editDocente = async (id) => {

    try {
        showLoading(true);
        const response = await fetch(`../php/docentes_api.php?action=get_v1&id=${id}`);
        const data = await response.json();

        showLoading(false);
        if (data.success) {
            const docente = data.data;
            console.log(docente);

            document.getElementById('docente_id').value = docente.id;
            document.getElementById('nombre').value = docente.nombre;
            document.getElementById('apellido').value = docente.apellido;
            document.getElementById('rfc').value = docente.rfc || '';
            document.getElementById('turno').value = docente.turno || '';
            document.getElementById('telefono').value = docente.telefono || '';
            document.getElementById('activo').checked = docente.activo === 1;

            // cargar materias y marcar las asignadas
            const selected = docente.materias || [];
            await loadMaterias(selected);

            document.getElementById('modalDocenteTitle').textContent = 'Editar Docente';
            openModal('modalDocente');
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        notyf.error('Error al cargar el docente');
    } finally {
        showLoading(false)
    }
}

window.viewHorarioDocente = async (id) => {
    try {
        showLoading(true);

        // Obtener datos del docente
        const responseDocente = await fetch(`../php/docentes_api.php?action=get&id=${id}`);
        const dataDocente = await responseDocente.json();

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

        // Actualizar título
        document.getElementById('modalHorarioDocenteTitle').textContent =
            `Horario de ${docente.nombre} ${docente.apellido}`;

        // Abrir modal
        openModal('modalHorarioDocente');
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al cargar el horario');
    } finally {
        showLoading(false);
    }
};

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

window.exportarHorarioPDF = async () => {
    try {
        if (typeof window.jspdf === 'undefined') {
            notyf.error('Librería PDF no cargada');
            return;
        }

        showLoading(true);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        if (!currentDocenteData) {
            notyf.error('No hay datos del docente');
            return;
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;

        // Header
        doc.setFillColor(80, 70, 229);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Tecnológico Nacional de México', pageWidth / 2, 12, { align: 'center' });

        doc.setFontSize(14);
        doc.text('Campus Chilpancingo', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('Horario de Clases', pageWidth / 2, 28, { align: 'center' });

        yPos = 45;

        // Información del docente
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Docente: ${currentDocenteData.nombre} ${currentDocenteData.apellido}`, margin, yPos);

        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`RFC: ${currentDocenteData.rfc || 'N/A'}`, margin, yPos);
        doc.text(`Turno: ${currentDocenteData.turno === 'medio' ? 'Medio Tiempo' : 'Tiempo Completo'}`, margin + 80, yPos);
        doc.text(`Periodo: Agosto - Diciembre 2025`, margin + 160, yPos);

        yPos += 10;

        // Preparar datos de tabla
        const bloques = [
            '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
            '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00'
        ];
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        const tableData = [];

        bloques.forEach((bloque) => {
            const rowData = [bloque];
            const horaInicio = bloque.split(' - ')[0]; // HH:MM

            dias.forEach(dia => {
                // Normalizar al comparar
                const horario = currentHorariosDocente.find(h =>
                    h.dia_semana === dia && formatTime(h.hora_inicio) === horaInicio
                );

                if (horario) {
                    rowData.push(`${horario.materia_nombre}\nGrupo: ${horario.grupo_nombre}\n${horario.aula_nombre}`);
                } else {
                    rowData.push('—');
                }
            });

            tableData.push(rowData);
        });

        // Crear tabla con autoTable
        doc.autoTable({
            startY: yPos,
            head: [['Hora', ...dias]],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak',
                halign: 'center',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [80, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 25, fontStyle: 'bold', fillColor: [248, 249, 250] }
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            margin: { left: margin, right: margin }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || yPos + 100;
        if (finalY < pageHeight - 30) {
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        const filename = `Horario_${currentDocenteData.nombre}_${currentDocenteData.apellido}.pdf`;
        doc.save(filename);

        notyf.success('PDF generado exitosamente');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        notyf.error('Error al generar el PDF');
    } finally {
        showLoading(false);
    }
};


let currentQRDocente = null;
let qrCodeInstance = null;

/**
 * Mostrar modal QR del docente
 */
window.mostrarQRDocente = async (id) => {
    try {
        showLoading(true);

        // Obtener datos del docente
        const response = await fetch(`../php/docentes_api.php?action=get&id=${id}`);
        const data = await response.json();

        if (!data.success) {
            notyf.error('Error al cargar datos del docente');
            return;
        }

        const docente = data.data;
        currentQRDocente = docente;

        // Actualizar información del modal
        const infoContainer = document.querySelector('#qrDocenteInfo h4');
        const infoSubtext = document.querySelector('#qrDocenteInfo p');

        infoContainer.textContent = `${docente.nombre} ${docente.apellido}`;
        infoSubtext.innerHTML = `
            <strong>RFC:</strong> ${docente.rfc || 'N/A'} | 
            <strong>Turno:</strong> ${docente.turno === 'medio' ? 'Medio Tiempo' : 'Tiempo Completo'}
        `;

        // Actualizar título
        document.getElementById('modalQRDocenteTitle').textContent =
            `Código QR - ${docente.nombre} ${docente.apellido}`;

        // Generar QR
        generarQRDocente(docente);

        // Abrir modal
        openModal('modalQRDocente');

    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al generar código QR');
    } finally {
        showLoading(false);
    }
};

/**
 * Generar código QR
 */
function generarQRDocente(docente) {
    const container = document.getElementById('qrcode');

    // Limpiar QR anterior
    container.innerHTML = '';

    // Crear URL con información del docente
    // La URL apuntará a una página que muestre el horario del docente
    const baseUrl = window.location.origin + window.location.pathname.replace('/pages/docentes.php', '');
    const qrUrl = `${baseUrl}/pages/horario_docente_publico.php?id=${docente.id}`;

    // Generar QR con QRCode.js
    qrCodeInstance = new QRCode(container, {
        text: qrUrl,
        width: 256,
        height: 256,
        colorDark: "#5046e5",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

/**
 * Descargar QR como imagen
 */
window.descargarQR = () => {
    if (!currentQRDocente || !qrCodeInstance) {
        notyf.error('No hay código QR para descargar');
        return;
    }

    try {
        const canvas = document.querySelector('#qrcode canvas');

        if (!canvas) {
            notyf.error('Error al obtener código QR');
            return;
        }

        // Crear canvas más grande con información adicional
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');

        // Dimensiones
        const qrSize = 256;
        const padding = 40;
        const textHeight = 120;
        const width = qrSize + (padding * 2);
        const height = qrSize + textHeight + (padding * 2);

        finalCanvas.width = width;
        finalCanvas.height = height;

        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Dibujar QR
        ctx.drawImage(canvas, padding, padding + textHeight, qrSize, qrSize);

        // Texto - Header
        ctx.fillStyle = '#5046e5';
        ctx.fillRect(0, 0, width, 60);

        // Título
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Poppins, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tecnológico Nacional de México', width / 2, 25);
        ctx.font = '14px Poppins, Arial';
        ctx.fillText('Campus Chilpancingo', width / 2, 45);

        // Información del docente
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 16px Poppins, Arial';
        ctx.fillText(`${currentQRDocente.nombre} ${currentQRDocente.apellido}`, width / 2, 85);

        ctx.font = '12px Poppins, Arial';
        ctx.fillStyle = '#718096';
        ctx.fillText(`RFC: ${currentQRDocente.rfc || 'N/A'}`, width / 2, 105);

        // Instrucción
        ctx.fillStyle = '#a0aec0';
        ctx.font = '11px Poppins, Arial';
        ctx.fillText('Escanea para ver horario', width / 2, height - 15);

        // Descargar
        const link = document.createElement('a');
        link.download = `QR_${currentQRDocente.nombre}_${currentQRDocente.apellido}.png`;
        link.href = finalCanvas.toDataURL('image/png');
        link.click();

        notyf.success('Código QR descargado exitosamente');

    } catch (error) {
        console.error('Error al descargar QR:', error);
        notyf.error('Error al descargar el código QR');
    }
};