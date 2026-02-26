import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const source = resolve(distDir, "index.html");
const target = resolve(distDir, "404.html");

if (!existsSync(source)) {
  throw new Error("No se encontro dist/index.html. Ejecuta este script despues del build.");
}

copyFileSync(source, target);
console.log("Generado fallback SPA en dist/404.html");
