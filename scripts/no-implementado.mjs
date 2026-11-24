// Marcador para scripts cuya tarea del backlog aún no existe. Sale con código 1 a propósito.
const tarea = process.argv[2] ?? "?";
console.error(`no implementado: ${tarea} (ver docs/plan/backlog.md)`);
process.exit(1);
