import fs from "node:fs";
import path from "node:path";

/*
 * ============================================================
 * IncluC0de - Patch do WebGazer
 * ============================================================
 *
 * Objetivo:
 * Aplicar automaticamente as modificações validadas no
 * WebGazer 3.5.3 para funcionamento com TensorFlow.js/WebGL.
 *
 * Arquivos modificados:
 *
 *   node_modules/webgazer/src/facemesh.mjs
 *   node_modules/webgazer/src/index.mjs
 *
 * As versões funcionais estão preservadas em:
 *
 *   webgazer-modified/facemesh.mjs
 *   webgazer-modified/index.mjs
 *
 * ============================================================
 */

const WEBGAZER_VERSION = "3.5.3";

const root = process.cwd();

/*
 * ------------------------------------------------------------
 * Diretórios do WebGazer instalado
 * ------------------------------------------------------------
 */

const webgazerDir = path.join(
  root,
  "node_modules",
  "webgazer"
);

const packagePath = path.join(
  webgazerDir,
  "package.json"
);

const faceMeshPath = path.join(
  webgazerDir,
  "src",
  "facemesh.mjs"
);

const indexPath = path.join(
  webgazerDir,
  "src",
  "index.mjs"
);

/*
 * ------------------------------------------------------------
 * Arquivos modificados preservados pelo projeto
 * ------------------------------------------------------------
 */

const modifiedFaceMeshPath = path.join(
  root,
  "webgazer-modified",
  "facemesh.mjs"
);

const modifiedIndexPath = path.join(
  root,
  "webgazer-modified",
  "index.mjs"
);

console.log(
  "\n[IncluC0de] Aplicando adaptação do WebGazer..."
);

/*
 * ============================================================
 * 1. Validação da instalação do WebGazer
 * ============================================================
 */

if (!fs.existsSync(webgazerDir)) {
  throw new Error(
    "WebGazer não encontrado em node_modules/webgazer."
  );
}

if (!fs.existsSync(packagePath)) {
  throw new Error(
    "package.json do WebGazer não encontrado."
  );
}

const pkg = JSON.parse(
  fs.readFileSync(packagePath, "utf8")
);

console.log(
  `[IncluC0de] WebGazer encontrado: ${pkg.version}`
);

/*
 * Não aplicamos automaticamente o patch em outra versão,
 * pois as modificações foram testadas especificamente
 * no WebGazer 3.5.3.
 */

if (pkg.version !== WEBGAZER_VERSION) {
  throw new Error(
    `Versão incompatível do WebGazer. ` +
    `Esperada: ${WEBGAZER_VERSION}; ` +
    `encontrada: ${pkg.version}.`
  );
}

/*
 * ============================================================
 * 2. Validação dos arquivos originais instalados
 * ============================================================
 */

if (!fs.existsSync(faceMeshPath)) {
  throw new Error(
    "src/facemesh.mjs não encontrado."
  );
}

if (!fs.existsSync(indexPath)) {
  throw new Error(
    "src/index.mjs não encontrado."
  );
}

/*
 * ============================================================
 * 3. Validação dos arquivos modificados preservados
 * ============================================================
 */

if (!fs.existsSync(modifiedFaceMeshPath)) {
  throw new Error(
    "webgazer-modified/facemesh.mjs não encontrado."
  );
}

if (!fs.existsSync(modifiedIndexPath)) {
  throw new Error(
    "webgazer-modified/index.mjs não encontrado."
  );
}

/*
 * ============================================================
 * 4. Leitura e validação do facemesh.mjs adaptado
 * ============================================================
 */

const modifiedFaceMesh = fs.readFileSync(
  modifiedFaceMeshPath,
  "utf8"
);

/*
 * Assinaturas mínimas que precisam existir na versão
 * adaptada para TensorFlow.js.
 */

const requiredFaceMeshMarkers = [
  "from '@tensorflow/tfjs'",
  "runtime: 'tfjs'",
  "refineLandmarks: true",
  "maxFaces: 1"
];

for (const marker of requiredFaceMeshMarkers) {
  if (!modifiedFaceMesh.includes(marker)) {
    throw new Error(
      `Arquivo facemesh.mjs adaptado inválido. ` +
      `Não foi encontrado: ${marker}`
    );
  }
}

console.log(
  "[IncluC0de] FaceMesh TFJS validado."
);

/*
 * ============================================================
 * 5. Aplicação do facemesh.mjs
 * ============================================================
 */

const currentFaceMesh = fs.readFileSync(
  faceMeshPath,
  "utf8"
);

if (currentFaceMesh === modifiedFaceMesh) {

  console.log(
    "[IncluC0de] facemesh.mjs já está adaptado."
  );

} else {

  fs.writeFileSync(
    faceMeshPath,
    modifiedFaceMesh,
    "utf8"
  );

  console.log(
    "[IncluC0de] facemesh.mjs adaptado para TFJS/WebGL."
  );
}

/*
 * Validação após escrita.
 */

const installedFaceMesh = fs.readFileSync(
  faceMeshPath,
  "utf8"
);

if (installedFaceMesh !== modifiedFaceMesh) {
  throw new Error(
    "Falha ao aplicar adaptação em facemesh.mjs."
  );
}

console.log(
  "[IncluC0de] Adaptação do FaceMesh concluída."
);

/*
 * ============================================================
 * 6. Leitura e validação do index.mjs adaptado
 * ============================================================
 */

const modifiedIndex = fs.readFileSync(
  modifiedIndexPath,
  "utf8"
);

/*
 * Assinaturas importantes da versão funcional que
 * preservamos durante os testes.
 *
 * Neste momento não estamos tentando reconstruir o index.mjs.
 * Estamos validando e restaurando exatamente a versão que
 * comprovadamente funcionou.
 */

const requiredIndexMarkers = [
  "videoElement.readyState",
  "videoElement.videoWidth",
  "videoElement.videoHeight",
  "setupPreviewVideo()",
  "await videoPreviewSetup",
  "await loop()"
];

for (const marker of requiredIndexMarkers) {
  if (!modifiedIndex.includes(marker)) {
    throw new Error(
      `Arquivo index.mjs adaptado inválido. ` +
      `Não foi encontrado: ${marker}`
    );
  }
}

console.log(
  "[IncluC0de] index.mjs adaptado validado."
);

/*
 * ============================================================
 * 7. Aplicação do index.mjs
 * ============================================================
 */

const currentIndex = fs.readFileSync(
  indexPath,
  "utf8"
);

if (currentIndex === modifiedIndex) {

  console.log(
    "[IncluC0de] index.mjs já está adaptado."
  );

} else {

  fs.writeFileSync(
    indexPath,
    modifiedIndex,
    "utf8"
  );

  console.log(
    "[IncluC0de] index.mjs adaptado."
  );
}

/*
 * Validação após escrita.
 */

const installedIndex = fs.readFileSync(
  indexPath,
  "utf8"
);

if (installedIndex !== modifiedIndex) {
  throw new Error(
    "Falha ao aplicar adaptação em index.mjs."
  );
}

console.log(
  "[IncluC0de] Adaptação do index.mjs concluída."
);

/*
 * ============================================================
 * 8. Resultado final
 * ============================================================
 */

console.log(
  "\n[IncluC0de] WebGazer adaptado com sucesso."
);

console.log(
  "[IncluC0de] Runtime FaceMesh: TensorFlow.js/WebGL."
);

console.log(
  `[IncluC0de] WebGazer: ${WEBGAZER_VERSION}\n`
);