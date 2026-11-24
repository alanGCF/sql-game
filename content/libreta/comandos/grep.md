# `grep`

## Para qué sirve

`grep` busca renglones que contengan un texto o un patrón, en archivos o en lo que le llega por una tubería.

## Ejemplo

```
$ grep -i impresora LEEME.txt
3. Si la impresora de la Línea 2 falla, casi siempre es el cable. Nadie me cree.
$ grep -r Karla tickets
```

## En este servidor

- `-i`: sin importar mayúsculas.
- `-n`: con número de renglón.
- `-v`: los que NO coinciden.
- `-c`: cuenta los renglones que coinciden (no cuántas veces aparece el texto).
- `-r`: busca en todas las subcarpetas.
- `-w`: palabra completa.
- `-E`: expresiones regulares extendidas (`a|b`, `[0-9]+`).

## En tu Linux real

Igual (GNU grep). `egrep` y `fgrep` son obsoletos: usa `grep -E` y `grep -F`. En Debian y Ubuntu todavía funcionan sin aviso, pero en otras distribuciones imprimen `egrep: warning: egrep is obsolescent`; no los uses en scripts nuevos. En Ubuntu el `.bashrc` trae `alias grep='grep --color=auto'` y lo encontrado sale en color; en Debian viene comentado.
