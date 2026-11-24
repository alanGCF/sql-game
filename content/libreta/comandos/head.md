# `head`

## Para qué sirve

`head` muestra solo el principio de un archivo (10 renglones si no le dices cuántos).

## Ejemplo

```
$ head -n 1 LEEME.txt
Para quien me reemplace:
```

## En este servidor

- `-n N`: los primeros N renglones.
- `-N`: lo mismo en corto (`head -3`).

## En tu Linux real

Igual; la forma recomendada es `-n N`. `head -c N` muestra los primeros N bytes.
