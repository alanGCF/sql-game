import { describe, expect, it } from "vitest";
import { clasificar } from "../../src/engine/shell/classify";

type Esperado = "ejecutar" | "vacio" | "error_sintaxis" | `pensamiento:${string}`;

const TABLA: [string, Esperado][] = [
  // soportados
  ["ls", "ejecutar"],
  ["ls -la", "ejecutar"],
  ["ls -lah /srv", "ejecutar"],
  ["ls --all", "ejecutar"],
  ["ls --help", "ejecutar"],
  ["cat LEEME.txt", "ejecutar"],
  ["cat -n a b", "ejecutar"],
  ["cd ..", "ejecutar"],
  ["cd -", "ejecutar"],
  ["pwd", "ejecutar"],
  ["man ls", "ejecutar"],
  ["echo hola > a.txt", "ejecutar"],
  ["echo 'a | b'", "ejecutar"],
  ["ls | cat", "ejecutar"],
  ["cat a && echo si || echo no", "ejecutar"],
  ["ls; pwd", "ejecutar"],
  ["cat noexiste 2> errores.txt", "ejecutar"],
  ["cat noexiste 2>&1", "ejecutar"],
  ["history", "ejecutar"],
  ["clear", "ejecutar"],
  ["head -5 LEEME.txt", "ejecutar"],
  ["head -n 3 a", "ejecutar"],
  ["mkdir -p a/b", "ejecutar"],
  ["cp -r .r respaldo", "ejecutar"],
  ["rm -rf tickets", "ejecutar"],
  ["tail -f /var/log/auth.log", "pensamiento:fuera_de_alcance"],
  ["rm -i x", "pensamiento:fuera_de_alcance"],
  ["cp -a x y", "pensamiento:fuera_de_alcance"],
  ["mv -v x y", "pensamiento:fuera_de_alcance"],
  // errores de dedo / inexistentes: se ejecutan y bash responde "command not found"
  ["sl", "ejecutar"],
  ["lss -a", "ejecutar"],
  ["xyzzy", "ejecutar"],
  // banderas inexistentes en la herramienta real: el comando da su error real
  ["ls -z", "ejecutar"],
  ["cat -q x", "ejecutar"],
  // reales pero fuera de la superficie → pensamiento
  ["awk '{print $1}' a", "pensamiento:fuera_de_alcance"],
  ["vim notas.txt", "pensamiento:fuera_de_alcance"],
  ["nano notas.txt", "pensamiento:fuera_de_alcance"],
  ["apt install sl", "pensamiento:fuera_de_alcance"],
  ["sudo ls", "pensamiento:fuera_de_alcance"],
  ["python3", "pensamiento:fuera_de_alcance"],
  ["ls -Z", "pensamiento:fuera_de_alcance"],
  ["ls -S", "pensamiento:fuera_de_alcance"],
  ["cat -A a", "pensamiento:fuera_de_alcance"],
  ["ls --color=never", "pensamiento:fuera_de_alcance"],
  ["ls | sort", "pensamiento:fuera_de_alcance"],
  ["ifconfig", "pensamiento:fuera_de_alcance"],
  // sintaxis avanzada
  ["echo $(whoami)", "pensamiento:avanzado"],
  ["echo `date`", "pensamiento:avanzado"],
  ['echo "$(ls)"', "pensamiento:avanzado"],
  ["cat <<EOF", "pensamiento:avanzado"],
  ["ls &", "pensamiento:avanzado"],
  ["ls &> x", "pensamiento:avanzado"],
  ["A=1 ls", "pensamiento:avanzado"],
  ["diff <(ls a) <(ls b)", "pensamiento:avanzado"],
  // peligrosos
  ["rm -rf /", "pensamiento:peligroso"],
  ["rm -rf ~", "pensamiento:peligroso"],
  ["rm -fr /*", "pensamiento:peligroso"],
  [":(){ :|:& };:", "pensamiento:peligroso"],
  ["mkfs.ext4 /dev/sda1", "pensamiento:peligroso"],
  ["dd if=/dev/zero of=/dev/sda", "pensamiento:peligroso"],
  ["shutdown now", "pensamiento:peligroso"],
  ["chmod -R 777 /", "pensamiento:peligroso"],
  // Windows
  ["dir", "pensamiento:windows"],
  ["cls", "pensamiento:windows"],
  ["ipconfig", "pensamiento:windows"],
  ["type LEEME.txt", "pensamiento:windows"],
  // anómalos
  ["a".repeat(501), "pensamiento:anomalo"],
  ["ls \u0007", "pensamiento:anomalo"],
  // vacíos y sintaxis
  ["", "vacio"],
  ["   ", "vacio"],
  ["# solo un comentario", "vacio"],
  ["ls |", "error_sintaxis"],
  ["ls >", "error_sintaxis"],
  ["| ls", "error_sintaxis"],
  ["echo 'sin cerrar", "error_sintaxis"],
  ["ls && && pwd", "error_sintaxis"],
];

describe("clasificador de entrada (globo de pensamiento)", () => {
  it.each(TABLA)("%s → %s", (linea, esperado) => {
    const c = clasificar(linea);
    const obtenido = c.tipo === "pensamiento" ? `pensamiento:${c.motivo}` : c.tipo;
    expect(obtenido).toBe(esperado);
  });
});
