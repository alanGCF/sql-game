# `cd`

## Para qué sirve

`cd` te cambia de carpeta. Viene de *change directory*.

## Ejemplo

```
$ cd /srv/lineas/linea3
$ pwd
/srv/lineas/linea3
$ cd ..
$ pwd
/srv/lineas
```

## En este servidor

- `cd ruta`: ruta absoluta (empieza con `/`) o relativa (desde donde estás).
- `cd ..`: sube una carpeta.
- `cd` o `cd ~`: regresa a tu carpeta personal.
- `cd -`: regresa a la carpeta anterior y la muestra.

## En tu Linux real

Funciona igual: es parte de bash (su ayuda está en `help cd`). Ojo: `cd..` sin espacio no existe; siempre es `cd ..`.
