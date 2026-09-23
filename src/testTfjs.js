import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection
  from "@tensorflow-models/face-landmarks-detection";

export async function testarTfjs(video) {
  console.log("Inicializando TensorFlow.js...");

  await tf.setBackend("webgl");
  await tf.ready();

  console.log("Backend TFJS:", tf.getBackend());

  const model =
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

  console.log("Modelo:", model);

  const detectorConfig = {
    runtime: "tfjs",
    refineLandmarks: true,
    maxFaces: 1,
  };

  console.log("Criando detector TFJS...");

  const detector =
    await faceLandmarksDetection.createDetector(
      model,
      detectorConfig
    );

  console.log("Detector TFJS criado:", detector);

  console.log("Executando estimateFaces()...");

  const faces = await detector.estimateFaces(video);

  console.log("Faces detectadas:", faces);

  return faces;
}