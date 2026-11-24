# `history`

## Para qué sirve

`history` muestra los comandos que has tecleado, numerados. Con la flecha para arriba los repites sin volver a escribirlos.

## Ejemplo

```
$ history
    1  pwd
    2  ls
    3  history
```

## En este servidor

Sin opciones. Atajos: flecha arriba y abajo para recorrer tus comandos, `Tab` para completar nombres.

## En tu Linux real

Igual. Además, `!3` repite el comando número 3 y `Ctrl+R` busca en el historial (aquí no: en el navegador, `Ctrl+R` recarga la página). bash lo guarda en `~/.bash_history` al cerrar la sesión; con `HISTCONTROL=ignoreboth`, que trae el `.bashrc` de Debian y Ubuntu, no guarda repetidos seguidos ni lo que empieza con espacio.
