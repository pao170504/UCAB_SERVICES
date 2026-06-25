// Fuente ÚNICA (backend) de las cédulas con poderes de administrador del sistema:
// cambiar tasas, modificar folios, crear/editar servicios y precios, aprobar pasos,
// gestionar usuarios. Ser "Personal_Administrativo" NO basta: hay que estar aquí.
//
// Para sumar/quitar un admin del sistema, edita SOLO esta lista (backend) y
// `ADMIN_CEDULAS` en front/js/auth-guard.js (frontend). Dos lugares, nada más.
module.exports = {
  ADMIN_CEDULAS: ['17890234']
};
