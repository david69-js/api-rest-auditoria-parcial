// Utilidades de saneamiento y formato de entrada.
// Escapar HTML en los campos de texto previene almacenamiento de payloads XSS.
// (La inyección SQL se previene con consultas parametrizadas en los modelos.)

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/** Escapa caracteres peligrosos para HTML. */
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Recorta espacios y escapa HTML de una cadena. */
export function cleanString(value) {
  if (typeof value !== 'string') return value;
  return escapeHtml(value.trim());
}

/**
 * Convierte una fecha (Date o string) al formato DATETIME de MySQL en UTC:
 *   'YYYY-MM-DD HH:MM:SS'
 */
export function toMysqlDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
