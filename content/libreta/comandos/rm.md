# `rm`

## Para qué sirve

`rm` borra archivos. Con `-r`, carpetas completas.

## Ejemplo

```
$ rm borrador.txt
$ rm -r carpeta-vieja
```

## En este servidor

- `-r`: borra una carpeta con todo lo que tiene.
- `-f`: no pregunta ni se queja si algo no existe.
- `-i` no está: en este servidor no hay confirmación.

## En tu Linux real

No hay papelera: lo que borras con `rm` se pierde. `rm -i` pregunta antes de cada archivo. Piénsalo dos veces antes de `rm -rf`.
