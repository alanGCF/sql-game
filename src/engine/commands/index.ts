import type { Comando } from "../shell/executor";
import { cp, head, mkdir, mv, rm, tail, touch } from "./archivos";
import { cd, clear, echo, exit, history, pwd } from "./basicos";
import { cat } from "./cat";
import { ls } from "./ls";
import { man } from "./man";
import { cut, grep, sort, uniq, wc } from "./texto";

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
  ["head", head],
  ["tail", tail],
  ["mkdir", mkdir],
  ["touch", touch],
  ["cp", cp],
  ["mv", mv],
  ["rm", rm],
  ["grep", grep],
  ["wc", wc],
  ["sort", sort],
  ["uniq", uniq],
  ["cut", cut],
]);
