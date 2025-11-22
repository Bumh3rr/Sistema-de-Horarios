import {showLoading, notyf} from './notify/Config.js';

// Gestión de Aulas
document.addEventListener('DOMContentLoaded', function() {
    loadAulas();

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            loadAulas();
        }, 300));
    }

    // Filtro por tipo
    const filterTipo = document.getElementById('filterTipo');
    if (filterTipo) {
        filterTipo.addEventListener('change', function() {
            loadAulas();
        });
    }

    // Formulario de aula
    const formAula = document.getElementById('formAula');
    if (formAula) {
        formAula.addEventListener('submit', handleSubmitAula);
    }
});

// Cargar aulas
async function loadAulas() {
    const tbody = document.getElementById('aulasTableBody');
    const search = document.getElementById('searchInput')?.value || '';
    const tipo = document.getElementById('filterTipo')?.value || '';

    try {
        const response = await fetch(`../php/aulas_api.php?action=list&search=${encodeURIComponent(search)}&tipo=${tipo}`);
        const data = await response.json();

        if (data.success) {
            renderAulas(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar aulas</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar aulas</td></tr>';
    }
}

// Renderizar aulas en tabla
function renderAulas(aulas) {
    const tbody = document.getElementById('aulasTableBody');

    if (aulas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron aulas</td></tr>';
        return;
    }

    const tipoColors = {
        'teorica': 'primary',
        'laboratorio': 'warning',
        'auditorio': 'warning',
        'taller': 'success',
        'redes': 'error',
        'computacion': 'info',
        'software': 'info'
    };

    const tipoNames = {
        'teorica': 'Teórica',
        'laboratorio': 'Laboratorio',
        'auditorio': 'Auditorio',
        'taller': 'Taller',
        'redes': 'Redes',
        'computacion': 'Computación',
        'software': 'Software'
    };

    tbody.innerHTML = aulas.map(aula => `
        <tr>
            <td><strong>${aula.nombre}</strong></td>
            <td>${aula.edificio}</td>
            <td>${aula.capacidad} personas</td>
            <td><span class="badge badge-${tipoColors[aula.tipo]}">${tipoNames[aula.tipo]}</span></td>
            <td>${aula.recursos || '-'}</td>
            <td>
                <span class="badge badge-${aula.activo == 1 ? 'success' : 'error'}">
                    ${aula.activo == 1 ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-secondary" onclick="editAula(${aula.id})" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAula(${aula.id})" title="Eliminar">
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
async function handleSubmitAula(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const aula_id = formData.get('aula_id');
    const action = aula_id ? 'update' : 'create';

    // Agregar activo como checkbox
    formData.set('activo', document.getElementById('activo').checked ? '1' : '0');
    formData.set('action', action);

    try {
        const response = await fetch('../php/aulas_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert(data.message, 'success');
            closeModal('modalAula');
            loadAulas();
            form.reset();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al guardar el aula', 'error');
    }
}

// Editar aula
async function editAula(id) {
    try {
        const response = await fetch(`../php/aulas_api.php?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            const aula = data.data;

            document.getElementById('aula_id').value = aula.id;
            document.getElementById('nombre').value = aula.nombre;
            document.getElementById('edificio').value = aula.edificio;
            document.getElementById('capacidad').value = aula.capacidad;
            document.getElementById('tipo').value = aula.tipo;
            document.getElementById('recursos').value = aula.recursos || '';
            document.getElementById('activo').checked = aula.activo == 1;

            document.getElementById('modalAulaTitle').textContent = 'Editar Aula';
            openModal('modalAula');
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar el aula', 'error');
    }
}

// Eliminar aula
async function deleteAula(id) {
    if (!confirmDelete('¿Estás seguro de que deseas eliminar esta aula?')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        const response = await fetch('../php/aulas_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert(data.message, 'success');
            loadAulas();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al eliminar el aula', 'error');
    }
}