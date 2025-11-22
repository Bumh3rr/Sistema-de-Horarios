import {showLoading, notyf} from './notify/Config.js';

document.addEventListener('DOMContentLoaded', function () {
    loadMaterias();
    loadCarrerasSelect();

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            console.log(searchInput.value);
            loadMaterias();
        }, 300));
    }

    // Filtros
    const filterCarrera = document.getElementById('filterCarrera');
    const filterSemestre = document.getElementById('filterSemestre');

    if (filterCarrera) {
        filterCarrera.addEventListener('change', function () {
            loadMaterias();
        });
    }

    if (filterSemestre) {
        filterSemestre.addEventListener('change', function () {
            loadMaterias();
        });
    }

    // Formulario de materia
    const formMateria = document.getElementById('formMateria');
    if (formMateria) {
        formMateria.addEventListener('submit', handleSubmitMateria);
    }
});

// Cargar carreras para el select y filtro
async function loadCarrerasSelect() {
    try {
        const response = await fetch('../php/carreras_api.php?action=list');
        const data = await response.json();

        if (data.success) {
            const selectModal = document.getElementById('carrera_id');
            const selectFiltro = document.getElementById('filterCarrera');

            data.data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.id;
                option.textContent = carrera.nombre;
                selectModal.appendChild(option.cloneNode(true));
                if (selectFiltro) selectFiltro.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar materias
async function loadMaterias() {
    const tbody = document.getElementById('materiasTableBody');
    const search = document.getElementById('searchInput')?.value || '';
    const carrera = document.getElementById('filterCarrera')?.value || '';
    const semestre = document.getElementById('filterSemestre')?.value || '';

    try {
        const response = await fetch(`../php/materias_api.php?action=list&search=${encodeURIComponent(search)}&carrera=${carrera}&semestre=${semestre}`);
        const data = await response.json();

        if (data.success) {
            renderMaterias(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar materias</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar materias</td></tr>';
    }
}

// Renderizar materias en tabla
function renderMaterias(materias) {
    const tbody = document.getElementById('materiasTableBody');

    if (materias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron materias</td></tr>';
        return;
    }

    tbody.innerHTML = materias.map(materia => `
        <tr>
            <td><span class="badge badge-primary">${materia.codigo}</span></td>
            <td><strong>${materia.nombre}</strong></td>
            <td>${materia.carrera_nombre}</td>
            <td>${materia.semestre}° Sem</td>
            <td>${materia.creditos}</td>
            <td>${materia.horas_semanales} hrs</td>
            <td>
                <div class="flex gap-1">
                    <!-- Botones de acción 
                    <button class="btn btn-sm btn-primary" onclick="editMateria(${materia.id})" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M3 21v-2a4 4 0 0 1 4-4h4c.96 0 1.84.338 2.53.901M16 3.13a4 4 0 0 1 0 7.75M16 19h6m-3-3v6"/></svg>
                    </button>
                    -->
                    <button class="btn btn-sm btn-secondary" onclick="editMateria(${materia.id})" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMateria(${materia.id})" title="Eliminar">
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
async function handleSubmitMateria(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const materia_id = formData.get('materia_id');
    const action = materia_id ? 'update' : 'create';

    // Validaciones
    const semestre = parseInt(formData.get('semestre'));
    const creditos = parseInt(formData.get('creditos'));
    const horas = parseInt(formData.get('horas_semanales'));

    if (semestre < 1 || semestre > 12) {
        notyf.error('El semestre debe estar entre 1 y 12');
        return;
    }

    if (creditos < 1 || creditos > 6) {
        notyf.error('Los créditos deben estar entre 1 y 7');
        return;
    }

    if (horas < 1 || horas > 40) {
        notyf.error('Las horas semanales deben estar entre 1 y 7');
        return;
    }

    formData.set('action', action);

    try {
        showLoading(true);
        const response = await fetch('../php/materias_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            notyf.success(data.message);
            closeModal('modalMateria');
            await loadMaterias();
            form.reset();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al guardar la materia');
    }finally {
        showLoading(false);
    }
}

// Editar materia
window.editMateria = async (id) => {
    try {
        const response = await fetch(`../php/materias_api.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            const materia = data.data;

            document.getElementById('materia_id').value = materia.id;
            document.getElementById('codigo').value = materia.codigo;
            document.getElementById('nombre').value = materia.nombre;
            document.getElementById('carrera_id').value = materia.carrera_id;
            document.getElementById('semestre').value = materia.semestre;
            document.getElementById('creditos').value = materia.creditos;
            document.getElementById('horas_semanales').value = materia.horas_semanales;
            document.getElementById('descripcion').value = materia.descripcion || '';

            document.getElementById('modalMateriaTitle').textContent = 'Editar Materia';
            openModal('modalMateria');
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar la materia', 'error');
    }
}

window.deleteMateria = async (id) => {
    if (!confirmDelete('¿Estás seguro de que deseas eliminar esta materia?')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        const response = await fetch('../php/materias_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert(data.message, 'success');
            loadMaterias();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al eliminar la materia', 'error');
    }
}