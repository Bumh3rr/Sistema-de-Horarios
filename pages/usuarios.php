<?php
require_once '../php/config.php';
requireLogin();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Usuarios</title>
    <link rel="stylesheet" href="../css/styles-modal.css">
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css">
</head>
<body>
<div class="dashboard">
    <?php include './components/sidebar.php'; ?>
    <?php include './components/loading.php'; ?>
    <?php include './components/modal-success.php'; ?>
    <?php include './components/modal-warning.php'; ?>
    <?php include './components/modal-info.php'; ?>

    <div class="main-content">
        <div class="topbar">
            <h1 class="topbar-title">Gestión de Usuarios</h1>
            <div class="topbar-actions">
                <button id="btnNewUsuario" class="btn btn-primary" onclick="openModal('modalUsuario')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Nuevo Usuario
                </button>
            </div>
        </div>

        <div class="content-wrapper">

            <div class="card mb-3">
                <div class="card-body">
                    <div class="flex gap-2">
                        <div class="form-group" style="flex: 1; margin-bottom: 0;">
                            <input type="text" id="searchInput" class="form-input"
                                   placeholder="Buscar por nombre o email...">
                        </div>
                        <div class="form-group" style="width: 200px; margin-bottom: 0;">
                            <select id="filterActivo" class="form-input">
                                <option value="">Todos</option>
                                <option value="1">Activos</option>
                                <option value="0">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody id="usuariosTableBody">
                            <tr>
                                <td colspan="6" class="text-center">Cargando...</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Nuevo -->
<div id="modalUsuario" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <div class="content-title-modal">
                <div class="ico-modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="none" stroke="#5046e5" stroke-linecap="round" stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 19c0-2.21-2.686-4-6-4s-6 1.79-6 4m16-3v-3m0 0v-3m0 3h-3m3 0h3M9 12a4 4 0 1 1 0-8a4 4 0 0 1 0 8"/>
                    </svg>
                </div>
                <h3 class="modal-title" id="modalUsuarioTitle">Nuevo Usuario</h3>
            </div>
            <button class="modal-close" onclick="closeModal('modalUsuario')">&times;</button>
        </div>

        <form id="formUsuario">
            <div class="modal-body">
                <input type="hidden" id="usuario_id" name="usuario_id">

                <div class="form-group">
                    <label for="docente_id" class="form-label">Docente</label>
                    <select id="docente_id" name="docente_id" class="form-input" required>
                        <option value="">Selecciona un docente</option>
                    </select>
                    <small class="text-muted">Se cargan los docentes disponibles; al elegir uno se usarán sus datos
                        base.</small>
                </div>

                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" id="email" name="email" class="form-input"
                           placeholder="Email institucional" required>
                </div>

                <div class="grid grid-2">
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input type="password" id="password" name="password" class="form-input"
                               placeholder="Ingresa la contraseña" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Confirmar Contraseña</label>
                        <input type="password" id="passwordConfirm" name="passwordConfirm" class="form-input"
                               placeholder="Confirma la contraseña" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Rol</label>
                    <select id="rol" name="rol" class="form-input" disabled required>
                        <option value="docente">Docente</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                        <input type="checkbox" class="ui-checkbox" id="activo" name="activo" checked>
                        <span>Usuario activo</span>
                    </label>
                </div>

            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('modalUsuario')">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
        </form>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js"></script>
<script src="../js/main.js"></script>
<script type="module" src="../js/usuarios.js"></script>
</body>
</html>
