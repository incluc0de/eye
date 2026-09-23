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
  userId,
  applicationName,
  sessionId,
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
   * BUFFER DE EVENTOS OBSERVÁVEIS
   * ==========================================================
   */

  const [events, setEvents] =
    useState([]);

  const [gazeState, setGazeState] =
    useState("UNKNOWN");

  const monitoringRef =
    useRef(false);

  const gazeStateRef =
    useRef("UNKNOWN");

  const lastPredictionAtRef =
    useRef(null);

  const browserActiveRef =
    useRef(true);

  const MAX_EVENTS = 50;

  const GAZE_LOST_AFTER_MS =
    1500;

  /*
   * ==========================================================
   * GERAR ID DO EVENTO
   * ==========================================================
   */

  function createEventId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      return (
        `evt_${crypto.randomUUID()}`
      );
    }

    return (
      `evt_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`
    );
  }

  /*
   * ==========================================================
   * ADICIONAR EVENTO AO BUFFER
   * ==========================================================
   *
   * Esta função centraliza a criação dos eventos.
   *
   * Posteriormente, este é um dos pontos naturais
   * para integrar o POST para o serviço remoto.
   * ==========================================================
   */

  function appendEvent(
    type,
    source,
    extra = {}
  ) {
    /*
     * Não registramos eventos antes da
     * conclusão da calibração.
     */

    if (!monitoringRef.current) {
      return;
    }

    const event = {
      id:
        createEventId(),

      schemaVersion:
        "1.0",

      timestamp:
        new Date().toISOString(),

      sessionId,

      userId,

      application: {
        name:
          applicationName,
      },

      provider: {
        name:
          "EyeTrackingContext",

        version:
          "1.0",
      },

      event: {
        type,
        source,
      },

      browser: {
        visibilityState:
          document.visibilityState,

        hasFocus:
          document.hasFocus(),
      },

      ...extra,
    };

    /*
     * Mantemos apenas os 50
     * eventos mais recentes.
     */

    setEvents(
      (current) =>
        [
          event,
          ...current,
        ].slice(
          0,
          MAX_EVENTS
        )
    );

    console.log(
      "[EyeTracking] EVENT",
      event
    );
  }

  /*
   * ==========================================================
   * ATUALIZAR ESTADO DO OLHAR
   * ==========================================================
   *
   * Apenas mudanças de estado geram eventos.
   *
   * INSIDE -> INSIDE
   * nenhum evento
   *
   * INSIDE -> OUTSIDE
   * GAZE_OUTSIDE_CONTENT
   *
   * OUTSIDE -> INSIDE
   * GAZE_ON_CONTENT
   *
   * qualquer -> LOST
   * GAZE_LOST
   *
   * LOST -> INSIDE/OUTSIDE
   * GAZE_RECOVERED
   * ==========================================================
   */

  function updateGazeState(
    nextState,
    gazeData = null
  ) {
    const previousState =
      gazeStateRef.current;

    /*
     * Estado não mudou.
     *
     * Não geramos novo evento.
     */

    if (
      previousState ===
      nextState
    ) {
      return;
    }

    gazeStateRef.current =
      nextState;

    setGazeState(
      nextState
    );

    /*
     * Informações do gaze associadas
     * ao evento.
     */

    const gazePayload =
      gazeData
        ? {
            gaze: {
              state:
                nextState,

              x:
                gazeData.x,

              y:
                gazeData.y,

              viewport: {
                width:
                  window.innerWidth,

                height:
                  window.innerHeight,
              },
            },
          }
        : {
            gaze: {
              state:
                nextState,

              x:
                null,

              y:
                null,

              viewport: {
                width:
                  window.innerWidth,

                height:
                  window.innerHeight,
              },
            },
          };

    /*
     * --------------------------------------------------------
     * GAZE LOST
     * --------------------------------------------------------
     */

    if (
      nextState ===
      "LOST"
    ) {
      appendEvent(
        "GAZE_LOST",
        "gaze",
        gazePayload
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * RECUPERAÇÃO DO GAZE
     * --------------------------------------------------------
     */

    if (
      previousState ===
      "LOST"
    ) {
      appendEvent(
        "GAZE_RECOVERED",
        "gaze",
        gazePayload
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * INSIDE / OUTSIDE
     * --------------------------------------------------------
     */

    appendEvent(
      nextState ===
        "INSIDE"
        ? "GAZE_ON_CONTENT"
        : "GAZE_OUTSIDE_CONTENT",

      "gaze",

      gazePayload
    );
  }

  /*
   * ==========================================================
   * LISTENER DO GAZE
   * ==========================================================
   */

  function configureGazeListener() {
    webgazer.setGazeListener(
      (
        data,
        elapsedTime
      ) => {
        /*
         * WebGazer não produziu
         * uma coordenada válida.
         */

        if (!data) {
          return;
        }

        /*
         * Provider desmontado.
         */

        if (
          !mountedRef.current
        ) {
          return;
        }

        /*
         * WebGazer não está ativo.
         */

        if (
          !startedRef.current
        ) {
          return;
        }

        /*
         * ----------------------------------------------------
         * COORDENADAS
         * ----------------------------------------------------
         */

        const gazeX =
          Math.round(
            data.x
          );

        const gazeY =
          Math.round(
            data.y
          );

        const predictionAt =
          Date.now();

        /*
         * Guarda o horário da
         * última predição válida.
         */

        lastPredictionAtRef.current =
          predictionAt;

        /*
         * Mantém o gaze disponível
         * para os componentes.
         */

        setGaze({
          x:
            gazeX,

          y:
            gazeY,

          elapsedTime,

          lastPredictionAt:
            predictionAt,
        });

        /*
         * ----------------------------------------------------
         * CLASSIFICAÇÃO INSIDE / OUTSIDE
         * ----------------------------------------------------
         *
         * Só fazemos essa classificação quando:
         *
         * - calibração terminou;
         * - monitoramento está ativo;
         * - aplicação está visível;
         * - janela possui foco.
         */

        if (
          monitoringRef.current &&
          browserActiveRef.current
        ) {
          const inside =
            gazeX >= 0 &&
            gazeY >= 0 &&
            gazeX <=
              window.innerWidth &&
            gazeY <=
              window.innerHeight;

          updateGazeState(
            inside
              ? "INSIDE"
              : "OUTSIDE",
            {
              x:
                gazeX,

              y:
                gazeY,
            }
          );
        }

        console.log(
          "[EyeTracking] GAZE",
          {
            x:
              gazeX,

            y:
              gazeY,

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
      document.createElement(
        "style"
      );

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
        .showVideoPreview(
          false
        )
        .showPredictionPoints(
          false
        )
        .showFaceOverlay(
          false
        )
        .showFaceFeedbackBox(
          false
        );
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
      x:
        null,

      y:
        null,

      elapsedTime:
        null,

      lastPredictionAt:
        null,
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
           * Desassocia o stream
           * do elemento.
           */

          video.srcObject =
            null;

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
     * Por segurança, remove
     * a regra temporária.
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
    if (
      startedRef.current
    ) {
      return;
    }

    if (
      initializingRef.current
    ) {
      return;
    }

    try {
      initializingRef.current =
        true;

      setError(
        null
      );

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
       */

      webgazer
        .showVideoPreview(
          true
        )
        .showPredictionPoints(
          false
        )
        .showFaceOverlay(
          true
        )
        .showFaceFeedbackBox(
          true
        );

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
       */

      if (
        mountedRef.current
      ) {
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

      if (
        !mountedRef.current
      ) {
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

    /*
     * A partir deste ponto começamos
     * a gerar o buffer de observações.
     */

    monitoringRef.current =
      true;

    /*
     * Determina se a aplicação
     * está realmente ativa.
     */

    browserActiveRef.current =
      document.visibilityState ===
        "visible" &&
      document.hasFocus();

    /*
     * Reinicia a referência temporal.
     */

    lastPredictionAtRef.current =
      Date.now();

    /*
     * O primeiro gaze válido determinará
     * INSIDE ou OUTSIDE.
     */

    gazeStateRef.current =
      "UNKNOWN";

    setGazeState(
      "UNKNOWN"
    );

    if (
      mountedRef.current
    ) {
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
       * Para geração de novos eventos.
       */

      monitoringRef.current =
        false;

      gazeStateRef.current =
        "UNKNOWN";

      setGazeState(
        "UNKNOWN"
      );

      lastPredictionAtRef.current =
        null;

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

      if (
        mountedRef.current
      ) {
        resetGaze();

        setError(
          null
        );

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

      if (
        !mountedRef.current
      ) {
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

    if (
      initializingRef.current
    ) {
      return;
    }

    /*
     * Está ativo:
     * desativar.
     */

    if (
      startedRef.current
    ) {
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
   * EVENTOS DO NAVEGADOR
   * ==========================================================
   *
   * PAGE_HIDDEN / PAGE_VISIBLE
   *
   * WINDOW_BLUR / WINDOW_FOCUS
   *
   * Esses eventos representam fatos observáveis.
   *
   * Não tentamos inferir qual aba ou qual
   * aplicação recebeu o foco.
   * ==========================================================
   */

  useEffect(
    () => {
      /*
       * ------------------------------------------------------
       * VISIBILITY CHANGE
       * ------------------------------------------------------
       */

      function handleVisibilityChange() {
        const visible =
          document.visibilityState ===
          "visible";

        browserActiveRef.current =
          visible &&
          document.hasFocus();

        if (
          !monitoringRef.current
        ) {
          return;
        }

        appendEvent(
          visible
            ? "PAGE_VISIBLE"
            : "PAGE_HIDDEN",

          "browser"
        );

        /*
         * Ao retornar para a página,
         * reiniciamos a contagem para LOST.
         *
         * Isso evita interpretar o tempo
         * fora da aba como ausência do gaze.
         */

        if (visible) {
          lastPredictionAtRef.current =
            Date.now();
        }
      }

      /*
       * ------------------------------------------------------
       * WINDOW BLUR
       * ------------------------------------------------------
       */

      function handleWindowBlur() {
        browserActiveRef.current =
          false;

        if (
          monitoringRef.current
        ) {
          appendEvent(
            "WINDOW_BLUR",
            "browser"
          );
        }
      }

      /*
       * ------------------------------------------------------
       * WINDOW FOCUS
       * ------------------------------------------------------
       */

      function handleWindowFocus() {
        browserActiveRef.current =
          document.visibilityState ===
          "visible";

        /*
         * Dá uma nova janela temporal
         * para o WebGazer voltar a
         * produzir predições.
         */

        lastPredictionAtRef.current =
          Date.now();

        if (
          monitoringRef.current
        ) {
          appendEvent(
            "WINDOW_FOCUS",
            "browser"
          );
        }
      }

      /*
       * ------------------------------------------------------
       * REGISTRA LISTENERS
       * ------------------------------------------------------
       */

      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.addEventListener(
        "blur",
        handleWindowBlur
      );

      window.addEventListener(
        "focus",
        handleWindowFocus
      );

      /*
       * ------------------------------------------------------
       * CLEANUP
       * ------------------------------------------------------
       */

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );

        window.removeEventListener(
          "blur",
          handleWindowBlur
        );

        window.removeEventListener(
          "focus",
          handleWindowFocus
        );
      };
    },
    []
  );

  /*
   * ==========================================================
   * DETECÇÃO TEMPORAL DE GAZE LOST
   * ==========================================================
   *
   * Uma ausência isolada de predição não é
   * suficiente para declarar LOST.
   *
   * Atualmente usamos:
   *
   * 1500 ms sem predição válida.
   *
   * E somente quando:
   *
   * - monitoramento está ativo;
   * - página está visível;
   * - janela está em foco.
   * ==========================================================
   */

  useEffect(
    () => {
      const interval =
        window.setInterval(
          () => {
            /*
             * EyeTracking ainda
             * não está monitorando.
             */

            if (
              !monitoringRef.current
            ) {
              return;
            }

            /*
             * Página/janela não está ativa.
             *
             * Nesse caso ausência de gaze
             * não significa GAZE_LOST.
             */

            if (
              !browserActiveRef.current
            ) {
              return;
            }

            const lastPrediction =
              lastPredictionAtRef.current;

            if (
              !lastPrediction
            ) {
              return;
            }

            /*
             * Passou do limite temporal.
             */

            if (
              Date.now() -
                lastPrediction >=
              GAZE_LOST_AFTER_MS
            ) {
              updateGazeState(
                "LOST"
              );
            }
          },

          /*
           * Verificação quatro vezes
           * por segundo.
           */

          250
        );

      return () => {
        window.clearInterval(
          interval
        );
      };
    },
    []
  );

  /*
   * ==========================================================
   * LIMPAR BUFFER
   * ==========================================================
   */

  function clearEvents() {
    setEvents([]);
  }

  /*
   * ==========================================================
   * CLEANUP
   * ==========================================================
   */

  useEffect(
    () => {
      mountedRef.current =
        true;

      return () => {
        mountedRef.current =
          false;

        monitoringRef.current =
          false;

        removeStartupHideStyle();

        /*
         * Não usamos await dentro
         * do cleanup.
         */

        if (
          startedRef.current
        ) {
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
    },
    []
  );

  /*
   * ==========================================================
   * API
   * ==========================================================
   */

  const value = {
    /*
     * Estado do EyeTracking
     */

    state,

    enabled:
      startedRef.current,

    /*
     * Última coordenada
     */

    gaze,

    /*
     * Estado comportamental
     * observável do gaze
     */

    gazeState,

    /*
     * Buffer
     */

    events,

    clearEvents,

    /*
     * Identificação da sessão
     */

    session: {
      sessionId,
      userId,
      applicationName,
    },

    /*
     * Erros
     */

    error,

    /*
     * Operações
     */

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

      {
        state ===
          EyeTrackingState.CALIBRATING &&
        (
          <CalibrationOverlay

            webgazer={
              webgazer
            }

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
        )
      }

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