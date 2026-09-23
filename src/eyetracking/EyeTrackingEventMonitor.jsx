import {
    EyeTrackingState,
    useEyeTracking,
  } from "./EyeTrackingProvider";
  
  /*
   * ============================================================
   * FORMATAÇÃO DO HORÁRIO
   * ============================================================
   */
  
  function formatTime(timestamp) {
  
    if (!timestamp) {
      return "--:--:--";
    }
  
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
  
        fractionalSecondDigits: 3,
  
        hour12: false,
      }
    ).format(
      new Date(timestamp)
    );
  }
  
  /*
   * ============================================================
   * CLASSE VISUAL DO EVENTO
   * ============================================================
   */
  
  function eventClassName(event) {
  
    const gazeState =
      event?.gaze?.state;
  
    /*
     * Conforme definido para
     * esta interface de diagnóstico:
     *
     * INSIDE  = vermelho
     * OUTSIDE = verde
     */
  
    if (
      gazeState === "INSIDE"
    ) {
      return (
        "event-row event-inside"
      );
    }
  
    if (
      gazeState === "OUTSIDE"
    ) {
      return (
        "event-row event-outside"
      );
    }
  
    if (
      gazeState === "LOST"
    ) {
      return (
        "event-row event-lost"
      );
    }
  
    /*
     * PAGE_*
     * WINDOW_*
     */
  
    return (
      "event-row event-browser"
    );
  }
  
  /*
   * ============================================================
   * COMPONENTE
   * ============================================================
   */
  
  export default function EyeTrackingEventMonitor({
    onEndSession,
  }) {
  
    const {
  
      state,
  
      gaze,
  
      gazeState,
  
      events,
  
      clearEvents,
  
      session,
  
      disable,
  
    } = useEyeTracking();
  
    /*
     * ==========================================================
     * ENCERRAR SESSÃO
     * ==========================================================
     */
  
    async function handleEndSession() {
  
      /*
       * Se EyeTracking estiver ativo,
       * primeiro liberamos a câmera.
       */
  
      if (
        state !==
        EyeTrackingState.OFF
      ) {
        await disable();
      }
  
      onEndSession?.();
    }
  
    /*
     * ==========================================================
     * RENDER
     * ==========================================================
     */
  
    return (
  
      <section
        className="event-monitor"
      >
  
        {/* =====================================================
            CABEÇALHO
            ===================================================== */}
  
        <div
          className="event-monitor-header"
        >
  
          <div>
  
            <h2>
              EyeTracking — Eventos observados
            </h2>
  
            <p>
              Buffer local temporário para
              validação do futuro log remoto.
            </p>
  
          </div>
  
          <div
            className="event-monitor-actions"
          >
  
            <button
              type="button"
              onClick={clearEvents}
            >
              Limpar buffer
            </button>
  
            <button
              type="button"
              className="end-session-button"
              onClick={handleEndSession}
            >
              Encerrar sessão
            </button>
  
          </div>
  
        </div>
  
        {/* =====================================================
            IDENTIFICAÇÃO DA SESSÃO
            ===================================================== */}
  
        <dl
          className="session-data"
        >
  
          <div>
  
            <dt>
              User ID
            </dt>
  
            <dd>
              {session.userId}
            </dd>
  
          </div>
  
          <div>
  
            <dt>
              Application
            </dt>
  
            <dd>
              {
                session.applicationName
              }
            </dd>
  
          </div>
  
          <div>
  
            <dt>
              Session ID
            </dt>
  
            <dd>
              {session.sessionId}
            </dd>
  
          </div>
  
        </dl>
  
        {/* =====================================================
            ESTADO ATUAL DO OLHAR
            ===================================================== */}
  
        <div
          className="current-gaze-card"
        >
  
          <span>
            Estado atual do olhar
          </span>
  
          <strong
            className={
              `current-gaze current-gaze-${
                gazeState.toLowerCase()
              }`
            }
          >
  
            <span
              className="current-gaze-dot"
            />
  
            {gazeState}
  
          </strong>
  
          <small>
  
            x: {
              gaze.x ?? "—"
            }
  
            {" · "}
  
            y: {
              gaze.y ?? "—"
            }
  
          </small>
  
        </div>
  
        {/* =====================================================
            CONTADOR
            ===================================================== */}
  
        <div
          className="event-list-header"
        >
  
          <strong>
            Eventos
          </strong>
  
          <span>
            {events.length} / 50 no buffer
          </span>
  
        </div>
  
        {/* =====================================================
            LISTA DE EVENTOS
            ===================================================== */}
  
        <div
          className="event-list"
        >
  
          {
            events.length === 0
              ? (
  
                <div
                  className="event-empty"
                >
  
                  Nenhum evento registrado.
                  Ative o Eye Tracking e
                  conclua a calibração para
                  iniciar a observação.
  
                </div>
  
              )
              : (
  
                events.map(
                  (item) => (
  
                    <article
  
                      key={item.id}
  
                      className={
                        eventClassName(
                          item
                        )
                      }
  
                    >
  
                      {/* HORÁRIO */}
  
                      <time>
  
                        {
                          formatTime(
                            item.timestamp
                          )
                        }
  
                      </time>
  
                      {/* EVENTO */}
  
                      <div
                        className="event-description"
                      >
  
                        <strong>
                          {
                            item.event.type
                          }
                        </strong>
  
                        <span>
  
                          {
                            item.event.source
                          }
  
                          {
                            item.gaze && (
                              <>
  
                                {" · "}
  
                                {
                                  item.gaze.state
                                }
  
                                {" · x:"}
  
                                {
                                  item.gaze.x ??
                                  "—"
                                }
  
                                {" y:"}
  
                                {
                                  item.gaze.y ??
                                  "—"
                                }
  
                              </>
                            )
                          }
  
                        </span>
  
                      </div>
  
                      {/* JSON COMPLETO */}
  
                      <details>
  
                        <summary>
                          JSON
                        </summary>
  
                        <pre>
  
                          {
                            JSON.stringify(
                              item,
                              null,
                              2
                            )
                          }
  
                        </pre>
  
                      </details>
  
                    </article>
  
                  )
                )
  
              )
          }
  
        </div>
  
      </section>
    );
  }