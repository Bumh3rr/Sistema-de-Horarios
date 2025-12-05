let dashboardData = {
    horarios: [],
    docentes: [],
    materias: [],
    aulas: [],
    grupos: [],
    carreras: []
};

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    loadTopMaterias(5);
    loadTopDocentes(5);
});

async function initDashboard() {
    try {
        showLoading();
        await loadAllData();
        renderStats();
        renderCharts();
        renderAlerts();
        hideLoading();
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        hideLoading();
        showAlert('Error al cargar el dashboard', 'error');
    }
}

// Cargar todos los datos
async function loadAllData() {
    try {
        const [horarios, docentes, materias, aulas, grupos, carreras] = await Promise.all([
            fetchAPI('../php/horarios_api.php?action=list'),
            fetchAPI('../php/docentes_api.php?action=top'),
            fetchAPI('../php/materias_api.php?action=top'),
            fetchAPI('../php/aulas_api.php?action=list'),
            fetchAPI('../php/grupos_api.php?action=list'),
            fetchAPI('../php/carreras_api.php?action=list')
        ]);

        dashboardData = {
            horarios: horarios.data || [],
            docentes: docentes.data || [],
            materias: materias.data || [],
            aulas: aulas.data || [],
            grupos: grupos.data || [],
            carreras: carreras.data || []
        };
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Fetch API helper
async function fetchAPI(url) {
    const response = await fetch(url);
    return await response.json();
}

// Renderizar estadísticas
function renderStats() {
    // Total Horarios
    const totalHorarios = dashboardData.horarios.length;
    animateValue('totalHorarios', 0, totalHorarios, 1000);

    // Docentes
    const docentesActivos = dashboardData.docentes.filter(d => d.activo == 1).length;
    const docentesConHorario = new Set(dashboardData.horarios.map(h => h.profesor_id)).size;
    animateValue('totalDocentes', 0, docentesActivos, 1000);
    animateValue('docentesActivos', 0, docentesActivos, 1000);
    document.getElementById('docentesConHorario').textContent = docentesConHorario;

    // Materias
    const totalMaterias = dashboardData.materias.length;
    const materiasConGrupo = new Set(dashboardData.grupos.map(g => g.materia_id)).size;
    animateValue('totalMaterias', 0, totalMaterias, 1000);
    document.getElementById('materiasConGrupo').textContent = materiasConGrupo;
    document.getElementById('gruposTotal').textContent = dashboardData.grupos.length;

    // Aulas
    const totalAulas = dashboardData.aulas.length;
    const aulasOcupadas = new Set(dashboardData.horarios.map(h => h.aula_id)).size;
    const aulasLibres = totalAulas - aulasOcupadas;
    animateValue('totalAulas', 0, totalAulas, 1000);
    animateValue('aulasOcupadas', 0, aulasOcupadas, 1000);
    document.getElementById('aulasLibres').textContent = aulasLibres;

    // Mini cards
    animateValue('totalGrupos', 0, dashboardData.grupos.length, 1000);
    animateValue('totalCarreras', 0, dashboardData.carreras.length, 1000);
    animateValue('horasSemanales', 0, totalHorarios, 1000);

    // Conflictos (simplificado)
    const conflictos = detectarConflictos();
    animateValue('conflictosTotal', 0, conflictos, 1000);
}

// Animar valores numéricos
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = Math.round(end);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// Detectar conflictos (simplificado)
function detectarConflictos() {
    let conflictos = 0;
    const horariosPorCelda = {};

    dashboardData.horarios.forEach(h => {
        const key = `${h.dia_semana}-${h.hora_inicio}-${h.aula_id}`;
        if (horariosPorCelda[key]) {
            conflictos++;
        }
        horariosPorCelda[key] = true;
    });

    return conflictos;
}

// Renderizar gráficas
function renderCharts() {
    renderAulasChart();
}

// Gráfica de ocupación de aulas
function renderAulasChart() {
    const container = document.getElementById('aulasChart');
    if (!container) return;

    // Agrupar aulas por edificio
    const aulasPorEdificio = {};
    dashboardData.aulas.forEach(aula => {
        if (!aulasPorEdificio[aula.edificio]) {
            aulasPorEdificio[aula.edificio] = {
                total: 0,
                ocupadas: 0
            };
        }
        aulasPorEdificio[aula.edificio].total++;

        // Verificar si tiene horarios
        const tieneHorarios = dashboardData.horarios.some(h => h.aula_id == aula.id);
        if (tieneHorarios) {
            aulasPorEdificio[aula.edificio].ocupadas++;
        }
    });

    // Renderizar barras de progreso
    container.innerHTML = '';
    Object.keys(aulasPorEdificio).sort().forEach(edificio => {
        const data = aulasPorEdificio[edificio];
        const porcentaje = (data.ocupadas / data.total * 100).toFixed(0);

        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
            <div class="progress-header">
                <div class="progress-label">
                    <span>Edificio ${edificio}</span>
                    <span class="progress-badge">${data.total} aulas</span>
                </div>
                <div class="progress-value">${porcentaje}%</div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 0%" data-width="${porcentaje}%"></div>
            </div>
        `;
        container.appendChild(item);
    });

    // Animar barras
    setTimeout(() => {
        container.querySelectorAll('.progress-bar-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);
}

// Renderizar alertas
function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    const alerts = [];

    // Docentes sobrecargados
    const docentesSobrecargados = dashboardData.docentes.filter(d => {
        const horas = dashboardData.horarios.filter(h => h.profesor_id == d.id).length;
        const maxHoras = d.turno === 'medio' ? 20 : 22;
        return horas > maxHoras;
    });

    if (docentesSobrecargados.length > 0) {
        alerts.push({
            type: 'danger',
            title: `${docentesSobrecargados.length} docente(s) sobrecargado(s)`,
            text: 'Algunos docentes exceden su carga máxima de horas semanales.'
        });
    }

    // Docentes con poca carga
    const docentesPocaCarga = dashboardData.docentes.filter(d => {
        const horas = dashboardData.horarios.filter(h => h.profesor_id == d.id).length;
        const minHoras = d.turno === 'medio' ? 18 : 20;
        return horas < minHoras && horas > 0;
    });

    if (docentesPocaCarga.length > 0) {
        alerts.push({
            type: 'warning',
            title: `${docentesPocaCarga.length} docente(s) con poca carga`,
            text: 'Algunos docentes están por debajo de su carga mínima de horas.'
        });
    }

    // Conflictos
    const conflictos = detectarConflictos();
    if (conflictos > 0) {
        alerts.push({
            type: 'danger',
            title: `${conflictos} conflicto(s) de horario`,
            text: 'Se detectaron conflictos de aulas o profesores en los mismos horarios.'
        });
    }

    // Aulas sin uso
    const aulasLibres = dashboardData.aulas.length - new Set(dashboardData.horarios.map(h => h.aula_id)).size;
    if (aulasLibres > 0) {
        alerts.push({
            type: 'info',
            title: `${aulasLibres} aula(s) disponible(s)`,
            text: 'Hay aulas que aún no tienen horarios asignados.'
        });
    }

    // Mensaje de éxito si todo está bien
    if (alerts.length === 0) {
        alerts.push({
            type: 'success',
            title: '✓ Sistema funcionando correctamente',
            text: 'No se detectaron problemas en la asignación de horarios.'
        });
    }

    // Renderizar alertas
    container.innerHTML = alerts.map(alert => {
        const iconMap = {
            success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
            danger: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
            info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
        };

        return `
            <div class="alert-card ${alert.type}">
                <div class="alert-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${iconMap[alert.type]}
                    </svg>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-text">${alert.text}</div>
                </div>
            </div>
        `;
    }).join('');
}

function loadTopMaterias(limit = 5) {
    fetch('../php/materias_api.php?action=top&limit=' + encodeURIComponent(limit))
        .then(r => r.json())
        .then(resp => {
            if (!resp.success) return;
            const tbody = document.querySelector('#topMateriasTable tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            resp.data.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${escapeHtml(m.nombre)}</td>
                                <td>${m.grupos}</td>
                                <td>${Number(m.horas).toFixed(2)}</td>`;
                tbody.appendChild(tr);
            });
        })
        .catch(console.error);
}

function loadTopDocentes(limit = 5) {
    fetch('../php/docentes_api.php?action=top&limit=' + encodeURIComponent(limit))
        .then(r => r.json())
        .then(resp => {
            if (!resp.success) return;
            const tbody = document.querySelector('#topDocentesTable tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            resp.data.forEach(d => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${escapeHtml(d.nombre)}</td>
                                <td>${d.grupos}</td>
                                <td>${Number(d.horas).toFixed(2)}</td>`;
                tbody.appendChild(tr);
            });
        })
        .catch(console.error);
}

function escapeHtml(s) {
    return String(s || '').replace(/[&<>"'\/]/g, function (c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        }[c];
    });
}
