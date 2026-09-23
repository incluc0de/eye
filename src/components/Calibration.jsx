import { useState } from "react";

/*
 * ============================================================
 * Pontos utilizados na calibração
 * ============================================================
 *
 * As coordenadas são percentuais da área visível da tela.
 *
 *  1 -------- 2 -------- 3
 *
 *  4 -------- 5 -------- 6
 *
 *  7 -------- 8 -------- 9
 *
 * Evitamos 0% e 100% para que os pontos não fiquem
 * parcialmente fora da tela.
 */

const calibrationPoints = [
  { x: 10, y: 10 },
  { x: 50, y: 10 },
  { x: 90, y: 10 },

  { x: 10, y: 50 },
  { x: 50, y: 50 },
  { x: 90, y: 50 },

  { x: 10, y: 90 },
  { x: 50, y: 90 },
  { x: 90, y: 90 },
];

/*
 * Número de amostras coletadas em cada ponto.
 *
 * 9 pontos × 5 amostras = 45 amostras.
 */

const SAMPLES_PER_POINT = 5;

function Calibration({
  webgazer,
  onComplete,
  onCancel,
}) {
  const [currentPoint, setCurrentPoint] =
    useState(0);

  const [samples, setSamples] =
    useState(0);

  const point =
    calibrationPoints[currentPoint];

  /*
   * ----------------------------------------------------------
   * Registro de uma amostra de calibração
   * ----------------------------------------------------------
   */

  function handleCalibrationClick(event) {
    event.preventDefault();
    event.stopPropagation();

    /*
     * clientX/clientY representam a posição real
     * do ponto clicado na viewport.
     */

    const screenX = event.clientX;
    const screenY = event.clientY;

    /*
     * Informamos explicitamente ao WebGazer:
     *
     * "o usuário estava olhando para esta posição".
     *
     * Esses dados alimentam o modelo de regressão.
     */

    webgazer.recordScreenPosition(
      screenX,
      screenY,
      "click"
    );

    console.log(
      "[Calibration] Amostra registrada",
      {
        point:
          currentPoint + 1,
        sample:
          samples + 1,
        x: screenX,
        y: screenY,
      }
    );

    const nextSample =
      samples + 1;

    /*
     * Ainda precisamos coletar amostras
     * neste mesmo ponto.
     */

    if (
      nextSample <
      SAMPLES_PER_POINT
    ) {
      setSamples(nextSample);
      return;
    }

    /*
     * Terminamos as amostras deste ponto.
     */

    setSamples(0);

    /*
     * Avança para o próximo ponto.
     */

    if (
      currentPoint <
      calibrationPoints.length - 1
    ) {
      setCurrentPoint(
        (value) => value + 1
      );

      return;
    }

    /*
     * Todos os pontos foram calibrados.
     */

    console.log(
      "[Calibration] Calibração concluída."
    );

    onComplete?.();
  }

  /*
   * ----------------------------------------------------------
   * Interface
   * ----------------------------------------------------------
   */

  return (
    <div className="calibration-overlay">

      <div className="calibration-instructions">

        <strong>
          Calibração do Eye Tracking
        </strong>

        <span>
          Olhe diretamente para o ponto
          vermelho e clique nele.
        </span>

        <span>
          Ponto{" "}
          <strong>
            {currentPoint + 1}
          </strong>{" "}
          de{" "}
          <strong>
            {calibrationPoints.length}
          </strong>
        </span>

        <span>
          Amostra{" "}
          <strong>
            {samples + 1}
          </strong>{" "}
          de{" "}
          <strong>
            {SAMPLES_PER_POINT}
          </strong>
        </span>

        <button
          type="button"
          className="calibration-cancel"
          onClick={onCancel}
        >
          Cancelar calibração
        </button>

      </div>

      <button
        type="button"
        className="calibration-point"
        onClick={
          handleCalibrationClick
        }
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
        }}
        aria-label={
          `Ponto de calibração ${
            currentPoint + 1
          }`
        }
      />

    </div>
  );
}

export default Calibration;