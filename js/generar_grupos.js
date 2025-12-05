import {showLoading, notyf} from './notify/Config.js';
import {ModalManager} from './utils/ModalManager.js';

const modalManager = new ModalManager();

document.addEventListener('DOMContentLoaded', function () {
    loadMaterias();
    loadCarrerasSelect();

    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(function () {
        loadMaterias();
    }, 550));

    // Filtros
    const filterCarrera = document.getElementById('filterCarrera');
    const filterSemestre = document.getElementById('filterSemestre');
    filterCarrera.addEventListener('change', function () {
        loadMaterias();
    });
    filterSemestre.addEventListener('change', function () {
        loadMaterias();
    });

    // Formulario de materia
    const formMateria = document.getElementById('formAgregarAlumnos');
    formMateria.addEventListener('submit', handleSubmitMateria);
});

// Cargar materias
async function loadMaterias() {
    const tbody = document.getElementById('materiasTableBody');
    const search = document.getElementById('searchInput')?.value || '';
    const carrera = document.getElementById('filterCarrera')?.value || '';
    const semestre = document.getElementById('filterSemestre')?.value || '';

    try {
        showLoading(true);
        const response = await fetch(`../php/materias_api.php?action=list&search=${encodeURIComponent(search)}&carrera=${carrera}&semestre=${semestre}`);
        const data = await response.json();
        showLoading(false);

        if (data.success) {
            renderMaterias(data.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar materias</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar materias</td></tr>';
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
            data.data.forEach(carrera => {
                const option = document.createElement('option');
                option.value = carrera.id;
                option.textContent = carrera.nombre;
                selectFiltro.appendChild(option);
            });

            selectFiltro.addEventListener('change', async () => {
                await loadSemestreSelectFilter(selectFiltro.value);
                loadMaterias();
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
            <td>
                <button class="btn btn-primary" onclick="agregarAlumnos(${materia.id})" title="agregar">
                    <div style="display: flex; flex-flow: row wrap; align-items: center; justify-content: center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M15 8A5 5 0 1 0 5 8a5 5 0 0 0 10 0m2.5 13v-7M14 17.5h7"/><path d="M3 20a7 7 0 0 1 11-5.745"/></g></svg>
                            <p style="font-size: 11px;">Generar Grupos</p>
                    </div>
                </button>
            </td>
        </tr>
    `).join('');
}

// Manejar envío de formulario
async function handleSubmitMateria(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const action = 'generar';

    // Validaciones
    const numero_alumnos = parseInt(formData.get('numero_alumnos'));
    const min_alumnos = parseInt(formData.get('min_alumnos'));
    const periodo_academico = formData.get('periodo_academico');

    if (numero_alumnos < min_alumnos || numero_alumnos > 200) {
        notyf.error(`El número de alumnos debe estar entre ${min_alumnos} y 200`);
        return;
    }

    if (!periodo_academico || periodo_academico.trim() === '') {
        notyf.error('El periodo académico es obligatorio');
        return;
    }
    formData.set('action', action);

    modalManager.openInfo(
        'Confirmar Acción',
        '¿Estás seguro de que deseas guardar estos cambios?',
        async () => {
            await save(formData, form, action);
            modalManager.closeModal(ModalManager.ModalType.INFO);
        });
}

async function save(formData, form, action) {
    try {
        showLoading(true);
        const response = await fetch(`../php/grupos_api.php?action=${action}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showLoading(false);

        if (data.success) {
            notyf.success(data.message);
            closeModal('modalAgregarAlumnos');
            await loadMaterias();
            form.reset();
            mostrarModalGruposGenerados(data);
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al guardar la materia');
    } finally {
        showLoading(false);
    }
}

// JavaScript
function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        })[s];
    });
}

function renderGeneratedGroups(response) {
    const container = document.getElementById('info-generated-content');
    if (!container) return;

    const created = (response && response.data && response.data.grupos_creados) || [];
    const omitted = (response && response.data && response.data.grupos_omitidos) || [];

    let html = '';

    html += `<div class="generated-summary" style="display:flex;flex-direction:column;gap:16px;">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;">`;
    html += `<div><strong>Grupos creados:</strong> ${created.length}</div>`;
    html += `<div style="color:#b45309;"><strong>Omitidos:</strong> ${omitted.length}</div>`;
    html += `</div>`;

    if (created.length > 0) {
        html += `<div class="created-groups">`;
        html += `<h4 style="margin:8px 0 6px 0;">Grupos creados</h4>`;
        html += `<div style="display:flex;flex-wrap:wrap;gap:12px;">`;
        created.forEach(g => {
            html += `
                <div class="group-card" style="border:1px solid #e6e6f7;border-radius:8px;padding:12px;width:220px;background:#fff;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <div style="font-weight:600;font-size:14px;">${escapeHtml(g.nombre_grupo)}</div>
                        <div style="font-size:12px;color:#6b7280;">ID: ${escapeHtml(g.grupo_id)}</div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="font-size:13px;color:#374151;">Alumnos:</div>
                        <div style="background:#eef2ff;color:#4f46e5;padding:4px 8px;border-radius:999px;font-weight:600;">${escapeHtml(g.alumnos_inscriptos)}</div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    } else {
        html += `<div style="color:#6b7280;">No se crearon grupos.</div>`;
    }

    if (omitted.length > 0) {
        html += `<div class="omitted-groups" style="margin-top:8px;">`;
        html += `<h4 style="margin:8px 0 6px 0;color:#92400e;">Grupos omitidos</h4>`;
        html += `<div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;">`;
        html += `<thead><tr style="background:#fff7ed;color:#92400e;text-align:left;"><th style="padding:8px;border-bottom:1px solid #f3e8ff;">Grupo</th><th style="padding:8px;border-bottom:1px solid #f3e8ff;">Alumnos</th><th style="padding:8px;border-bottom:1px solid #f3e8ff;">Motivo</th></tr></thead><tbody>`;
        omitted.forEach(o => {
            html += `<tr><td style="padding:8px;border-bottom:1px solid #f3f4f6;">${escapeHtml(o.nombre_grupo)}</td><td style="padding:8px;border-bottom:1px solid #f3f4f6;">${escapeHtml(o.alumnos_inscriptos)}</td><td style="padding:8px;border-bottom:1px solid #f3f4f6;color:#92400e">${escapeHtml(o.motivo)}</td></tr>`;
        });
        html += `</tbody></table></div>`;
        html += `</div>`;
    }

    html += `</div>`; // cierre generated-summary

    container.innerHTML = html;
}

// Reemplaza la función actual por esta para mostrar datos y abrir el modal
function mostrarModalGruposGenerados(response) {
    renderGeneratedGroups(response);
    openModal('modal-info-generated');
}

async function updateMateriaDetalle({nombre, semestre, carrera, carreraId}) {
    const nombreEl = document.getElementById('detalleMateriaNombre');
    const semestreEl = document.getElementById('detalleMateriaSemestre');
    const carreraEl = document.getElementById('detalleMateriaCarrera');

    let carreraNombre = carrera || '';

    if (!carreraNombre && carreraId) {
        try {
            const response = await fetch(`../php/carreras_api.php?action=get&id=${carreraId}`);
            const data = await response.json();
            if (data.success && data.data?.nombre) {
                carreraNombre = data.data.nombre;
            }
        } catch (error) {
            console.error('Error al obtener la carrera:', error);
        }
    }

    nombreEl.textContent = nombre || 'Sin información';
    semestreEl.textContent = semestre ? `${semestre}° Semestre` : 'Sin semestre';
    carreraEl.textContent = carreraNombre || 'Sin carrera';
}

// Editar materia
window.agregarAlumnos = async (id) => {
    try {
        showLoading(true);
        const response = await fetch(`../php/materias_api.php?action=get&id=${id}`);
        const data = await response.json();

        showLoading(false);
        if (data.success) {
            const materia = data.data;

            document.getElementById('materia_id').value = materia.id;
            document.getElementById('semestre_actual').value = materia.semestre;

            await updateMateriaDetalle({
                nombre: materia.nombre,
                semestre: materia.semestre,
                carrera: materia.carrera_nombre,
                carreraId: materia.carrera_id
            });

            openModal('modalAgregarAlumnos');
        } else {
            notyf.error(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Error al cargar la materia');
    } finally {
        showLoading(false);
    }
}
