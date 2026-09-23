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
     * CÂMERA / PREVIEW
     * ==========================================================
     */
  
    useEffect(() => {
      let cancelled = false;
      let retryTimer = null;
      let cameraReleased = false;
      let calibrationContainer = null;
  
      /*
       * --------------------------------------------------------
       * NORMALIZA O ELEMENTO DE VÍDEO
       * --------------------------------------------------------
       */
  
      const normalizeVideoElement =
        () => {
          const videoId =
            webgazer?.params
              ?.videoElementId;
  
          let video = null;
  
          /*
           * Tenta localizar pelo ID
           * fornecido pelo WebGazer.
           */
  
          if (videoId) {
            video =
              document.getElementById(
                videoId
              );
          }
  
          /*
           * Fallback:
           * procura o vídeo dentro
           * do container.
           */
  
          if (!video) {
            const containerId =
              webgazer?.params
                ?.videoContainerId;
  
            const container =
              containerId
                ? document.getElementById(
                    containerId
                  )
                : null;
  
            video =
              container?.querySelector(
                "video"
              ) || null;
          }
  
          if (!video) {
            console.warn(
              "[Calibration] Elemento <video> ainda não encontrado."
            );
  
            return false;
          }
  
          /*
           * Restaura a exibição do vídeo.
           */
  
          video.style.display =
            "block";
  
          video.style.visibility =
            "visible";
  
          video.style.opacity =
            "1";
  
          video.hidden = false;
  
          return true;
        };
  
      /*
       * --------------------------------------------------------
       * PREPARA O CONTAINER
       * --------------------------------------------------------
       */
  
      const prepareCamera = () => {
        if (cancelled) {
          return;
        }
  
        const containerId =
          webgazer?.params
            ?.videoContainerId;
  
        if (!containerId) {
          console.log(
            "[Calibration] Aguardando videoContainerId..."
          );
  
          retryTimer =
            window.setTimeout(
              prepareCamera,
              50
            );
  
          return;
        }
  
        const container =
          document.getElementById(
            containerId
          );
  
        if (!container) {
          console.log(
            "[Calibration] Aguardando container de vídeo..."
          );
  
          retryTimer =
            window.setTimeout(
              prepareCamera,
              50
            );
  
          return;
        }
  
        calibrationContainer =
          container;
  
        /*
         * ======================================================
         * RESPONSIVIDADE
         * ======================================================
         *
         * Não posicionamos mais a câmera
         * diretamente via:
         *
         * container.style.top = ...
         *
         * A posição e o tamanho passam
         * a ser controlados pelo CSS.
         */
  
        container.classList.add(
          "incluc0de-calibration-camera"
        );
  
        /*
         * Normaliza propriedades que podem
         * ter permanecido de uma sessão anterior.
         */
  
        container.style.display =
          "block";
  
        container.style.opacity =
          "1";
  
        /*
         * ======================================================
         * GARANTE OS VISUAIS DO WEBGAZER
         * ======================================================
         */
  
        try {
          webgazer
            .showVideoPreview(true)
            .showPredictionPoints(false)
            .showFaceOverlay(true)
            .showFaceFeedbackBox(true);
        } catch (err) {
          console.warn(
            "[Calibration] Erro ao configurar elementos visuais:",
            err
          );
        }
  
        /*
         * Normaliza o próprio <video>.
         */
  
        normalizeVideoElement();
  
        /*
         * showVideoPreview() pode modificar
         * estilos. Garantimos novamente
         * nossa classe responsiva.
         */
  
        container.classList.add(
          "incluc0de-calibration-camera"
        );
  
        container.style.display =
          "block";
  
        container.style.opacity =
          "1";
  
        /*
         * ======================================================
         * LIBERA A EXIBIÇÃO
         * ======================================================
         */
  
        requestAnimationFrame(
          () => {
            if (cancelled) {
              return;
            }
  
            normalizeVideoElement();
  
            requestAnimationFrame(
              () => {
                if (cancelled) {
                  return;
                }
  
                if (cameraReleased) {
                  return;
                }
  
                normalizeVideoElement();
  
                cameraReleased = true;
  
                /*
                 * O Provider remove a proteção
                 * que escondia o container
                 * durante begin().
                 */
  
                onCameraReady?.();
  
                container.style.visibility =
                  "visible";
  
                container.style.display =
                  "block";
  
                container.style.opacity =
                  "1";
  
                normalizeVideoElement();
  
                console.log(
                  "[Calibration] Câmera preparada e exibida."
                );
              }
            );
          }
        );
      };
  
      prepareCamera();
  
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
  
        /*
         * Removemos apenas nossa classe
         * responsiva.
         *
         * Não restauramos visibility/display/
         * opacity, pois o Provider controla
         * o ciclo de vida do WebGazer.
         */
  
        if (calibrationContainer) {
          calibrationContainer
            .classList.remove(
              "incluc0de-calibration-camera"
            );
        }
  
        console.log(
          "[Calibration] Overlay desmontado."
        );
      };
    }, [
      webgazer,
      onCameraReady,
    ]);
  
    /*
     * ==========================================================
     * INICIAR CALIBRAÇÃO
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
  
      const isLastPoint =
        currentPointIndex ===
        calibrationPoints.length - 1;
  
      /*
       * ========================================================
       * ÚLTIMO PONTO
       * ========================================================
       */
  
      if (isLastPoint) {
        console.log(
          "[Calibration] Todos os pontos concluídos."
        );
  
        setClickCount(
          CALIBRATION_CLICKS_PER_POINT
        );
  
        setPhase(
          "completed"
        );
  
        window.setTimeout(
          () => {
            onComplete();
          },
          750
        );
  
        return;
      }
  
      /*
       * ========================================================
       * PRÓXIMO PONTO
       * ========================================================
       */
  
      setCurrentPointIndex(
        (current) =>
          current + 1
      );
  
      setClickCount(0);
    }
  
    /*
     * ==========================================================
     * ESTADO VISUAL DOS PONTOS
     * ==========================================================
     */
  
    function getPointState(
      index
    ) {
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
         * OITO PONTOS
         * ======================================================
         */}
  
        {calibrationPoints.map(
          (point, index) => {
            const pointState =
              getPointState(
                index
              );
  
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
         * PAINEL CENTRAL
         * ======================================================
         */}
  
        <section
          className="calibration-instructions"
          aria-live="polite"
        >
          {/*
           * ----------------------------------------------------
           * ORIENTAÇÃO
           * ----------------------------------------------------
           */}
  
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
  
          {/*
           * ----------------------------------------------------
           * CALIBRAÇÃO
           * ----------------------------------------------------
           */}
  
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
  
          {/*
           * ----------------------------------------------------
           * CONCLUSÃO
           * ----------------------------------------------------
           */}
  
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