# `ls`

## Para qué sirve

`ls` lista lo que hay en una carpeta. Sin nada, la carpeta donde estás; con una ruta, esa carpeta.

## Ejemplo

```
$ ls
LEEME.txt  tickets
$ ls -a
.  ..  .bash_logout  .bashrc  .profile  .r  LEEME.txt  tickets
```

## En este servidor

- `-a`: muestra también los ocultos (los que empiezan con punto).
- `-l`: formato largo: permisos, dueño, tamaño y fecha.
- `-h`: con `-l`, tamaños legibles (`4.0K`).
- `-1`: uno por renglón.
- `-R`: entra a las subcarpetas.
- `-t`: el más nuevo primero; `-r`: invierte el orden.
- `-d`: la carpeta misma, no su contenido.
- Se combinan: `ls -la`, `ls -lh`.

## En tu Linux real

Tiene muchas más opciones (`man ls`). En Debian y Ubuntu, `ls` sale a colores porque el `.bashrc` trae `alias ls='ls --color=auto'`; Ubuntu además trae `ll`, que es `ls -alF`. Con el sistema en español o en inglés, `ls` ignora el punto inicial al ordenar, así que los ocultos salen mezclados con los demás; aquí se ordena como con `LC_ALL=C`.
