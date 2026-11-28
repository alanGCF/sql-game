/**
 * Tu cuenta en el servidor lleva tu nombre (F4-17): el primer nombre que tecleaste en el gafete, como usuario
 * válido de Debian (minúsculas sin acentos, empieza con letra, hasta 16 de [a-z0-9_-]). El contenido y el
 * mundo base escriben `{{usuario}}` y se instancian al crear la jornada.
 */

/** Si el nombre no tiene letras usables (solo números o emojis). */
export const USUARIO_POR_OMISION = "tecnico";

/** Cuentas que ya existen en los servidores de la planta o del sistema: tu usuario nunca choca con ellas. */
const OCUPADOS = new Set([
  "root",
  "daemon",
  "bin",
  "sys",
  "sync",
  "games",
  "man",
  "lp",
  "mail",
  "news",
  "uucp",
  "proxy",
  "www-data",
  "backup",
  "list",
  "irc",
  "nobody",
  "systemd-network",
  "messagebus",
  "sshd",
  "sudo",
  "sistemas",
  "etellez",
  "rsalcido",
  "kibanez",
  "mtrevino",
  "delta_svc",
  "jortega",
]);

const VALIDO = /^[a-z][a-z0-9_-]{0,15}$/;

export function usuarioDe(nombre: string): string {
  const primero = nombre.trim().split(/\s+/)[0] ?? "";
  const limpio = primero
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 16);
  if (!VALIDO.test(limpio)) return USUARIO_POR_OMISION;
  return OCUPADOS.has(limpio) ? `${limpio.slice(0, 15)}2` : limpio;
}

/** Copia de `x` con `{{usuario}}` cambiado por el usuario en todos sus textos (también en las llaves). */
export function conUsuario<T>(x: T, usuario: string): T {
  if (!VALIDO.test(usuario)) throw new Error(`usuario inválido: ${usuario}`);
  return JSON.parse(JSON.stringify(x).replaceAll("{{usuario}}", usuario)) as T;
}
