# `echo`

## Para qué sirve

`echo` escribe en la pantalla lo que le pases. Junto con `>` y `>>` sirve para escribir en archivos.

## Ejemplo

```
$ echo hola
hola
$ echo pendiente > notas.txt
$ echo otro >> notas.txt
```

## En este servidor

- `-n`: sin salto de renglón al final.
- `-e`: entiende `\n` (renglón nuevo) y `\t` (tabulador).

## En tu Linux real

Es parte de bash. Con `-e` entiende más secuencias que aquí. Para formatos más finos se usa `printf`.
