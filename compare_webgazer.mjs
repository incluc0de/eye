import fs from "node:fs";

const original = fs.readFileSync(
  "./webgazer-original/index.mjs",
  "utf8"
);

const modified = fs.readFileSync(
  "./webgazer-modified/index.mjs",
  "utf8"
);

const originalLines = original.split("\n");
const modifiedLines = modified.split("\n");

console.log("=== ORIGINAL ===");
console.log(`Linhas: ${originalLines.length}`);
console.log(`Bytes: ${Buffer.byteLength(original)}`);

console.log("\n=== MODIFICADO ===");
console.log(`Linhas: ${modifiedLines.length}`);
console.log(`Bytes: ${Buffer.byteLength(modified)}`);

console.log("\nArquivos iguais:", original === modified);

console.log("\n=== LINHAS DIFERENTES ===");

const max = Math.max(originalLines.length, modifiedLines.length);

for (let i = 0; i < max; i++) {
  if (originalLines[i] !== modifiedLines[i]) {
    console.log(`\nLinha ${i + 1}`);

    console.log(
      "ORIGINAL :",
      originalLines[i] ?? "<linha inexistente>"
    );

    console.log(
      "MODIFIC.:",
      modifiedLines[i] ?? "<linha inexistente>"
    );
  }
}