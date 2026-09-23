import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Eye landmark indices for MediaPipe FaceMesh (468 landmarks)
// Reference:
// https://github.com/tensorflow/tfjs-models/blob/master/face-landmarks-detection/mesh_map.jpg
const EYE_INDICES = {
  // Note: "left" and "right" are from the subject's perspective
  leftEyeUpper0: [466, 388, 387, 386, 385, 384, 398],
  leftEyeLower0: [263, 249, 390, 373, 374, 380, 381, 382, 362],

  rightEyeUpper0: [246, 161, 160, 159, 158, 157, 173],
  rightEyeLower0: [33, 7, 163, 144, 145, 153, 154, 155, 133],
};

/**
 * Constructor of TFFaceMesh object
 * @constructor
 */
const TFFaceMesh = function() {
  this.model =
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

  this.detector = null;
  this.predictionReady = false;
};

// Global variable for face landmark positions array
TFFaceMesh.prototype.positionsArray = null;

/**
 * Initialize the face detector using TensorFlow.js + WebGL.
 *
 * This avoids the legacy MediaPipe/WASM runtime.
 *
 * @return {Promise} resolves when detector is ready
 */
TFFaceMesh.prototype.init = async function() {
  if (this.detector) {
    return this.detector;
  }

  console.log(
    '[WebGazer] Inicializando TensorFlow.js...'
  );

  // Use the WebGL backend that was successfully
  // validated independently in the browser.
  await tf.setBackend('webgl');
  await tf.ready();

  console.log(
    '[WebGazer] Backend TensorFlow.js:',
    tf.getBackend()
  );

  const detectorConfig = {
    runtime: 'tfjs',
    refineLandmarks: true,
    maxFaces: 1,
  };

  console.log(
    '[WebGazer] Criando detector FaceMesh com runtime TFJS...'
  );

  this.detector =
    await faceLandmarksDetection.createDetector(
      this.model,
      detectorConfig
    );

  console.log(
    '[WebGazer] Detector FaceMesh TFJS criado com sucesso.'
  );

  return this.detector;
};

/**
 * Isolates the two patches that correspond to the user's eyes
 *
 * @param {Object} video - the video element itself
 * @param {Canvas} imageCanvas - canvas corresponding to the webcam stream
 * @param {Number} width - width of imageCanvas
 * @param {Number} height - height of imageCanvas
 *
 * @return {Object} the two eye patches:
 * first left, then right eye
 */
TFFaceMesh.prototype.getEyePatches = async function(
  video,
  imageCanvas,
  width,
  height
) {

  if (imageCanvas.width === 0) {
    console.log(
      '[WebGazer] imageCanvas ainda possui largura 0.'
    );

    return null;
  }

  // --------------------------------------------------
  // Initialize detector
  // --------------------------------------------------

  await this.init();

  // --------------------------------------------------
  // Detect face
  // --------------------------------------------------

  /*const predictions =
    await this.detector.estimateFaces(video);
*/
const predictions =
  await this.detector.estimateFaces(imageCanvas);

  // DEBUG 1
  console.log(
    '[WebGazer] estimateFaces:',
    predictions?.length ?? 0
  );

  if (
    !predictions ||
    predictions.length === 0
  ) {
    return false;
  }

  // --------------------------------------------------
  // Landmarks
  // --------------------------------------------------

  const keypoints =
    predictions[0].keypoints;

  // DEBUG 2
  console.log(
    '[WebGazer] keypoints:',
    keypoints?.length ?? 0
  );

  if (
    !keypoints ||
    keypoints.length === 0
  ) {
    return false;
  }

  // Convert:
  //
  // { x, y, z }
  //
  // to:
  //
  // [x, y, z]
  //
  // expected by the rest of WebGazer.

  this.positionsArray =
    keypoints.map((kp) => [
      kp.x,
      kp.y,
      kp.z || 0,
    ]);

  // --------------------------------------------------
  // Helper for selecting eye landmarks
  // --------------------------------------------------

  const getPointsByIndices =
    (indices) => {

      return indices.map(
        (idx) => [
          keypoints[idx].x,
          keypoints[idx].y,
          keypoints[idx].z || 0,
        ]
      );
    };

  // --------------------------------------------------
  // Calculate bounding boxes for both eyes
  // --------------------------------------------------

  const [leftBBox, rightBBox] = [

    // Left eye
    {
      eyeTopArc:
        getPointsByIndices(
          EYE_INDICES.leftEyeUpper0
        ),

      eyeBottomArc:
        getPointsByIndices(
          EYE_INDICES.leftEyeLower0
        ),
    },

    // Right eye
    {
      eyeTopArc:
        getPointsByIndices(
          EYE_INDICES.rightEyeUpper0
        ),

      eyeBottomArc:
        getPointsByIndices(
          EYE_INDICES.rightEyeLower0
        ),
    },

  ].map(
    ({
      eyeTopArc,
      eyeBottomArc
    }) => {

      const topLeftOrigin = {

        x: Math.round(
          Math.min(
            ...eyeTopArc.map(
              (v) => v[0]
            )
          )
        ),

        y: Math.round(
          Math.min(
            ...eyeTopArc.map(
              (v) => v[1]
            )
          )
        ),
      };

      const bottomRightOrigin = {

        x: Math.round(
          Math.max(
            ...eyeBottomArc.map(
              (v) => v[0]
            )
          )
        ),

        y: Math.round(
          Math.max(
            ...eyeBottomArc.map(
              (v) => v[1]
            )
          )
        ),
      };

      return {

        origin: topLeftOrigin,

        width:
          bottomRightOrigin.x -
          topLeftOrigin.x,

        height:
          bottomRightOrigin.y -
          topLeftOrigin.y,
      };
    }
  );

  // --------------------------------------------------
  // Eye bounding boxes
  // --------------------------------------------------

  const leftOriginX =
    leftBBox.origin.x;

  const leftOriginY =
    leftBBox.origin.y;

  const leftWidth =
    leftBBox.width;

  const leftHeight =
    leftBBox.height;


  const rightOriginX =
    rightBBox.origin.x;

  const rightOriginY =
    rightBBox.origin.y;

  const rightWidth =
    rightBBox.width;

  const rightHeight =
    rightBBox.height;

  // --------------------------------------------------
  // DEBUG 3
  // --------------------------------------------------

  console.log(
    '[WebGazer] Eye patches:',
    {
      left: {
        x: leftOriginX,
        y: leftOriginY,
        width: leftWidth,
        height: leftHeight,
      },

      right: {
        x: rightOriginX,
        y: rightOriginY,
        width: rightWidth,
        height: rightHeight,
      },
    }
  );

  // --------------------------------------------------
  // Validate dimensions
  // --------------------------------------------------

  if (
    leftWidth <= 0 ||
    rightWidth <= 0
  ) {

    console.log(
      '[WebGazer] Eye patch com largura inválida.',
      {
        leftWidth,
        rightWidth,
      }
    );

    return null;
  }

  if (
    leftHeight <= 0 ||
    rightHeight <= 0
  ) {

    console.log(
      '[WebGazer] Eye patch com altura inválida.',
      {
        leftHeight,
        rightHeight,
      }
    );

    return null;
  }

  // --------------------------------------------------
  // Build eye patch objects
  // --------------------------------------------------

  const eyeObjs = {};

  const context =
    imageCanvas.getContext(
      '2d',
      {
        willReadFrequently: true,
      }
    );

  // --------------------------------------------------
  // Left eye
  // --------------------------------------------------

  const leftImageData =
    context.getImageData(
      leftOriginX,
      leftOriginY,
      leftWidth,
      leftHeight
    );

  eyeObjs.left = {

    patch: leftImageData,

    imagex: leftOriginX,
    imagey: leftOriginY,

    width: leftWidth,
    height: leftHeight,
  };

  // --------------------------------------------------
  // Right eye
  // --------------------------------------------------

  const rightImageData =
    context.getImageData(
      rightOriginX,
      rightOriginY,
      rightWidth,
      rightHeight
    );

  eyeObjs.right = {

    patch: rightImageData,

    imagex: rightOriginX,
    imagey: rightOriginY,

    width: rightWidth,
    height: rightHeight,
  };

  this.predictionReady = true;

  console.log(
    '[WebGazer] Eye patches extraídos com sucesso.'
  );

  return eyeObjs;
};

/**
 * Returns the positions array corresponding
 * to the last call to getEyePatches().
 */
TFFaceMesh.prototype.getPositions =
  function() {

    return this.positionsArray;
  };

/**
 * Reset the tracker to default values
 */
TFFaceMesh.prototype.reset =
  function() {

    console.log(
      'Unimplemented; Tracking.js has no obvious reset function'
    );
  };

/**
 * Draw TF FaceMesh overlay
 */
TFFaceMesh.prototype.drawFaceOverlay =
  function(
    ctx,
    keypoints
  ) {

    if (!keypoints) {
      return;
    }

    ctx.fillStyle =
      '#32EEDB';

    ctx.strokeStyle =
      '#32EEDB';

    ctx.lineWidth =
      0.5;

    for (
      let i = 0;
      i < keypoints.length;
      i++
    ) {

      const x =
        keypoints[i][0];

      const y =
        keypoints[i][1];

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        1,
        0,
        2 * Math.PI
      );

      ctx.closePath();
      ctx.fill();
    }
  };

/**
 * The TFFaceMesh object name
 */
TFFaceMesh.prototype.name =
  'TFFaceMesh';

export default TFFaceMesh;