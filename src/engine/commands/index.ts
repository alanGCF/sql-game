import type { Comando } from "../shell/executor";
import { cd, clear, echo, exit, history, pwd } from "./basicos";
import { cat } from "./cat";
import { ls } from "./ls";
import { man } from "./man";

export const COMANDOS: ReadonlyMap<string, Comando> = new Map<string, Comando>([
  ["pwd", pwd],
  ["cd", cd],
  ["ls", ls],
  ["cat", cat],
  ["echo", echo],
  ["man", man],
  ["clear", clear],
  ["history", history],
  ["exit", exit],
]);
