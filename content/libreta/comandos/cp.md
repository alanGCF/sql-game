# `cp`

## Para qué sirve

`cp` copia archivos. Con `-r` copia carpetas completas.

## Ejemplo

```
$ mkdir respaldo
$ cp LEEME.txt respaldo/
$ cp -r tickets tickets-copia
```

## En este servidor

- `-r`: copia una carpeta con todo lo que tiene.

## En tu Linux real

Ojo: si el destino ya existe, lo reemplaza sin preguntar. `cp -i` pregunta antes y `cp -a` conserva fechas y permisos (lo que se usa para respaldos).
