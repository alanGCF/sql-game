# `tail`

## Para qué sirve

`tail` muestra solo el final de un archivo (10 renglones si no le dices cuántos). Útil para ver lo último de un registro.

## Ejemplo

```
$ tail -n 3 LEEME.txt
Y una cosa más: no confíes en los números del turno nocturno.
Revisa todo dos veces.
— R.
```

## En este servidor

- `-n N`: los últimos N renglones.
- `-N`: lo mismo en corto (`tail -5`).

## En tu Linux real

Igual. En un servidor real se usa mucho `tail -f`, que se queda mostrando lo que se va agregando a un registro (se sale con `Ctrl+C`). Los registros del sistema en Debian 12 y posteriores se leen con `journalctl`; `journalctl -f` es el equivalente de `tail -f`.
