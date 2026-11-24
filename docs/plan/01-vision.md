# 01 — Visión

## En una frase

Eres el nuevo técnico de sistemas del turno vespertino de una planta de manufactura en el desierto fronterizo. Desde tu cubículo —sin levantarte de la silla— usas la computadora, el teléfono y tu libreta para descubrir quién altera cada noche los datos de calidad. Para lograrlo aprendes a moverte en Linux, a consultar la base de datos de producción con SQL y a rastrear la red de la planta.

## Experiencia

- **Primera persona, sentado.** La cámara mira hacia donde apunta el cursor; ves tu escritorio, un poco del cubículo y algo de la oficina. No caminas.
- **El escritorio es la interfaz.** Computadora (terminal y herramientas), teléfono (compañero que da pistas, rumores, contactos), libreta de apuntes (se llena sola y también escribes tú), pizarrón de pendientes, calendario con tu avance, post-its, lonchera, adornos.
- **La oficina está viva, sin saturar.** De vez en cuando se oye algo a lo lejos (una impresora, el voceo de la planta); gente que pasa y se acerca a platicar o a pedirte un favor; la luz de la ventana que cambia de tarde a noche; fechas especiales con adornos y comentarios.
- **Aprender haciendo.** Cada comando que aprendes sirve para avanzar la historia; los favores de los compañeros sirven para repasar.

## Para quién

| Segmento | Por qué juega | Implicación de diseño |
|---|---|---|
| **Principiante absoluto 16+** | Quiere aprender Linux/SQL/redes y los cursos le aburren | Cero supuestos. Pistas generosas por teléfono. |
| **Técnico de manufactura** que quiere pasar a TI/automatización/datos | Reconoce el mundo (líneas, PLC, scrap, turnos, voceo) | Ambientación industrial auténtica; problemas parecidos a los reales. |
| **Profesional no técnico** que necesita SQL básico | Consultar datos sin depender de alguien | Arco SQL claro y práctico. |

(D-02 decidida: los tres; tono para el principiante, mundo para el técnico.)

## Objetivos de aprendizaje (al terminar v1.0)

El jugador puede, **en un sistema real y sin el juego**:

**Linux**
- Navegar el sistema de archivos con rutas absolutas y relativas (`pwd`, `ls`, `cd`, `~`, `..`).
- Leer, crear, copiar, mover y borrar archivos y carpetas; usar comodines.
- Buscar y filtrar texto encadenando comandos (`grep`, `|`, `wc`, `sort`, `uniq`, `cut`, redirecciones).
- Interpretar y cambiar permisos; usar `sudo` con criterio; ver y terminar procesos.
- Encontrar archivos por nombre, dueño o fecha (`find`).
- Leer y escribir scripts bash simples; programar tareas con `cron` (y saber que existen los timers de systemd).
- Empaquetar y verificar archivos (`tar`, `sha256sum`).

**SQL (SQLite)**
- Explicar tabla, fila, columna, tipo, llave.
- Escribir `SELECT` con filtros, orden, límites, patrones y `NULL`.
- Resumir datos con agregaciones, `GROUP BY` y `HAVING`.
- Combinar tablas con `INNER JOIN` y `LEFT JOIN`; usar subconsultas.
- Modificar datos con `INSERT`, `UPDATE`, `DELETE` de forma segura usando transacciones; crear tablas y vistas.

**Redes**
- Explicar IP, subred (CIDR /24), puerta de enlace, DNS, puerto, TCP/UDP.
- Diagnosticar conectividad: `ip a`, `ping`, `traceroute`, `/etc/hosts`, `host`/`dig`.
- Ver qué servicios escuchan y quién se conecta (`ss`), y consultar una API HTTP con `curl`.
- Conectarse por SSH con llaves `ed25519` y copiar archivos con `scp`.
- Aplicar defensa básica: revocar llaves, reglas de firewall, terminar sesiones.

## Pilares

Ver `CLAUDE.md` §Pilares (fuente de verdad): escritorio primero · una sola pantalla · la herramienta avanza la trama · validación por resultado · vigencia y fidelidad · todo se teclea · una idea por misión · contenido como datos y semilla por partida · seguro por defecto · accesible · seguridad responsable en la ficción.

## No-objetivos de v1.0

- **Móvil y tablet táctil** (port en v2; la arquitectura no lo impide, pero no se diseña para él).
- Caminar por la oficina o levantarse de la silla.
- Emular un Linux real (no hay kernel, `apt`, `vim`/`nano`; `less` y `man` son visores propios).
- Cuentas de usuario, multijugador, tablas de clasificación. El único dato en servidor es la partida asociada a su código.
- Editor de niveles para usuarios. Idioma distinto al español.
- Hacking ofensivo; `nmap` y similares solo dentro de la red ficticia y con autorización en la historia.

## Plataformas

- **v1:** navegadores de escritorio actuales (Chrome, Edge, Firefox, Safari; últimas 2 versiones) con WebGL2, mouse y teclado físico. Resolución mínima 1280×720.
- **Hardware objetivo:** laptop con GPU integrada (Intel Iris Xe / UHD 620 o equivalente) a 60 fps en 1080p.
- **v2:** port a móvil/tablet (controles táctiles, teclado virtual, rendimiento).

## Métricas de éxito (playtests de F9)

| Métrica | Meta |
|---|---|
| Novatos que completan el Turno 1 sin ayuda externa | ≥ 70 % |
| Mediana de pistas pedidas por misión | ≤ 1 |
| Duración mediana por misión | 3–8 min |
| Tras el Turno 5: resuelven un ejercicio equivalente en un Linux real | ≥ 60 % |
| Jugadores que completan al menos un favor por turno | ≥ 50 % |
| Abandono a mitad de misión | ≤ 15 % |
