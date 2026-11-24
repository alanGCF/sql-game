# `wc`

## Para qué sirve

`wc` cuenta renglones, palabras y bytes. Viene de *word count*.

## Ejemplo

```
$ wc -l LEEME.txt
9 LEEME.txt
$ ls tickets | wc -l
```

## En este servidor

- `-l`: renglones.
- `-w`: palabras.
- `-c`: bytes.

## En tu Linux real

Igual. Ojo con `-c`: cuenta bytes, y una letra con acento ocupa dos; para contar caracteres se usa `-m` (si tu sistema usa UTF-8, lo normal; con `LC_ALL=C` cuenta bytes, igual que `-c`).
