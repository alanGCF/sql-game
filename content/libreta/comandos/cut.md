# `cut`

## Para qué sirve

`cut` corta columnas de cada renglón.

## Ejemplo

```
$ grep Paros /srv/lineas/linea1/estado.txt | cut -d: -f2
 0
```

## En este servidor

- `-d C`: el separador de columnas es el carácter C.
- `-f N`: la columna N (también `-f 1,3`).

## En tu Linux real

Igual. También corta por posición con `-c` (`cut -c1-5`), pero ojo: cuenta bytes, y una letra con acento ocupa dos (`echo Línea | cut -c1-5` da `Líne`).
