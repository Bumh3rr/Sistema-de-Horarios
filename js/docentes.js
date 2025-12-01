import {showLoading, notyf} from './notify/Config.js';
import {ModalManager} from './utils/ModalManager.js';
import AuthService from './services/AuthService.js';
import {register} from './auth/Auth.js';

const modalManager = new ModalManager();
const authService = new AuthService();

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

    tbody.innerHTML = docentes.map(docente => `
        <tr>
            <td>${docente.id}</td>
            <td><strong>${docente.nombre} ${docente.apellido}</strong></td>
            <td>${docente.email}</td>
            <td><span class="badge badge-secondary">${docente.rfc || '-'}</span></td>
            <td>${docente.telefono || '-'}</td>
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


    const email = formData.get('email');
    if (!isValidEmail(email)) {
        notyf.error('El formato del email no es válido');
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
            if (action === 'create') {
                const email = formData.get('email');
                const password = formData.get('password');
                const result  = await register(email, password);
                const uid = result.user.uid;
                const userData = {
                    email: email,
                    role: 'docente'
                };
                const authResult = await authService.registerUser(uid,userData);
                if (!authResult.success) {
                    notyf.error('Docente creado, pero error al guardar en el sistema de autenticación: ' + authResult.message);
                    return;
                }
            }

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

// Renderizar horario del docente
function renderHorarioDocente(horarios) {
    // Limpiar todas las celdas
    document.querySelectorAll('#scheduleGridDocente .schedule-cell').forEach(cell => {
        cell.innerHTML = '';
    });

    // Renderizar cada horario
    horarios.forEach(horario => {
        const cells = document.querySelectorAll(`#scheduleGridDocente [data-dia="${horario.dia_semana}"][data-hora="${horario.hora_inicio}"]`);

        cells.forEach(cell => {
            cell.innerHTML = `
                <div class="schedule-class">
                    <div class="schedule-class-name">${horario.materia_nombre}</div>
                    <div class="schedule-class-info">
                        Grupo: ${horario.grupo_nombre}<br>
                        Aula: ${horario.aula_nombre}<br>
                        ${formatTime(horario.hora_inicio)} - ${formatTime(horario.hora_fin)}
                    </div>
                </div>
            `;
        });
    });
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
        const response = await fetch(`../php/docentes_api.php?action=get&id=${id}`);
        const data = await response.json();

        showLoading(false);
        if (data.success) {
            const docente = data.data;

            document.getElementById('docente_id').value = docente.id;
            document.getElementById('nombre').value = docente.nombre;
            document.getElementById('apellido').value = docente.apellido;
            document.getElementById('email').value = docente.email;
            document.getElementById('password').value = docente.password;
            document.getElementById('rfc').value = docente.rfc || '';
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

// Ver horario del docente
window.viewHorarioDocente = async (id) => {
    try {
        showLoading(true)
        const responseDocente = await fetch(`../php/docentes_api.php?action=get&id=${id}`);
        const dataDocente = await responseDocente.json();

        if (!dataDocente.success) {
            notyf.error('Error al cargar datos del docente');
            return;
        }

        const docente = dataDocente.data;

        // Mostrar info del docente
        document.getElementById('docenteInfo').innerHTML = `
            <h4 style="margin-bottom: 8px; color: var(--text-primary);">
                ${docente.nombre} ${docente.apellido}
            </h4>
            <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                <strong>Email:</strong> ${docente.email} | 
                <strong>RFC:</strong> ${docente.rfc || 'No especificado'} | 
                <strong>Teléfono:</strong> ${docente.telefono || 'No especificado'}
            </p>
        `;

        // Obtener horario del docente
        const responseHorario = await fetch(`../php/docentes_api.php?action=horario&id=${id}`);
        const dataHorario = await responseHorario.json();

        if (dataHorario.success) {
            renderHorarioDocente(dataHorario.data);
        }

        document.getElementById('modalHorarioDocenteTitle').textContent = `Horario de ${docente.nombre} ${docente.apellido}`;
        openModal('modalHorarioDocente');
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al cargar el horario');
    } finally {
        showLoading(false)
    }
}