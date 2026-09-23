import {
    useEffect,
    useState,
  } from "react";
  
  import {
    calibrationPoints,
    CALIBRATION_CLICKS_PER_POINT,
  } from "./calibrationPoints";
  
  import "./eyeTracking.css";
  
  function CalibrationOverlay({
    webgazer,
    onComplete,
    onCancel,
    onCameraReady,
  }) {
    /*
     * ==========================================================
     * ESTADOS
     * ==========================================================
     */
  
    const [phase, setPhase] =
      useState("orientation");
  
    const [
      currentPointIndex,
      setCurrentPointIndex,
    ] = useState(0);
  
    const [
      clickCount,
      setClickCount,
    ] = useState(0);
  
    /*
     * ==========================================================
     * POSICIONAMENTO DA CÂMERA
     * ==========================================================
     */
  
    useEffect(() => {
      let cancelled = false;
  
      let retryTimer = null;
  
      let positionedContainer = null;
  
      /*
       * --------------------------------------------------------
       * POSICIONAR
       * --------------------------------------------------------
       */
  
      const positionCamera = () => {
        if (cancelled) {
          return;
        }
  
        const containerId =
          webgazer?.params
            ?.videoContainerId;
  
        if (!containerId) {
          retryTimer =
            window.setTimeout(
              positionCamera,
              50
            );
  
          return;
        }
  
        const container =
          document.getElementById(
            containerId
          );
  
        if (!container) {
          retryTimer =
            window.setTimeout(
              positionCamera,
              50
            );
  
          return;
        }
  
        positionedContainer =
          container;
  
        /*
         * ======================================================
         * GUARDA ESTILOS ORIGINAIS
         * ======================================================
         */
  
        container.dataset.originalPosition =
          container.style.position || "";
  
        container.dataset.originalLeft =
          container.style.left || "";
  
        container.dataset.originalTop =
          container.style.top || "";
  
        container.dataset.originalTransform =
          container.style.transform || "";
  
        container.dataset.originalZIndex =
          container.style.zIndex || "";
  
        /*
         * ======================================================
         * CENTRALIZA
         * ======================================================
         */
  
        container.style.position =
          "fixed";
  
        container.style.left =
          "50%";
  
        container.style.top =
          "37%";
  
        container.style.transform =
          "translate(-50%, -50%)";
  
        container.style.zIndex =
          "10020";
  
        /*
         * ======================================================
         * GARANTE ELEMENTOS VISUAIS
         * ======================================================
         */
  
        webgazer
          .showVideoPreview(true)
          .showPredictionPoints(false)
          .showFaceOverlay(true)
          .showFaceFeedbackBox(true);
  
        /*
         * Algumas funções do WebGazer podem
         * alterar estilos. Portanto reforçamos.
         */
  
        container.style.position =
          "fixed";
  
        container.style.left =
          "50%";
  
        container.style.top =
          "37%";
  
        container.style.transform =
          "translate(-50%, -50%)";
  
        container.style.zIndex =
          "10020";
  
        /*
         * ======================================================
         * AGUARDA O PRÓXIMO FRAME
         * ======================================================
         *
         * Nesse momento:
         *
         * - container existe;
         * - câmera existe;
         * - posição está correta;
         * - overlay já está renderizado.
         *
         * Agora podemos remover a proteção
         * que o mantinha invisível.
         */
  
        requestAnimationFrame(
          () => {
            if (cancelled) {
              return;
            }
  
            requestAnimationFrame(
              () => {
                if (cancelled) {
                  return;
                }
  
                onCameraReady?.();
  
                console.log(
                  "[Calibration] Câmera posicionada. Exibição liberada."
                );
              }
            );
          }
        );
      };
  
      positionCamera();
  
      /*
       * ========================================================
       * CLEANUP
       * ========================================================
       */
  
      return () => {
        cancelled = true;
  
        if (retryTimer) {
          window.clearTimeout(
            retryTimer
          );
        }
  
        if (!positionedContainer) {
          return;
        }
  
        positionedContainer.style.position =
          positionedContainer.dataset
            .originalPosition || "";
  
        positionedContainer.style.left =
          positionedContainer.dataset
            .originalLeft || "";
  
        positionedContainer.style.top =
          positionedContainer.dataset
            .originalTop || "";
  
        positionedContainer.style.transform =
          positionedContainer.dataset
            .originalTransform || "";
  
        positionedContainer.style.zIndex =
          positionedContainer.dataset
            .originalZIndex || "";
  
        delete positionedContainer.dataset
          .originalPosition;
  
        delete positionedContainer.dataset
          .originalLeft;
  
        delete positionedContainer.dataset
          .originalTop;
  
        delete positionedContainer.dataset
          .originalTransform;
  
        delete positionedContainer.dataset
          .originalZIndex;
      };
    }, [
      webgazer,
      onCameraReady,
    ]);
  
    /*
     * ==========================================================
     * COMEÇAR
     * ==========================================================
     */
  
    function startCalibration() {
      console.log(
        "[Calibration] Calibração iniciada."
      );
  
      setCurrentPointIndex(0);
  
      setClickCount(0);
  
      setPhase("calibration");
    }
  
    /*
     * ==========================================================
     * CLIQUE NO PONTO
     * ==========================================================
     */
  
    function handlePointClick(
      pointIndex
    ) {
      if (
        phase !== "calibration"
      ) {
        return;
      }
  
      if (
        pointIndex !==
        currentPointIndex
      ) {
        return;
      }
  
      const nextCount =
        clickCount + 1;
  
      console.log(
        `[Calibration] Ponto ${
          currentPointIndex + 1
        } - clique ${nextCount}/${CALIBRATION_CLICKS_PER_POINT}`
      );
  
      /*
       * Ainda faltam cliques.
       */
  
      if (
        nextCount <
        CALIBRATION_CLICKS_PER_POINT
      ) {
        setClickCount(
          nextCount
        );
  
        return;
      }
  
      /*
       * Ponto concluído.
       */
  
      const isLastPoint =
        currentPointIndex ===
        calibrationPoints.length - 1;
  
      /*
       * --------------------------------------------------------
       * ÚLTIMO PONTO
       * --------------------------------------------------------
       */
  
      if (isLastPoint) {
        console.log(
          "[Calibration] Todos os pontos concluídos."
        );
  
        setClickCount(
          CALIBRATION_CLICKS_PER_POINT
        );
  
        setPhase("completed");
  
        window.setTimeout(
          () => {
            onComplete();
          },
          750
        );
  
        return;
      }
  
      /*
       * --------------------------------------------------------
       * PRÓXIMO
       * --------------------------------------------------------
       */
  
      setCurrentPointIndex(
        (current) =>
          current + 1
      );
  
      setClickCount(0);
    }
  
    /*
     * ==========================================================
     * ESTADO DO PONTO
     * ==========================================================
     */
  
    function getPointState(index) {
      if (
        phase === "orientation"
      ) {
        return "pending";
      }
  
      if (
        phase === "completed"
      ) {
        return "completed";
      }
  
      if (
        index <
        currentPointIndex
      ) {
        return "completed";
      }
  
      if (
        index ===
        currentPointIndex
      ) {
        return "active";
      }
  
      return "pending";
    }
  
    /*
     * ==========================================================
     * CONTEÚDO DO PONTO
     * ==========================================================
     */
  
    function getPointContent(
      pointState
    ) {
      if (
        pointState ===
        "completed"
      ) {
        return "✓";
      }
  
      if (
        pointState ===
        "active"
      ) {
        return Math.min(
          clickCount + 1,
          CALIBRATION_CLICKS_PER_POINT
        );
      }
  
      return "";
    }
  
    const currentPoint =
      calibrationPoints[
        currentPointIndex
      ];
  
    /*
     * ==========================================================
     * RENDER
     * ==========================================================
     */
  
    return (
      <div
        className="calibration-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Calibração do rastreamento ocular"
      >
        {/*
         * ======================================================
         * PONTOS
         * ======================================================
         */}
  
        {calibrationPoints.map(
          (point, index) => {
            const pointState =
              getPointState(index);
  
            const content =
              getPointContent(
                pointState
              );
  
            return (
              <button
                key={point.id}
                type="button"
  
                className={`
                  calibration-point
                  calibration-point-${pointState}
                `}
  
                style={{
                  left:
                    `${point.x}%`,
  
                  top:
                    `${point.y}%`,
                }}
  
                onClick={() =>
                  handlePointClick(
                    index
                  )
                }
  
                disabled={
                  phase !==
                    "calibration" ||
                  index !==
                    currentPointIndex
                }
  
                aria-label={
                  pointState ===
                  "active"
                    ? `Ponto de calibração ${point.id}, ${point.label}. Clique ${clickCount + 1} de ${CALIBRATION_CLICKS_PER_POINT}.`
                    : pointState ===
                        "completed"
                      ? `Ponto de calibração ${point.id} concluído.`
                      : `Ponto de calibração ${point.id}, ${point.label}.`
                }
              >
                {content}
              </button>
            );
          }
        )}
  
        {/*
         * ======================================================
         * INSTRUÇÕES
         * ======================================================
         */}
  
        <section
          className="calibration-instructions"
          aria-live="polite"
        >
          {phase ===
            "orientation" && (
            <>
              <h2>
                Calibração do
                rastreamento ocular
              </h2>
  
              <p>
                Posicione-se
                confortavelmente diante
                da câmera.
              </p>
  
              <p>
                Você verá 8 pontos ao
                redor da tela. Um ponto
                será destacado de cada
                vez.
              </p>
  
              <p>
                Olhe para o ponto
                destacado e clique nele
                até concluir essa
                posição.
              </p>
  
              <div
                className="calibration-actions"
              >
                <button
                  type="button"
                  className="calibration-start-button"
                  onClick={
                    startCalibration
                  }
                >
                  Começar
                </button>
  
                <button
                  type="button"
                  className="calibration-cancel-button"
                  onClick={
                    onCancel
                  }
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
  
          {phase ===
            "calibration" && (
            <>
              <h2>
                {
                  currentPoint
                    .instruction
                }
              </h2>
  
              <p>
                Mantenha o olhar no
                ponto enquanto clica.
              </p>
  
              <button
                type="button"
                className="calibration-cancel-button"
                onClick={
                  onCancel
                }
              >
                Cancelar
              </button>
            </>
          )}
  
          {phase ===
            "completed" && (
            <div
              className="calibration-completed"
            >
              <div
                className="calibration-completed-icon"
                aria-hidden="true"
              >
                ✓
              </div>
  
              <h2>
                Calibração concluída
              </h2>
  
              <p>
                O rastreamento ocular
                está pronto.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  }
  
  export default CalibrationOverlay;