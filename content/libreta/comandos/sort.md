# `sort`

## Para qué sirve

`sort` ordena renglones, alfabéticamente si no le dices otra cosa.

## Ejemplo

```
$ sort nombres.txt
$ sort -n -r cantidades.txt
```

## En este servidor

- `-r`: al revés.
- `-n`: como números (10 después de 9).
- `-u`: sin repetidos.
- `-k N`: desde la columna N hasta el final del renglón; `-k N,N`: solo la columna N.
- `-t C`: las columnas se separan con el carácter C.

## En tu Linux real

Igual. El orden alfabético depende del idioma del sistema; para el orden "de computadora" se usa `LC_ALL=C sort`. `-h` ordena tamaños como `2K` y `1M`.
