# 01 — Visión

## En una frase

Eres el nuevo técnico de sistemas del turno vespertino de una planta de manufactura en el desierto fronterizo. La ingeniera a la que reemplazas se fue de un día para otro y dejó notas escondidas en el servidor: alguien está alterando los datos de calidad. Para averiguar quién y cómo, aprendes a moverte en Linux, a consultar la base de datos de producción con SQL y a rastrear la red de la planta.

## Para quién

| Segmento | Por qué juega | Implicación de diseño |
|---|---|---|
| **Principiante absoluto 16+** (estudiante, autodidacta) | Quiere aprender Linux/SQL/redes y los cursos le aburren | Cero supuestos: ni siquiera "qué es una carpeta" en terminal. Pistas generosas. |
| **Técnico de manufactura** que quiere saltar a TI/automatización/datos | Reconoce el mundo (líneas, PLC, scrap, turnos) y le sirve para su carrera | La ambientación industrial es auténtica; los problemas se parecen a los reales. |
| **Profesional no técnico** que necesita SQL básico | Consultar datos sin depender de alguien | El arco SQL es independiente y práctico. |

*(Decisión abierta D-02: confirmar público objetivo.)*

## Objetivos de aprendizaje (al terminar v1.0)

El jugador puede, **en un sistema real y sin el juego**:

**Linux**
- Navegar el sistema de archivos con rutas absolutas y relativas (`pwd`, `ls`, `cd`, `~`, `..`).
- Leer, crear, copiar, mover y borrar archivos y carpetas; usar comodines.
- Buscar y filtrar texto encadenando comandos (`grep`, `|`, `wc`, `sort`, `uniq`, `cut`, redirecciones).
- Interpretar y cambiar permisos; usar `sudo` con criterio; ver y terminar procesos.
- Encontrar archivos por nombre, dueño o fecha (`find`).
- Leer y escribir scripts bash simples; programar tareas con `cron`.
- Empaquetar y verificar archivos (`tar`, `sha256sum`).

**SQL (SQLite)**
- Explicar tabla, fila, columna, tipo, llave.
- Escribir `SELECT` con filtros, orden, límites, patrones y `NULL`.
- Resumir datos con funciones de agregación, `GROUP BY` y `HAVING`.
- Combinar tablas con `INNER JOIN` y `LEFT JOIN`; usar subconsultas.
- Modificar datos con `INSERT`, `UPDATE`, `DELETE` de forma segura usando transacciones.
- Crear tablas y vistas sencillas.

**Redes**
- Explicar IP, subred (CIDR /24), puerta de enlace, DNS, puerto, TCP/UDP.
- Diagnosticar conectividad: `ip a`, `ping`, `traceroute`, `/etc/hosts`, `host`/`dig`.
- Ver qué servicios escuchan y quién se conecta (`ss`), y consultar una API HTTP con `curl`.
- Conectarse por SSH con llaves y copiar archivos con `scp`.
- Aplicar medidas básicas de defensa: revocar llaves, reglas de firewall, terminar sesiones.

## Pilares

Ver `CLAUDE.md` §Pilares (es la fuente de verdad). Resumen: móvil primero · la herramienta avanza la trama · validación por resultado · fidelidad con sistemas reales · una idea por misión · contenido como datos · ligero/offline · accesible · seguridad responsable.

## No-objetivos de v1.0

- No es un emulador real de Linux (no hay kernel, ni `apt`, ni editores de pantalla completa como `vim`/`nano`; `less` es un visor propio).
- No hay cuentas, servidor, multijugador ni tablas de clasificación.
- No hay editor de niveles para usuarios.
- Solo español (la estructura queda lista para traducir).
- Sin monetización (D-06).
- No enseña hacking ofensivo; `nmap` y similares solo dentro de la red ficticia propia y con autorización explícita en la historia.

## Plataformas

- **Prioridad 1:** Android + Chrome (gama media, 360–412 px de ancho, 4G).
- **Prioridad 2:** iPhone + Safari (iOS 16+).
- **Prioridad 3:** escritorio (Chrome, Firefox, Safari, Edge) y tablet.
- PWA instalable, jugable sin conexión después de la primera carga.

## Métricas de éxito (se miden en playtests de Fase 8)

| Métrica | Meta |
|---|---|
| Novatos que completan Turno 0 sin ayuda externa | ≥ 70 % |
| Mediana de pistas por misión | ≤ 1 |
| Duración mediana por misión | 3–8 min |
| Tras Turno 4: resuelven un ejercicio equivalente en un Linux real | ≥ 60 % |
| Abandono dentro de una misión (sin completar ni salir con guardado) | ≤ 15 % |
