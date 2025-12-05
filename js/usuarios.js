import {showLoading, notyf} from './notify/Config.js';
import {ModalManager} from './utils/ModalManager.js';

const modalManager = new ModalManager();

// Gestión de Usuarios - Docentes
document.addEventListener('DOMContentLoaded', function () {
    loadUsers();
    loadProfesoresSelect();

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(function () {
        loadUsers();
    }, 550));

    // Filtro por estado
    const filterActivo = document.getElementById('filterActivo');
    filterActivo.addEventListener('change', function () {
        loadUsers();
    });

    const formDocente = document.getElementById('formUsuario');
    if (formDocente) {
        formDocente.addEventListener('submit', handleSubmitDocente);
    }

    // Botón de nuevo docente
    const btnNew = document.getElementById('btnNewUsuario');
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            // limpiar form antes de abrir
            const form = document.getElementById('formUsuario');
            if (form) form.reset();
            document.getElementById('usuario_id').value = '';
            document.getElementById('docente_id').disabled = false;
            document.getElementById('modalUsuarioTitle').textContent = 'Nuevo Usuario';
            loadProfesoresSelect();
        });
    }
});

// Cargar Usuarios
async function loadUsers() {
    const tbody = document.getElementById('usuariosTableBody');
    const search = document.getElementById('searchInput')?.value || '';
    const activo = document.getElementById('filterActivo')?.value || '';

    try {
        showLoading(true);
        const response = await fetch(`../php/usuarios_api.php?action=list&search=${encodeURIComponent(search)}&activo=${activo}`);
        const data = await response.json();

        if (data.success) {
            renderUsuarios(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar los usuarios</td></tr>';
        }

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar los usuarios</td></tr>';
        notyf.error('Error al cargar los usuarios');
    } finally {
        showLoading(false);
    }
}

function renderUsuarios(data) {
    const tbody = document.getElementById('usuariosTableBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron usuarios</td></tr>';
        return;
    }

    data.forEach(usuario => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.docente_nombre}</td>
            <td>${usuario.email}</td>
            <td>${usuario.rol}</td>
            <td>
                <span class="badge badge-${usuario.activo == 1 ? 'success' : 'error'}">
                    ${usuario.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-secondary" onclick="editUsuario(${usuario.id})" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUsuario(${usuario.id})" title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Agregar eventos a los botones de editar y eliminar
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            // Abrir modal de edición (función no implementada en este snippet)
            // openEditUserModal(userId);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            // Confirmar y eliminar usuario (función no implementada en este snippet)
            // deleteUser(userId);
        });
    });
}

async function loadProfesoresSelect() {
    try {
        const url = '../php/usuarios_api.php?action=list_docentes_sin_registro';
        const response = await fetch(url);
        const data = await response.json();

        // reset opciones
        const select = document.getElementById('docente_id');
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

// Manejar envío de formulario
async function handleSubmitDocente(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const usuario_id = formData.get('usuario_id');
    const action = usuario_id ? 'update' : 'create';

    // Agregar activo como checkbox
    formData.set('activo', document.getElementById('activo').checked ? '1' : '0');
    formData.set('action', action);

    modalManager.openInfo(
        'Confirmar Acción',
        `¿Estás seguro de que deseas ${action === 'create' ? 'crear' : 'actualizar'} este usuario?`,
        async () => {
            await submitUsuarioForm(formData, form, action);
            modalManager.closeModal(ModalManager.ModalType.INFO);
        });
}

// Enviar formulario al servidor
async function submitUsuarioForm(formData, form, action) {
    try {
        showLoading(true);
        const response = await fetch('../php/usuarios_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            notyf.success(data.message);
            closeModal('modalUsuario');
            form.reset();

            modalManager.openSuccess(
                'Operación Exitosa',
                `El usuario ha sido ${action === 'create' ? 'registrado' : 'actualizado'} exitosamente.`,
                () => {
                    loadUsers();
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

// Editar usuario
window.editUsuario = async (id) => {
    try {
        showLoading(true);
        const response = await fetch(`../php/usuarios_api.php?action=get&id=${id}`);
        const data = await response.json();

        showLoading(false);
        if (data.success) {
            const usuario = data.data;

            document.getElementById('usuario_id').value = usuario.id;
            document.getElementById('docente_id').disabled = true;
            document.getElementById('docente_id').value = usuario.docente_id;

            document.getElementById('email').value = usuario.email;
            document.getElementById('password').value = usuario.password;
            document.getElementById('passwordConfirm').value = usuario.password;

            document.getElementById('activo').checked = usuario.activo === 1;

            document.getElementById('modalUsuarioTitle').textContent = 'Editar Usuario';
            openModal('modalUsuario');
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        notyf.error('Error al cargar el docente');
    } finally {
        showLoading(false)
    }
}

// Eliminar usuario
window.deleteUsuario = async (id) => {
    modalManager.openWarning('Confirmar Eliminación',
        '¿Estás seguro de que deseas eliminar este usuario?', async () => {
            await performDeleteUsuario(id);
            modalManager.closeModalPop();
        });
}

async function performDeleteUsuario(id) {
    try {
        showLoading(true);

        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        const response = await fetch('../php/usuarios_api.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);

        if (data.success) {
            notyf.success(data.message);
        } else {
            notyf.error(data.message);
        }
        await loadUsers();
    } catch (error) {
        notyf.error('Error al eliminar el docente');
    } finally {
        showLoading(false);
    }
}
