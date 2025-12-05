<?php
require_once '../php/config.php';
requireLogin();
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Horario</title>
    <link rel="stylesheet" href="../css/styles-modal.css">
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/docente.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
    <!-- jspdf -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
</head>

<body>
<div class="dashboard">
    <?php include './components/sidebar.php'; ?>
    <?php include './components/loading.php'; ?>

    <input type="number" name="id_usuario" id="id_usuario" value="<?php echo $_SESSION['user_id']; ?>" hidden>

    <div class="main-content">
        <div class="topbar">
            <h1 class="topbar-title">Horario del Docente</h1>
            <button type="button" class="btn btn-primary" onclick="exportarHorarioPDF()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Exportar PDF
            </button>
        </div>

        <div class="content-wrapper">
            <div class="modal-body" style=" overflow-y: auto;">
                <!-- Información del Docente -->
                <div id="docenteInfo" class="docente-info-card">
                    <!-- Info del docente se carga dinámicamente -->
                </div>

                <!-- Grid de Horario -->
                <div class="horario-container" id="horarioContainerPrint">
                    <div class="horario-header-print" style="display: none;">
                        <!-- Header para PDF/impresión -->
                        <div class="header-logo">
                            <h1>Tecnológico Nacional de México</h1>
                            <h2>Campus Chilpancingo</h2>
                        </div>
                        <div class="header-info">
                            <h3>Horario de Clases</h3>
                            <p id="docenteNombrePrint"></p>
                            <p id="periodoActual"></p>
                        </div>
                    </div>

                    <div class="schedule-grid-wrapper">
                        <table class="schedule-table" id="scheduleTableDocente">
                            <thead>
                            <tr>
                                <th class="hora-column">Hora</th>
                                <th>Lunes</th>
                                <th>Martes</th>
                                <th>Miércoles</th>
                                <th>Jueves</th>
                                <th>Viernes</th>
                            </tr>
                            </thead>
                            <tbody id="scheduleBodyDocente">
                            <!-- Horarios se cargan dinámicamente -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Leyenda -->
                    <div class="horario-leyenda">
                        <div class="leyenda-item">
                            <div class="leyenda-color" style="background: var(--primary-color);"></div>
                            <span>Clase asignada</span>
                        </div>
                        <div class="leyenda-item">
                            <div class="leyenda-color" style="background: #f8f9fa; border: 1px solid #dee2e6;"></div>
                            <span>Hora libre</span>
                        </div>
                    </div>

                    <!-- Resumen de Carga -->
                    <div class="horario-resumen" id="horarioResumen">
                        <!-- Resumen se carga dinámicamente -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"></script>
<script src="../js/main.js"></script>
<script type="module" src="../js/horario_usuario.js"></script>
</body>
</html>