# `uniq`

## Para qué sirve

`uniq` quita renglones repetidos **que estén juntos**. Por eso casi siempre va después de `sort`.

## Ejemplo

```
$ sort accesos.txt | uniq -c
```

## En este servidor

- `-c`: cuenta cuántas veces sale cada renglón.
- `-d`: muestra solo los repetidos.

## En tu Linux real

Igual. Si los repetidos no están juntos, `uniq` no los ve: primero `sort`.
