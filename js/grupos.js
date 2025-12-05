import {showLoading, notyf} from './notify/Config.js';
import {ModalManager} from './utils/ModalManager.js';

const modalManager = new ModalManager();

document.addEventListener('DOMContentLoaded', function () {
    loadGrupos();
    loadCarrerasSelect();
    loadMateriasSelect();

    const formGrupo = document.getElementById('formGrupo');
    if (formGrupo) {
        formGrupo.addEventListener('submit', handleSubmitGrupo);
    }

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            loadGrupos();
        }, 550));
    }

    // Filtros
    const filterCarrera = document.getElementById('filterCarrera');
    const filterSemestre = document.getElementById('filterSemestre');
    filterCarrera.addEventListener('change', function () {
        loadGrupos();
    });
    filterSemestre.addEventListener('change', function () {
        loadGrupos();
    });
});

async function loadGrupos() {
    const tbody = document.getElementById('gruposTableBody');
    const search = document.getElementById('searchInput')?.value || '';
    const carrera = document.getElementById('filterCarrera')?.value || '';
    const semestre = document.getElementById('filterSemestre')?.value || '';

    try {
        showLoading(true);
        const response = await fetch(`../php/grupos_api.php?action=list&search=${encodeURIComponent(search)}&carrera=${carrera}&semestre=${semestre}`);
        const data = await response.json();
        showLoading(false);

        if (data.success) {
            renderGrupos(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar grupos</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar grupos</td></tr>';
    } finally {
        showLoading(false);
    }
}

// Cargar carreras para el select y filtro
async function loadCarrerasSelect() {
    try {
        const response = await fetch('../php/carreras_api.php?action=list');
        const data = await response.json();

        if (data.success) {
            const selectFiltro = document.getElementById('filterCarrera');
            const selectModal = document.getElementById('carrera_id');
            data.data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.id;
                option.textContent = carrera.nombre;
                selectModal.appendChild(option.cloneNode(true));
                selectFiltro.appendChild(option);
            });

            selectFiltro.addEventListener('change', async () => {
                await loadSemestreSelectFilter(selectFiltro.value);
                loadGrupos();
            });

            selectModal.addEventListener('change', () => {
                loadSemestreSelectModal(selectModal.value);
                loadMateriasSelect(selectModal.value, '');
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar los semestres para filtrar
async function loadSemestreSelectFilter(idCarrara = '') {
    const select = document.getElementById('filterSemestre');
    if (idCarrara === '') {
        select.innerHTML = '<option value="">Todos los semestres</option>';
        select.value = "";
        return;
    }

    const nombre_semestre = {
        1: "1er",
        2: "2do",
        3: "3er",
        4: "4to",
        5: "5to",
        6: "6to",
        7: "7mo",
        8: "8vo",
        9: "9no",
        10: "10mo",
        11: "11",
        12: "12",
        13: "13",
        14: "14",
        15: "15",
        16: "16"
    };
    try {
        const url = `../php/carreras_api.php?action=get&id=${idCarrara}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            const size = data.data.duracion_semestres;

            select.innerHTML = '<option value="">Todos los semestres</option>';
            for (let i = 1; i <= size; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = nombre_semestre[i] + " Semestre";
                select.appendChild(option);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar los semestres para filtrar
async function loadSemestreSelectModal(idCarrara = '') {
    const select = document.getElementById('semestre_actual');
    if (idCarrara === '') {
        select.innerHTML = '<option value="">Selecciona la carrera ...</option>';
        select.value = "";
        return;
    }

    const nombre_semestre = {
        1: "1er",
        2: "2do",
        3: "3er",
        4: "4to",
        5: "5to",
        6: "6to",
        7: "7mo",
        8: "8vo",
        9: "9no",
        10: "10mo",
        11: "11",
        12: "12",
        13: "13",
        14: "14",
        15: "15",
        16: "16"
    };
    try {
        const url = `../php/carreras_api.php?action=get&id=${idCarrara}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            const size = data.data.duracion_semestres;

            select.innerHTML = '<option value="">Todos los semestres</option>';
            for (let i = 1; i <= size; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = nombre_semestre[i] + " Semestre";
                select.appendChild(option);
            }

            const selectCarrera = document.getElementById('carrera_id');
            select.addEventListener('change', () => {
                loadMateriasSelect(selectCarrera.value, select.value);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

function renderGrupos(grupos) {
    const tbody = document.getElementById('gruposTableBody');

    if (grupos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron grupos</td></tr>';
        return;
    }
    const construirDateTime = (dateString) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
        return date.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
    }

    tbody.innerHTML = grupos.map(grupo => `
        <tr>
            <td><strong>${grupo.nombre}</strong></td>
            <td>${grupo.materia_nombre}</td>
         <td>
            <div class="badge ${grupo.profesor_nombre ? 'badge-info' : 'badge-error'}">
                ${grupo.profesor_nombre ? grupo.profesor_nombre : 'Sin asignar'}
            </div>
        </td>
            <td>${grupo.num_estudiantes} / ${grupo.cupo_maximo}</td>
            <td>${grupo.periodo_academico}</td>
            <td>
                ${construirDateTime(grupo.fecha_creacion)}
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-secondary" onclick="editGrupo(${grupo.id})" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGrupo(${grupo.id})" title="Eliminar">
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

async function loadMateriasSelect(idCarrera = '', semestre = '') {
    try {
        const response = await fetch(`../php/materias_api.php?action=list&carrera=${idCarrera}&semestre=${semestre}`);
        const data = await response.json();

        if (data.success) {
            let duracion = 0;
            const select = document.getElementById('materia_id');
            select.innerHTML = '<option value="">Seleccionar...</option>';

            data.data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = `${materia.nombre} (${materia.codigo})`;
                duracion = materia.duracion;
                select.appendChild(option);
            });

            // Cuando cambie la materia, recargar profesores filtrados
            select.addEventListener('change', () => {
                loadProfesoresSelect(select.value);
                loadSemestreSelect(duracion);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadProfesoresSelect(materiaId = '') {
    try {
        const url = `../php/docentes_api.php?action=list&activo=1${materiaId ? `&materia_id=${materiaId}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        // reset opciones
        const select = document.getElementById('profesor_id');
        select.innerHTML = '<option value="">Seleccionar...</option>';

        if (data.success) {
            data.data.forEach(profesor => {
                const option = document.createElement('option');
                option.value = profesor.id;
                option.textContent = `${profesor.nombre} ${profesor.apellido}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadSemestreSelect(size = 0) {
    const nombre_semestre = {
        1: "1er",
        2: "2do",
        3: "3er",
        4: "4to",
        5: "5to",
        6: "6to",
        7: "7mo",
        8: "8vo",
        9: "9no",
        10: "10mo",
        11: "11",
        12: "12",
        13: "13",
        14: "14",
        15: "15",
        16: "16"
    };
    try {
        const select = document.getElementById('semestre_actual');
        select.innerHTML = '<option value="">Seleccionar...</option>';
        for (let i = 1; i <= size; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = nombre_semestre[i] + " Semestre";
            select.appendChild(option);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleSubmitGrupo(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const grupo_id = formData.get('grupo_id');
    const action = grupo_id ? 'update' : 'create';
    formData.set('action', action);

    modalManager.openInfo(
        'Confirmar Acción',
        `¿Estás seguro de que deseas ${action === 'create' ? 'crear' : 'actualizar'} este grupo?`,
        async () => {
            await confirmSubmitGrupo(formData, form, action);
            modalManager.closeModal(ModalManager.ModalType.INFO);
        });
}

async function confirmSubmitGrupo(formData, form, action) {

    try {
        showLoading(true);
        const response = await fetch('../php/grupos_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);
        if (data.success) {
            notyf.success(data.message);
            closeModal('modalGrupo'); // Modal Close Grupo
            modalManager.openSuccess( // Modal Success
                'Operación Exitosa',
                `El grupo ha sido ${action === 'create' ? 'creado' : 'actualizado'} exitosamente.`,
                () => {
                    form.reset();
                    loadGrupos();
                    modalManager.closeModalPop();
                });

        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al guardar el grupo');
    } finally {
        showLoading(false);
    }
}

window.editGrupo = async (id) => {
    try {
        showLoading(true);
        const response = await fetch(`../php/grupos_api.php?action=get&id=${id}`);
        const data = await response.json();
        showLoading(false);
        if (data.success) {
            const grupo = data.data;

            document.getElementById('grupo_id').value = grupo.id;
            document.getElementById('materia_id').value = grupo.materia_id;

            // cargar profesores filtrados por la materia y luego asignar el profesor seleccionado
            await loadProfesoresSelect(grupo.materia_id);
            document.getElementById('profesor_id').value = grupo.profesor_id || '';

            document.getElementById('profesor_id').value = grupo.profesor_id;
            document.getElementById('nombre').value = grupo.nombre;
            document.getElementById('cupo_maximo').value = grupo.cupo_maximo;
            document.getElementById('alumnos_inscriptos').value = grupo.alumnos_inscriptos;
            document.getElementById('semestre_actual').value = grupo.semestre_actual;
            document.getElementById('periodo_academico').value = grupo.periodo_academico;

            document.getElementById('modalGrupoTitle').textContent = 'Editar Grupo';
            openModal('modalGrupo');
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al cargar el grupo');
    } finally {
        showLoading(false);
    }
}

window.deleteGrupo = async (id) => {
    modalManager.openWarning(
        '¿Estás seguro de que deseas eliminar este grupo?',
        'Esta acción no se puede deshacer.',
        async () => {
            await confirmDeleteGrupo(id);
            modalManager.closeModalPop();
        });
};

async function confirmDeleteGrupo(id) {
    try {
        showLoading(true);
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        const response = await fetch('../php/grupos_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);

        if (data.success) {
            notyf.success(data.message);
            await loadGrupos();
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al eliminar el grupo')
    } finally {
        showLoading(false);
    }
}
