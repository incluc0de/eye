import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import webgazer from "webgazer";

import CalibrationOverlay from "./CalibrationOverlay";

const EyeTrackingContext =
  createContext(null);

/*
 * ============================================================
 * ESTADOS
 * ============================================================
 */

export const EyeTrackingState = {
  OFF: "off",
  INITIALIZING: "initializing",
  CALIBRATING: "calibrating",
  TRACKING: "tracking",
  LOST: "lost",
  ERROR: "error",
};

/*
 * ============================================================
 * PROVIDER
 * ============================================================
 */

export function EyeTrackingProvider({
  children,
}) {
  const [state, setState] =
    useState(EyeTrackingState.OFF);

  const [gaze, setGaze] =
    useState({
      x: null,
      y: null,
      elapsedTime: null,
      lastPredictionAt: null,
    });

  const [error, setError] =
    useState(null);

  const startedRef =
    useRef(false);

  const initializingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /*
   * ==========================================================
   * LISTENER DO GAZE
   * ==========================================================
   */

  function configureGazeListener() {
    webgazer.setGazeListener(
      (data, elapsedTime) => {
        if (!data) {
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        if (!startedRef.current) {
          return;
        }

        const gazeX =
          Math.round(data.x);

        const gazeY =
          Math.round(data.y);

        setGaze({
          x: gazeX,
          y: gazeY,
          elapsedTime,
          lastPredictionAt:
            Date.now(),
        });

        console.log(
          "[EyeTracking] GAZE",
          {
            x: gazeX,
            y: gazeY,
            elapsedTime,
          }
        );
      }
    );
  }

  /*
   * ==========================================================
   * OCULTAÇÃO DE INICIALIZAÇÃO
   * ==========================================================
   *
   * Precisamos criar esta regra ANTES de begin().
   *
   * Assim, quando o WebGazer criar o container,
   * ele já nascerá invisível.
   *
   * Não existe mais o intervalo em que o
   * container aparece no canto superior esquerdo.
   */

  function installStartupHideStyle() {
    const existing =
      document.getElementById(
        "incluc0de-webgazer-startup-hide"
      );

    if (existing) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "incluc0de-webgazer-startup-hide";

    /*
     * Pegamos o ID definido pelo próprio
     * WebGazer.
     */

    const containerId =
      webgazer?.params
        ?.videoContainerId;

    if (!containerId) {
      console.warn(
        "[EyeTracking] videoContainerId não disponível."
      );

      return;
    }

    style.textContent = `
      #${containerId} {
        visibility: hidden !important;
      }
    `;

    document.head.appendChild(
      style
    );

    console.log(
      "[EyeTracking] Proteção visual de inicialização instalada."
    );
  }

  /*
   * ==========================================================
   * REMOVER OCULTAÇÃO DE INICIALIZAÇÃO
   * ==========================================================
   */

  function removeStartupHideStyle() {
    const style =
      document.getElementById(
        "incluc0de-webgazer-startup-hide"
      );

    if (style) {
      style.remove();

      console.log(
        "[EyeTracking] Proteção visual removida."
      );
    }
  }

  /*
   * ==========================================================
   * ESCONDER INTERFACE DO WEBGAZER
   * ==========================================================
   */

  function hideTrackingVisuals() {
    try {
      webgazer
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false);
    } catch (err) {
      console.warn(
        "[EyeTracking] Não foi possível esconder algum elemento visual:",
        err
      );
    }
  }

  /*
   * ==========================================================
   * RESET DOS DADOS INTERNOS
   * ==========================================================
   */

  function resetGaze() {
    setGaze({
      x: null,
      y: null,
      elapsedTime: null,
      lastPredictionAt: null,
    });
  }

  /*
   * ==========================================================
   * PARAR A CÂMERA
   * ==========================================================
   *
   * O objetivo aqui é diferente de simplesmente
   * esconder o preview.
   *
   * Queremos realmente parar o MediaStream.
   */

  async function stopCamera() {
    console.log(
      "[EyeTracking] Parando câmera..."
    );

    /*
     * --------------------------------------------------------
     * 1. Encerra WebGazer
     * --------------------------------------------------------
     */

    try {
      await webgazer.end();

      console.log(
        "[EyeTracking] webgazer.end() concluído."
      );
    } catch (err) {
      console.warn(
        "[EyeTracking] Erro em webgazer.end():",
        err
      );
    }

    /*
     * --------------------------------------------------------
     * 2. Garantia adicional usando stopVideo()
     * --------------------------------------------------------
     *
     * Nossa versão do WebGazer disponibiliza
     * esse método para interromper o stream.
     */

    try {
      if (
        typeof webgazer.stopVideo ===
        "function"
      ) {
        await webgazer.stopVideo();

        console.log(
          "[EyeTracking] webgazer.stopVideo() concluído."
        );
      }
    } catch (err) {
      console.warn(
        "[EyeTracking] Erro em webgazer.stopVideo():",
        err
      );
    }

    /*
     * --------------------------------------------------------
     * 3. Garantia final pelo elemento <video>
     * --------------------------------------------------------
     *
     * Se ainda existir um MediaStream associado
     * ao vídeo, paramos todas as tracks.
     */

    try {
      const videoId =
        webgazer?.params
          ?.videoElementId;

      if (videoId) {
        const video =
          document.getElementById(
            videoId
          );

        const stream =
          video?.srcObject;

        if (
          stream &&
          typeof stream.getTracks ===
            "function"
        ) {
          stream
            .getTracks()
            .forEach(
              (track) => {
                try {
                  track.stop();
                } catch (err) {
                  console.warn(
                    "[EyeTracking] Erro ao parar track:",
                    err
                  );
                }
              }
            );

          /*
           * Desassocia o stream do elemento.
           */

          video.srcObject = null;

          console.log(
            "[EyeTracking] MediaStreamTracks encerradas."
          );
        }
      }
    } catch (err) {
      console.warn(
        "[EyeTracking] Erro ao liberar MediaStream:",
        err
      );
    }

    /*
     * Por segurança, remove a regra temporária.
     */

    removeStartupHideStyle();

    console.log(
      "[EyeTracking] Câmera encerrada."
    );
  }

  /*
   * ==========================================================
   * ATIVAR
   * ==========================================================
   */

  async function enable() {
    if (startedRef.current) {
      return;
    }

    if (initializingRef.current) {
      return;
    }

    try {
      initializingRef.current =
        true;

      setError(null);

      setState(
        EyeTrackingState.INITIALIZING
      );

      console.log(
        "[EyeTracking] Inicializando..."
      );

      /*
       * ======================================================
       * 1. INSTALA A PROTEÇÃO ANTES DO BEGIN
       * ======================================================
       */

      installStartupHideStyle();

      /*
       * ======================================================
       * 2. CONFIGURA LISTENER
       * ======================================================
       */

      configureGazeListener();

      /*
       * ======================================================
       * 3. CONFIGURA VISUAIS
       * ======================================================
       *
       * O WebGazer precisa poder criar o preview.
       *
       * Ele será criado normalmente, porém estará
       * invisível por causa da regra CSS instalada
       * anteriormente.
       */

      webgazer
        .showVideoPreview(true)
        .showPredictionPoints(false)
        .showFaceOverlay(true)
        .showFaceFeedbackBox(true);

      /*
       * ======================================================
       * 4. BEGIN
       * ======================================================
       */

      console.log(
        "[EyeTracking] Chamando webgazer.begin()..."
      );

      await webgazer.begin();

      startedRef.current =
        true;

      initializingRef.current =
        false;

      console.log(
        "[EyeTracking] WebGazer iniciado."
      );

      /*
       * ======================================================
       * 5. LIMPA CALIBRAÇÃO ANTERIOR
       * ======================================================
       */

      if (
        typeof webgazer.clearData ===
        "function"
      ) {
        webgazer.clearData();

        console.log(
          "[EyeTracking] Dados anteriores de calibração removidos."
        );
      }

      /*
       * ======================================================
       * 6. MONTA O OVERLAY
       * ======================================================
       *
       * A regra CSS continua ativa.
       *
       * Portanto a câmera ainda está invisível.
       *
       * CalibrationOverlay irá:
       *
       * - centralizar;
       * - remover a proteção;
       * - mostrar a câmera.
       */

      if (mountedRef.current) {
        setState(
          EyeTrackingState.CALIBRATING
        );
      }

      console.log(
        "[EyeTracking] Entrando em calibração."
      );
    } catch (err) {
      startedRef.current =
        false;

      initializingRef.current =
        false;

      removeStartupHideStyle();

      console.error(
        "[EyeTracking] Erro durante inicialização:",
        err
      );

      if (!mountedRef.current) {
        return;
      }

      setError(
        err?.stack ||
          err?.message ||
          String(err)
      );

      setState(
        EyeTrackingState.ERROR
      );
    }
  }

  /*
   * ==========================================================
   * CALIBRAÇÃO CONCLUÍDA
   * ==========================================================
   */

  function completeCalibration() {
    console.log(
      "[EyeTracking] Calibração concluída."
    );

    /*
     * Aqui NÃO desligamos a câmera.
     *
     * O rastreamento deve continuar.
     *
     * Apenas escondemos os elementos visuais.
     */

    hideTrackingVisuals();

    if (mountedRef.current) {
      setState(
        EyeTrackingState.TRACKING
      );
    }
  }

  /*
   * ==========================================================
   * CANCELAR CALIBRAÇÃO
   * ==========================================================
   */

  async function cancelCalibration() {
    console.log(
      "[EyeTracking] Calibração cancelada."
    );

    await disable();
  }

  /*
   * ==========================================================
   * DESATIVAR
   * ==========================================================
   */

  async function disable() {
    /*
     * Impede outro clique de iniciar algo
     * enquanto encerramos.
     */

    initializingRef.current =
      true;

    try {
      console.log(
        "[EyeTracking] Desativando..."
      );

      /*
       * Primeiro escondemos qualquer interface.
       */

      hideTrackingVisuals();

      /*
       * Depois realmente encerramos a câmera.
       */

      await stopCamera();

      /*
       * Somente depois consideramos o
       * Eye Tracking desligado.
       */

      startedRef.current =
        false;

      initializingRef.current =
        false;

      if (mountedRef.current) {
        resetGaze();

        setError(null);

        setState(
          EyeTrackingState.OFF
        );
      }

      console.log(
        "[EyeTracking] Desativado."
      );
    } catch (err) {
      startedRef.current =
        false;

      initializingRef.current =
        false;

      console.error(
        "[EyeTracking] Erro ao desativar:",
        err
      );

      if (!mountedRef.current) {
        return;
      }

      setError(
        err?.stack ||
          err?.message ||
          String(err)
      );

      setState(
        EyeTrackingState.ERROR
      );
    }
  }

  /*
   * ==========================================================
   * TOGGLE
   * ==========================================================
   */

  async function toggle() {
    /*
     * Bloqueia cliques enquanto existe
     * uma operação em andamento.
     */

    if (initializingRef.current) {
      return;
    }

    /*
     * Está ativo:
     * desativar.
     */

    if (startedRef.current) {
      await disable();

      return;
    }

    /*
     * Está desligado:
     * ativar.
     */

    await enable();
  }

  /*
   * ==========================================================
   * CLEANUP
   * ==========================================================
   */

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      removeStartupHideStyle();

      /*
       * Não usamos await dentro do cleanup.
       */

      if (startedRef.current) {
        try {
          webgazer.end();
        } catch (err) {
          console.error(
            "[EyeTracking] Erro no cleanup:",
            err
          );
        }
      }

      startedRef.current =
        false;
    };
  }, []);

  /*
   * ==========================================================
   * API
   * ==========================================================
   */

  const value = {
    state,

    enabled:
      startedRef.current,

    gaze,

    error,

    enable,

    disable,

    toggle,
  };

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <EyeTrackingContext.Provider
      value={value}
    >
      {children}

      {state ===
        EyeTrackingState.CALIBRATING && (
        <CalibrationOverlay
          webgazer={webgazer}
          onComplete={
            completeCalibration
          }
          onCancel={
            cancelCalibration
          }
          onCameraReady={
            removeStartupHideStyle
          }
        />
      )}
    </EyeTrackingContext.Provider>
  );
}

/*
 * ============================================================
 * HOOK
 * ============================================================
 */

export function useEyeTracking() {
  const context =
    useContext(
      EyeTrackingContext
    );

  if (!context) {
    throw new Error(
      "useEyeTracking deve ser utilizado dentro de EyeTrackingProvider."
    );
  }

  return context;
}