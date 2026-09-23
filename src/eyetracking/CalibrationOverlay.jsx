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
  
      /*
       * --------------------------------------------------------
       * NORMALIZA O ELEMENTO DE VÍDEO
       * --------------------------------------------------------
       *
       * Depois de uma sessão anterior,
       * showVideoPreview(false) pode ter
       * deixado propriedades visuais no
       * próprio elemento <video>.
       *
       * Portanto não basta mostrar apenas
       * o container.
       */
  
      const normalizeVideoElement =
        () => {
          const videoId =
            webgazer?.params
              ?.videoElementId;
  
          let video = null;
  
          /*
           * Primeiro tenta localizar pelo ID
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
           *
           * se por algum motivo o ID não estiver
           * disponível, procuramos o vídeo dentro
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
           * ====================================================
           * RESTAURA EXIBIÇÃO DO VÍDEO
           * ====================================================
           */
  
          video.style.display =
            "block";
  
          video.style.visibility =
            "visible";
  
          video.style.opacity =
            "1";
  
          /*
           * O elemento deve continuar ocupando
           * normalmente sua área no container.
           */
  
          video.hidden = false;
  
          console.log(
            "[Calibration] Elemento de vídeo normalizado."
          );
  
          return true;
        };
  
      /*
       * --------------------------------------------------------
       * POSICIONAR CÂMERA
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
          console.log(
            "[Calibration] Aguardando videoContainerId..."
          );
  
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
          console.log(
            "[Calibration] Aguardando container de vídeo..."
          );
  
          retryTimer =
            window.setTimeout(
              positionCamera,
              50
            );
  
          return;
        }
  
        /*
         * ======================================================
         * 1. CENTRALIZA O CONTAINER
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
         * 2. NORMALIZA O CONTAINER
         * ======================================================
         */
  
        container.style.display =
          "block";
  
        container.style.opacity =
          "1";
  
        /*
         * A visibility ainda está sendo
         * protegida pelo Provider através
         * da regra CSS com !important.
         */
  
        /*
         * ======================================================
         * 3. MANDA WEBGAZER MOSTRAR O PREVIEW
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
            "[Calibration] Erro ao configurar visuais:",
            err
          );
        }
  
        /*
         * ======================================================
         * 4. NORMALIZA O <VIDEO>
         * ======================================================
         *
         * Esta é a principal correção
         * desta versão.
         */
  
        normalizeVideoElement();
  
        /*
         * ======================================================
         * 5. REFORÇA O CONTAINER
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
  
        container.style.display =
          "block";
  
        container.style.opacity =
          "1";
  
        /*
         * ======================================================
         * 6. AGUARDA DOIS FRAMES
         * ======================================================
         */
  
        requestAnimationFrame(
          () => {
            if (cancelled) {
              return;
            }
  
            /*
             * Normalizamos novamente porque
             * o WebGazer pode alterar o vídeo
             * de forma assíncrona.
             */
  
            normalizeVideoElement();
  
            requestAnimationFrame(
              () => {
                if (cancelled) {
                  return;
                }
  
                if (cameraReleased) {
                  return;
                }
  
                /*
                 * Última normalização antes
                 * da exibição.
                 */
  
                normalizeVideoElement();
  
                /*
                 * ==================================================
                 * 7. REMOVE A PROTEÇÃO DE INICIALIZAÇÃO
                 * ==================================================
                 */
  
                cameraReleased = true;
  
                onCameraReady?.();
  
                /*
                 * Agora o container pode
                 * efetivamente aparecer.
                 */
  
                container.style.visibility =
                  "visible";
  
                container.style.display =
                  "block";
  
                container.style.opacity =
                  "1";
  
                /*
                 * E garantimos mais uma vez
                 * que o vídeo está visível.
                 */
  
                normalizeVideoElement();
  
                console.log(
                  "[Calibration] Câmera centralizada e preview restaurado."
                );
              }
            );
          }
        );
      };
  
      /*
       * Inicia.
       */
  
      positionCamera();
  
      /*
       * ========================================================
       * CLEANUP
       * ========================================================
       *
       * Não restauramos estilos.
       *
       * Provider controla o ciclo de vida:
       *
       * conclusão → esconde visuais
       * cancelamento → encerra WebGazer
       */
  
      return () => {
        cancelled = true;
  
        if (retryTimer) {
          window.clearTimeout(
            retryTimer
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
  
      /*
       * Verifica se é o último ponto.
       */
  
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
     * ESTADO VISUAL
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
     * CONTEÚDO DOS PONTOS
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