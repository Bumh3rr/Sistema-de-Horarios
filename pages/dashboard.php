<?php
require_once '../php/config.php';
requireLogin();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Sistema de Horarios</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/styles-modal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
    <link rel="stylesheet" href="../css/dashboard.css">
</head>
<body>
<div class="dashboard">
    <?php include './components/sidebar.php'; ?>
    <?php include './components/loading.php'; ?>

    <div class="main-content">
        <div class="topbar">
            <div>
                <h1 class="topbar-title">Dashboard</h1>
                <p style="color: #636e72; font-size: 14px; margin-top: 4px;">
                    Bienvenido al sistema de gestión de horarios académicos
                </p>
            </div>
            <div class="topbar-actions">
                <button class="btn btn-primary" onclick="location.reload()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    Actualizar
                </button>
            </div>
        </div>

        <div class="content-wrapper">
            <!-- Stats Cards -->
            <div class="dashboard-grid">
                <div class="stat-card" onclick="window.location.href='horarios.php'">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div class="stat-trend up">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <span>100%</span>
                        </div>
                    </div>
                    <div class="stat-body">
                        <div class="stat-value" id="totalHorarios">0</div>
                        <div class="stat-label">Horarios Asignados</div>
                    </div>
                    <div class="stat-footer">
                        <span>Total en el sistema</span>
                        <span>→</span>
                    </div>
                </div>

                <div class="stat-card green" onclick="window.location.href='docentes.php'">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="stat-trend up">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <span id="docentesActivos">0</span>
                        </div>
                    </div>
                    <div class="stat-body">
                        <div class="stat-value" id="totalDocentes">0</div>
                        <div class="stat-label">Docentes Registrados</div>
                    </div>
                    <div class="stat-footer">
                        <span><span id="docentesConHorario">0</span> con horarios</span>
                        <span>→</span>
                    </div>
                </div>

                <div class="stat-card orange" onclick="window.location.href='materias.php'">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        </div>
                        <div class="stat-trend up">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <span id="gruposTotal">0</span>
                        </div>
                    </div>
                    <div class="stat-body">
                        <div class="stat-value" id="totalMaterias">0</div>
                        <div class="stat-label">Materias Registradas</div>
                    </div>
                    <div class="stat-footer">
                        <span><span id="materiasConGrupo">0</span> con grupos</span>
                        <span>→</span>
                    </div>
                </div>

                <div class="stat-card blue" onclick="window.location.href='aulas.php'">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </div>
                        <div class="stat-trend up">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            <span id="aulasOcupadas">0</span>
                        </div>
                    </div>
                    <div class="stat-body">
                        <div class="stat-value" id="totalAulas">0</div>
                        <div class="stat-label">Aulas Disponibles</div>
                    </div>
                    <div class="stat-footer">
                        <span><span id="aulasLibres">0</span> libres</span>
                        <span>→</span>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <!-- Main Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <div>
                            <div class="chart-title">
                                <div class="chart-title-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                </div>
                                <span>Ocupación de Aulas</span>
                            </div>
                            <div class="chart-subtitle">Por edificio y tipo</div>
                        </div>
                    </div>
                    <div id="aulasChart" class="progress-list"></div>
                </div>

                <!-- Mini Cards -->
                <div class="mini-cards-grid">
                    <div class="mini-card" onclick="window.location.href='grupos.php'">
                        <div class="mini-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="mini-card-value" id="totalGrupos">0</div>
                        <div class="mini-card-label">Grupos Activos</div>
                    </div>

                    <div class="mini-card" onclick="window.location.href='carreras.php'">
                        <div class="mini-card-icon" style="background: var(--success-gradient);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                        </div>
                        <div class="mini-card-value" id="totalCarreras">0</div>
                        <div class="mini-card-label">Carreras</div>
                    </div>

                    <div class="mini-card">
                        <div class="mini-card-icon" style="background: var(--warning-gradient);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div class="mini-card-value" id="horasSemanales">0</div>
                        <div class="mini-card-label">Horas/Semana</div>
                    </div>

                    <div class="mini-card">
                        <div class="mini-card-icon" style="background: var(--danger-gradient);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="mini-card-value" id="conflictosTotal">0</div>
                        <div class="mini-card-label">Conflictos</div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Acciones Rápidas</h2>
                </div>
                <div class="card-body">
                    <div class="quick-actions-grid">
                        <a href="horarios.php" class="action-card">
                            <div class="action-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                            <div class="action-card-title">Asignar Horario</div>
                        </a>

                        <a href="docentes.php" class="action-card">
                            <div class="action-card-icon" style="background: var(--success-gradient);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                            </div>
                            <div class="action-card-title">Nuevo Docente</div>
                        </a>

                        <a href="grupos.php" class="action-card">
                            <div class="action-card-icon" style="background: var(--warning-gradient);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div class="action-card-title">Nuevo Grupo</div>
                        </a>

                        <a href="materias.php" class="action-card">
                            <div class="action-card-icon" style="background: var(--info-gradient);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                </svg>
                            </div>
                            <div class="action-card-title">Nueva Materia</div>
                        </a>

                        <a href="aulas.php" class="action-card">
                            <div class="action-card-icon" style="background: var(--danger-gradient);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <div class="action-card-title">Nueva Aula</div>
                        </a>

                        <a href="carreras.php" class="action-card">
                            <div class="action-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                </svg>
                            </div>
                            <div class="action-card-title">Nueva Carrera</div>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Tables Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px;">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Materias Más Demandadas</h2>
                    </div>
                    <div class="card-body">
                        <table class="data-table" id="topMateriasTable">
                            <thead>
                            <tr>
                                <th>Materia</th>
                                <th>Grupos</th>
                                <th>Horas</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td colspan="3" style="text-align: center; padding: 40px;">
                                    <div class="skeleton" style="height: 20px; margin-bottom: 12px;"></div>
                                    <div class="skeleton" style="height: 20px; margin-bottom: 12px;"></div>
                                    <div class="skeleton" style="height: 20px;"></div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Docentes con Más Carga</h2>
                    </div>
                    <div class="card-body">
                        <table class="data-table" id="topDocentesTable">
                            <thead>
                            <tr>
                                <th>Docente</th>
                                <th>Turno</th>
                                <th>Horas</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td colspan="3" style="text-align: center; padding: 40px;">
                                    <div class="skeleton" style="height: 20px; margin-bottom: 12px;"></div>
                                    <div class="skeleton" style="height: 20px; margin-bottom: 12px;"></div>
                                    <div class="skeleton" style="height: 20px;"></div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Alerts Section -->
            <div class="card" style="margin-top: 32px;">
                <div class="card-header">
                    <h2 class="card-title">Alertas y Notificaciones</h2>
                </div>
                <div class="card-body">
                    <div id="alertsContainer">
                        <div class="alert-card">
                            <div class="alert-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <div class="alert-content">
                                <div class="alert-title">Sistema inicializado</div>
                                <div class="alert-text">Cargando datos del dashboard...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"></script>
<script src="../js/main.js"></script>
<script src="../js/dashboard.js"></script>
</body>
</html>