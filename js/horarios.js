import {showLoading, notyf} from './notify/Config.js';
import {ModalManager} from './utils/ModalManager.js';

const modalManager = new ModalManager();
// Configuración
const HORA_INICIO_INSTITUCIONAL = '07:00';
const HORA_FIN_INSTITUCIONAL = '15:00';
const RECREO_INICIO = '10:00';
const RECREO_FIN = '11:00';
const BLOQUES_HORARIOS = [
    { inicio: '07:00', fin: '08:00', label: '07:00 - 08:00' },
    { inicio: '08:00', fin: '09:00', label: '08:00 - 09:00' },
    { inicio: '10:00', fin: '11:00', label: '10:00 - 11:00' },
    { inicio: '11:00', fin: '12:00', label: '11:00 - 12:00' },
    { inicio: '12:00', fin: '13:00', label: '12:00 - 13:00' },
    { inicio: '13:00', fin: '14:00', label: '13:00 - 14:00' },
    { inicio: '14:00', fin: '15:00', label: '14:00 - 15:00' }
];

// Estado global
let horariosData = [];
let carrerasData = [];
let gruposData = [];
let aulasData = [];
let materiasData = [];

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    initializeHorarios();
});

async function initializeHorarios() {
    try {
        showLoading();

        // Cargar datos iniciales
        await Promise.all([
            loadCarreras(),
            loadMaterias(),
            loadGrupos(),
            loadAulas(),
            loadHorarios()
        ]);

        // Configurar event listeners
        setupEventListeners();

        // Poblar selects de filtros
        populateFilterAulas();

        // Renderizar horario inicial
        renderSchedule();
        renderHorariosTable();

        hideLoading();
    } catch (error) {
        console.error('Error al inicializar:', error);
        showAlert('Error al cargar los datos', 'error');
        hideLoading();
    }
}

function setupEventListeners() {
    // Filtros
    const filterCarrera = document.getElementById('filterCarrera');
    const filterSemestre = document.getElementById('filterSemestre');
    const filterGrupo = document.getElementById('filterGrupo');
    const filterAula = document.getElementById('filterAula'); // ← AGREGAR
    const selMateria = document.getElementById('filterMateria');
    if (selMateria) selMateria.addEventListener('change', handleFilterChange);

    if (filterCarrera) {
        filterCarrera.addEventListener('change', function() {
            handleFilterChange();
            loadGruposByCarreraAndSemestre();
        });
    }

    if (filterSemestre) {
        filterSemestre.addEventListener('change', function() {
            handleFilterChange();
            loadGruposByCarreraAndSemestre();
        });
    }

    if (filterGrupo) {
        filterGrupo.addEventListener('change', handleFilterChange);
    }

    if (filterAula) {
        filterAula.addEventListener('change', handleFilterChange);
    }

    // Formulario de horario
    const formHorario = document.getElementById('formHorario');
    if (formHorario) {
        formHorario.addEventListener('submit', handleSubmitHorario);
    }

    // Campos del formulario con validación en tiempo real
    const grupoSelect = document.getElementById('grupo_id');
    const aulaSelect = document.getElementById('aula_id');
    const diaSelect = document.getElementById('dia_semana');
    const horaInicio = document.getElementById('hora_inicio');
    const horaFin = document.getElementById('hora_fin');

    if (grupoSelect) grupoSelect.addEventListener('change', handleGrupoChange);
    if (aulaSelect) aulaSelect.addEventListener('change', validateFormFields);
    if (diaSelect) diaSelect.addEventListener('change', validateFormFields);
    if (horaInicio) horaInicio.addEventListener('change', handleHoraChange);
    if (horaFin) horaFin.addEventListener('change', validateFormFields);

    // Configurar límites de hora
    if (horaInicio) {
        horaInicio.min = HORA_INICIO_INSTITUCIONAL;
        horaInicio.max = '14:00'; // Máximo inicio a las 2 PM para permitir clases hasta las 3 PM
    }
    if (horaFin) {
        horaFin.min = '08:00';
        horaFin.max = HORA_FIN_INSTITUCIONAL;
    }
}

// ========== CARGA DE DATOS ==========

async function loadCarreras() {
    try {
        const response = await fetch('../php/carreras_api.php?action=list');
        const data = await response.json();

        if (data.success) {
            carrerasData = data.data;
            populateCarrerasSelect();
        }
    } catch (error) {
        console.error('Error al cargar carreras:', error);
    }
}

async function loadGrupos() {
    try {
        const response = await fetch('../php/grupos_api.php?action=list');
        const data = await response.json();

        if (data.success) {
            gruposData = data.data;
            populateGruposSelect();
        }
    } catch (error) {
        console.error('Error al cargar grupos:', error);
    }
}

async function loadAulas() {
    try {
        const response = await fetch('../php/aulas_api.php?action=list');
        const data = await response.json();

        if (data.success) {
            aulasData = data.data;
            populateAulasSelect();
        }
    } catch (error) {
        console.error('Error al cargar aulas:', error);
    }
}

async function loadMaterias() {
    try {
        const carreraId = document.getElementById('filterCarrera')?.value;
        const semestre = document.getElementById('filterSemestre')?.value;

        let url = '../php/materias_api.php?action=list';
        if (carreraId) url += `&carrera=${carreraId}`;
        if (semestre) url += `&semestre=${semestre}`;

        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
            materiasData = data.data;
            populateMateriasSelect();
        }
    } catch (err) {
        console.error('Error al cargar materias:', err);
    }
}

async function loadHorarios() {
    try {
        const carreraId = document.getElementById('filterCarrera')?.value;
        const semestre = document.getElementById('filterSemestre')?.value;
        const grupoId = document.getElementById('filterGrupo')?.value;
        const aulaId = document.getElementById('filterAula')?.value;
        const materiaId = document.getElementById('filterMateria')?.value;

        let url = '../php/horarios_api.php?action=schedule';
        if (grupoId) url += `&grupo=${grupoId}`;
        if (carreraId) url += `&carrera=${carreraId}`;
        if (semestre) url += `&semestre=${semestre}`;
        if (aulaId) url += `&aula=${aulaId}`;
        if (materiaId) url += `&materia=${materiaId}`;

        const resp = await fetch(url);
        const json = await resp.json();
        if (json.success) {
            horariosData = json.data;
        } else {
            horariosData = [];
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        horariosData = [];
    }
}
// ========== POBLAR SELECTS ==========

function populateCarrerasSelect() {
    const filterCarrera = document.getElementById('filterCarrera');

    if (filterCarrera) {
        filterCarrera.innerHTML = '<option value="">Todas las carreras</option>';
        carrerasData.forEach(carrera => {
            const option = document.createElement('option');
            option.value = carrera.id;
            option.textContent = carrera.nombre;
            filterCarrera.appendChild(option);
        });
    }
}

function populateGruposSelect() {
    const filterGrupo = document.getElementById('filterGrupo');
    const grupoIdModal = document.getElementById('grupo_id');

    if (filterGrupo) {
        filterGrupo.innerHTML = '<option value="">Todos los grupos</option>';
        gruposData.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = `${grupo.nombre} - ${grupo.materia_nombre}`;
            filterGrupo.appendChild(option);
        });
    }

    if (grupoIdModal) {
        grupoIdModal.innerHTML = '<option value="">Seleccionar grupo...</option>';
        gruposData.forEach(grupo => {
            // Solo grupos con profesor asignado
            if (grupo.profesor_id) {
                const option = document.createElement('option');
                option.value = grupo.id;
                option.textContent = `${grupo.nombre} - ${grupo.materia_nombre} (${grupo.profesor_nombre})`;
                option.dataset.profesorId = grupo.profesor_id;
                option.dataset.materiaId = grupo.materia_id;
                grupoIdModal.appendChild(option);
            }
        });
    }
}

function populateAulasSelect() {
    const aulaSelect = document.getElementById('aula_id');

    if (aulaSelect) {
        aulaSelect.innerHTML = '<option value="">Seleccionar aula...</option>';

        // Agrupar por edificio
        const aulasPorEdificio = {};
        aulasData.forEach(aula => {
            if (!aulasPorEdificio[aula.edificio]) {
                aulasPorEdificio[aula.edificio] = [];
            }
            aulasPorEdificio[aula.edificio].push(aula);
        });

        // Crear optgroups
        Object.keys(aulasPorEdificio).sort().forEach(edificio => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Edificio ${edificio}`;

            aulasPorEdificio[edificio].forEach(aula => {
                const option = document.createElement('option');
                option.value = aula.id;
                option.textContent = `${aula.nombre} - ${aula.tipo} (Cap: ${aula.capacidad})`;
                option.dataset.tipo = aula.tipo;
                option.dataset.capacidad = aula.capacidad;
                optgroup.appendChild(option);
            });

            aulaSelect.appendChild(optgroup);
        });
    }
}

function populateFilterAulas() {
    const filterAula = document.getElementById('filterAula');

    if (filterAula) {
        filterAula.innerHTML = '<option value="">Todas las aulas</option>';

        // Agrupar por edificio
        const aulasPorEdificio = {};
        aulasData.forEach(aula => {
            if (!aulasPorEdificio[aula.edificio]) {
                aulasPorEdificio[aula.edificio] = [];
            }
            aulasPorEdificio[aula.edificio].push(aula);
        });

        // Crear optgroups
        Object.keys(aulasPorEdificio).sort().forEach(edificio => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Edificio ${edificio}`;

            aulasPorEdificio[edificio].forEach(aula => {
                const option = document.createElement('option');
                option.value = aula.id;
                option.textContent = `${aula.nombre} (${aula.tipo})`;
                optgroup.appendChild(option);
            });

            filterAula.appendChild(optgroup);
        });
    }
}

function populateMateriasSelect() {
    const filterMateria = document.getElementById('filterMateria');
    if (!filterMateria) return;

    filterMateria.innerHTML = '<option value="">Todas las materias</option>';
    materiasData.forEach(materia => {
        const option = document.createElement('option');
        option.value = materia.id;
        option.textContent = `${materia.nombre}${materia.codigo ? ' (' + materia.codigo + ')' : ''}`;
        filterMateria.appendChild(option);
    });
}

async function loadGruposByCarreraAndSemestre() {
    try {
        const carreraId = document.getElementById('filterCarrera')?.value;
        const semestre = document.getElementById('filterSemestre')?.value;

        let url = '../php/grupos_api.php?action=list';
        if (carreraId) url += `&carrera=${carreraId}`;
        if (semestre) url += `&semestre=${semestre}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            gruposData = data.data;
            populateGruposSelect();
        }
    } catch (error) {
        console.error('Error al cargar grupos:', error);
    }
}

// ========== RENDERIZADO ==========

function renderSchedule() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horas = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'
    ];

    dias.forEach(dia => {
        horas.forEach(hora => {
            const cell = document.querySelector(`.schedule-cell[data-dia="${dia}"][data-hora="${hora}"]`);
            if (!cell) return;

            if (hora === RECREO_INICIO) {
                return;
            }

            cell.innerHTML = '';
            cell.classList.remove('occupied');

            const horariosEnCelda = horariosData.filter(h => {
                const horaInicio = h.hora_inicio.substring(0, 5);
                return h.dia_semana === dia && horaInicio === hora;
            });

            if (horariosEnCelda.length > 0) {
                cell.classList.add('occupied');
                horariosEnCelda.forEach(horario => {
                    const item = document.createElement('div');
                    item.className = 'schedule-item';
                    item.innerHTML = `
                        <strong>${horario.grupo_nombre}</strong>
                        <small>${horario.materia_nombre}</small>
                        <small class="text-muted">${horario.aula_nombre}</small>
                    `;
                    item.onclick = () => showHorarioDetails(horario);
                    cell.appendChild(item);
                });
            }
        });
    });
}

function renderHorariosTable() {
    const tbody = document.getElementById('horariosTableBody');
    if (!tbody) return;

    if (horariosData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay horarios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    horariosData.forEach(horario => {
        const tr = document.createElement('tr');

        const horaInicio = horario.hora_inicio.substring(0, 5);
        const horaFin = horario.hora_fin.substring(0, 5);

        tr.innerHTML = `
            <td>${horario.grupo_nombre}</td>
            <td>${horario.materia_nombre}</td>
            <td>${horario.profesor_nombre || '<span class="text-muted">Sin profesor</span>'}</td>
            <td>${horario.aula_nombre} (${horario.aula_edificio})</td>
            <td>${horario.dia_semana}</td>
            <td>${horaInicio} - ${horaFin}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="eliminarHorario(${horario.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ========== MANEJO DE EVENTOS ==========

async function handleFilterChange() {
    showLoading();
    await loadHorarios();
    renderSchedule();
    renderHorariosTable();
    hideLoading();
}

async function handleGrupoChange(e) {
    const grupoId = e.target.value;

    if (!grupoId) {
        clearFormValidation();
        return;
    }

    // Buscar información del grupo
    const grupo = gruposData.find(g => g.id == grupoId);

    if (grupo) {
        // Mostrar información del profesor
        showProfesorInfo(grupo);

        // Habilitar campos
        document.getElementById('aula_id').disabled = false;
        document.getElementById('dia_semana').disabled = false;
        document.getElementById('hora_inicio').disabled = false;
        document.getElementById('hora_fin').disabled = false;
    }
}

async function showProfesorInfo(grupo) {
    // Crear o actualizar div de información
    let infoDiv = document.getElementById('profesor-info');

    if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'profesor-info';
        infoDiv.className = 'alert alert-info mt-3';

        const modalBody = document.querySelector('#modalHorario .modal-body');
        modalBody.insertBefore(infoDiv, modalBody.firstChild);
    }

    const turnoLabel = grupo.profesor_turno === 'medio' ? 'Medio Tiempo (18-20 hrs/semana)' : 'Tiempo Completo (20-22 hrs/semana)';

    infoDiv.innerHTML = `
        <strong>Profesor:</strong> ${grupo.profesor_nombre}<br>
        <strong>Turno:</strong> ${turnoLabel}<br>
        <strong>Materia:</strong> ${grupo.materia_nombre}
    `;

    try {
        const response = await fetch(`../php/horarios_api.php?action=verificar_creditos&grupo_id=${grupo.id}`);
        const data = await response.json();

        if (data.success && data.data) {
            const turnoLabel = grupo.profesor_turno === 'medio'
                ? 'Medio Tiempo (18-20 hrs/semana)'
                : 'Tiempo Completo (20-22 hrs/semana)';

            infoDiv.innerHTML = `
                <strong>Profesor:</strong> ${grupo.profesor_nombre}<br>
                <strong>Turno:</strong> ${turnoLabel}<br>
                <strong>Materia:</strong> ${grupo.materia_nombre}<br>
                <strong>Créditos:</strong> ${data.data.creditos} (${data.data.horas_maximas} horas/semana)<br>
                <strong>Horas asignadas:</strong> ${data.data.horas_asignadas}/${data.data.horas_maximas}
                ${data.data.horas_asignadas >= data.data.horas_maximas
                ? '<br><span style="color: #d63031;">Ya tiene todas las horas asignadas</span>'
                : ''}
            `;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleHoraChange() {
    const horaInicio = document.getElementById('hora_inicio').value;

    if (horaInicio) {
        // Calcular automáticamente 1 hora después
        const inicio = new Date(`2000-01-01T${horaInicio}`);
        inicio.setHours(inicio.getHours() + 1);
        const horaFin = inicio.toTimeString().substring(0, 5);

        // Verificar que no exceda las 3 PM
        if (horaFin <= '15:00') {
            document.getElementById('hora_fin').value = horaFin;
            // Deshabilitar el campo de hora fin para que no lo puedan modificar
            document.getElementById('hora_fin').disabled = false;
        } else {
            showFormValidation('No se puede asignar una clase después de las 2:00 PM (terminaría después de las 3:00 PM)', 'error');
            document.getElementById('hora_inicio').value = '';
            return;
        }
    }

    validateFormFields();
}

async function validateFormFields() {
    const grupoId = document.getElementById('grupo_id').value;
    const aulaId = document.getElementById('aula_id').value;
    const dia = document.getElementById('dia_semana').value;
    const horaInicio = document.getElementById('hora_inicio').value;
    const horaFin = document.getElementById('hora_fin').value;

    // Limpiar mensajes anteriores
    clearFormValidation();

    if (!grupoId || !aulaId || !dia || !horaInicio || !horaFin) {
        return;
    }

    // Validar horario institucional
    if (horaInicio < HORA_INICIO_INSTITUCIONAL || horaFin > HORA_FIN_INSTITUCIONAL) {
        showFormValidation('El horario debe estar entre 7:00 AM y 3:00 PM', 'error');
        return;
    }

    if (horaInicio === RECREO_INICIO) {
        showFormValidation('No se pueden asignar clases durante el recreo (9:00 - 10:00)', 'error');
        return;
    }


    if (horaInicio >= horaFin) {
        showFormValidation('La hora de fin debe ser mayor que la hora de inicio', 'error');
        return;
    }

    // Verificar disponibilidad
    showFormValidation('Verificando disponibilidad...', 'info');

    try {
        const response = await fetch(
            `../php/horarios_api.php?action=check_availability&grupo_id=${grupoId}&aula_id=${aulaId}&dia_semana=${dia}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`
        );
        const data = await response.json();

        if (data.success) {
            showFormValidation('✓ Horario disponible', 'success');
        } else {
            let mensaje = 'Conflictos encontrados:\n';
            data.data.conflictos.forEach(conflicto => {
                mensaje += `• ${conflicto.mensaje}\n`;
            });
            showFormValidation(mensaje, 'warning');
        }
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        showFormValidation('Error al verificar disponibilidad', 'error');
    }

    // Verificar créditos de la materia
    if (grupoId) {
        try {
            const response = await fetch(`../php/horarios_api.php?action=verificar_creditos&grupo_id=${grupoId}`);
            const data = await response.json();

            if (!data.success) {
                showFormValidation(data.message, 'error');
                return;
            } else if (data.data && data.data.puede_agregar === false) {
                showFormValidation(data.data.mensaje, 'warning');
                // Deshabilitar botón guardar
                const btnSubmit = document.querySelector('#formHorario button[type="submit"]');
                if (btnSubmit) btnSubmit.disabled = true;
                return;
            }
        } catch (error) {
            console.error('Error al verificar créditos:', error);
        }
    }
}

function showFormValidation(mensaje, tipo) {
    let validationDiv = document.getElementById('form-validation');

    if (!validationDiv) {
        validationDiv = document.createElement('div');
        validationDiv.id = 'form-validation';

        const modalBody = document.querySelector('#modalHorario .modal-body');
        modalBody.appendChild(validationDiv);
    }

    const clases = {
        'success': 'alert alert-success',
        'error': 'alert alert-danger',
        'warning': 'alert alert-warning',
        'info': 'alert alert-info'
    };

    validationDiv.className = clases[tipo] || clases.info;
    validationDiv.style.whiteSpace = 'pre-line';
    validationDiv.textContent = mensaje;
    validationDiv.style.display = 'block';
}

function clearFormValidation() {
    const validationDiv = document.getElementById('form-validation');
    if (validationDiv) {
        validationDiv.style.display = 'none';
    }

    const profesorInfo = document.getElementById('profesor-info');
    if (profesorInfo) {
        profesorInfo.remove();
    }
}

async function handleSubmitHorario(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    formData.append('action', 'create');

    try {
        showLoading(true);
        const response = await fetch('../php/horarios_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        showLoading(false);
        if (data.success) {
            notyf.success(data.message);
            closeModal('modalHorario');
            e.target.reset();
            clearFormValidation();
            await loadHorarios();
            renderSchedule();
            renderHorariosTable();
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al guardar el horario');
    } finally {
        showLoading(false);
    }
}

// ========== FUNCIONES AUXILIARES ==========

function showHorarioDetails(horario) {
    const horaInicio = horario.hora_inicio.substring(0, 5);
    const horaFin = horario.hora_fin.substring(0, 5);

    const mensaje = "Grupo: " + horario.grupo_nombre + "\n" +
        "Materia: " + horario.materia_nombre + "\n" +
        "Profesor: " + (horario.profesor_nombre || 'Sin profesor') + "\n" +
        "Aula: " + horario.aula_nombre + " (Edificio " + horario.aula_edificio + ")\n" +
        "Día: " + horario.dia_semana + "\n" +
        "Horario: " + horaInicio + " - " + horaFin;

    modalManager.openSuccess('Detalles del Horario', mensaje,null);
}

window.eliminarHorario = async function(id) {
    const confirmado = await showConfirm(
        '¿Estás seguro de eliminar este horario?',
        'Esta acción no se puede deshacer'
    );

    if (!confirmado) return;

    showLoading();

    try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        const response = await fetch('../php/horarios_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert(data.message, 'success');
            await loadHorarios();
            renderSchedule();
            renderHorariosTable();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al eliminar el horario', 'error');
    } finally {
        hideLoading();
    }
};

// Exponer funciones globales necesarias
window.openModalHorario = function() {
    // Limpiar formulario
    const form = document.getElementById('formHorario');
    if (form) form.reset();
    clearFormValidation();

    // Deshabilitar campos hasta seleccionar grupo
    document.getElementById('aula_id').disabled = true;
    document.getElementById('dia_semana').disabled = true;
    document.getElementById('hora_inicio').disabled = true;
    document.getElementById('hora_fin').disabled = true;

    openModal('modalHorario');
};

async function showConfirm() {
    return new Promise((resolve) => {
        const confirmed = confirm(...arguments);
        resolve(confirmed);
    });
}

// JS: agregar función para generar el PDF - archivo: `js/horarios.js` (añadir al final o donde convenga)
window.downloadSchedulePdf = function () {
    // Instancia de notificaciones si no existe (existe notyf en el proyecto)
    const nf = (typeof Notyf !== 'undefined') ? new Notyf() : null;

    const grid = document.querySelector('#scheduleContainer .schedule-grid');
    if (!grid) {
        if (nf) nf.error('Horario no disponible para exportar');
        return;
    }

    // Clonar la cuadrícula para no afectar el DOM visible
    const clone = grid.cloneNode(true);

    // Ajustes visuales para PDF
    clone.style.maxWidth = '100%';
    clone.style.boxSizing = 'border-box';
    clone.style.background = '#ffffff';
    // Opcional: eliminar elementos interactivos
    clone.querySelectorAll('button, select, input').forEach(el => el.remove());

    // Wrapper que se agrega temporalmente al body
    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.background = '#ffffff';
    wrapper.style.width = '100%';
    wrapper.style.boxSizing = 'border-box';
    wrapper.appendChild(clone);
    // Añadir al DOM (necesario para html2canvas en algunos navegadores)
    document.body.appendChild(wrapper);

    const opt = {
        margin:       0.4,
        filename:     'horario_semanal.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    if (nf) nf.open({type:'info', message: 'Generando PDF...'});

    html2pdf().set(opt).from(wrapper).save()
        .then(() => {
            if (nf) nf.success('PDF generado');
        })
        .catch((err) => {
            if (nf) nf.error('Error al generar PDF');
            console.error('html2pdf error:', err);
        })
        .finally(() => {
            // limpiar wrapper temporal
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        });
}
