import { useState } from "react";

import {
  EyeTrackingProvider,
} from "./eyetracking/EyeTrackingProvider";

import EyeTrackingControl
  from "./eyetracking/EyeTrackingControl";

import EyeTrackingEventMonitor
  from "./eyetracking/EyeTrackingEventMonitor";

import "./App.css";

/*
 * ============================================================
 * GERAR SESSION ID
 * ============================================================
 */

function createSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `sess_${crypto.randomUUID()}`;
  }

  return `sess_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
}

/*
 * ============================================================
 * APP
 * ============================================================
 */

function App() {
  /*
   * Dados digitados antes do início
   * da sessão.
   */

  const [userId, setUserId] =
    useState("");

  const [
    applicationName,
    setApplicationName,
  ] = useState("");

  /*
   * Quando simulation === null,
   * nenhuma sessão está ativa.
   *
   * Quando preenchido:
   *
   * {
   *   userId,
   *   applicationName,
   *   sessionId
   * }
   */

  const [
    simulation,
    setSimulation,
  ] = useState(null);

  /*
   * ==========================================================
   * INICIAR SESSÃO
   * ==========================================================
   */

  function startSimulation(event) {
    event.preventDefault();

    const normalizedUserId =
      userId.trim();

    const normalizedApplicationName =
      applicationName.trim();

    /*
     * Os dois campos são obrigatórios.
     */

    if (
      !normalizedUserId ||
      !normalizedApplicationName
    ) {
      return;
    }

    /*
     * O sessionId é criado automaticamente.
     *
     * A montagem do EyeTrackingProvider
     * acontecerá somente depois disso.
     */

    setSimulation({
      userId:
        normalizedUserId,

      applicationName:
        normalizedApplicationName,

      sessionId:
        createSessionId(),
    });
  }

  /*
   * ==========================================================
   * ENCERRAR SESSÃO
   * ==========================================================
   *
   * O EyeTrackingEventMonitor chama esta função
   * somente depois de solicitar o desligamento
   * do EyeTracking.
   */

  function endSimulation() {
    setSimulation(null);
  }

  /*
   * ==========================================================
   * TELA DE IDENTIFICAÇÃO
   * ==========================================================
   *
   * Enquanto não existe simulation,
   * o EyeTrackingProvider NÃO é montado.
   *
   * Consequentemente:
   *
   * - não existe buffer;
   * - WebGazer não é iniciado;
   * - câmera não é acessada;
   * - eventos não são observados.
   * ==========================================================
   */

  if (!simulation) {
    return (
      <main
        className="simulation-setup"
      >
        <section
          className="simulation-card"
        >
          <div
            className="simulation-card-header"
          >
            <span
              className="simulation-eyebrow"
            >
              EyeTrackingContext
            </span>

            <h1>
              Simulação Eye Tracking
            </h1>

            <p>
              Informe a identificação do
              usuário e da aplicação antes
              de iniciar a coleta de
              observações.
            </p>
          </div>

          <form
            className="simulation-form"
            onSubmit={
              startSimulation
            }
          >
            {/* USER ID */}

            <label
              className="simulation-field"
            >
              <span>
                User ID
              </span>

              <input
                type="text"

                value={
                  userId
                }

                onChange={
                  (event) =>
                    setUserId(
                      event.target.value
                    )
                }

                placeholder="usr_teste_001"

                autoComplete="off"

                required
              />

              <small>
                Identificador utilizado para
                relacionar as observações ao
                usuário.
              </small>
            </label>

            {/* APPLICATION NAME */}

            <label
              className="simulation-field"
            >
              <span>
                Application Name
              </span>

              <input
                type="text"

                value={
                  applicationName
                }

                onChange={
                  (event) =>
                    setApplicationName(
                      event.target.value
                    )
                }

                placeholder="MentorIA NeuroAdaptativo"

                autoComplete="off"

                required
              />

              <small>
                Aplicação na qual o
                EyeTrackingContext está sendo
                simulado.
              </small>
            </label>

            {/* INICIAR */}

            <button
              className="simulation-start-button"
              type="submit"
            >
              Iniciar sessão
            </button>
          </form>
        </section>
      </main>
    );
  }

  /*
   * ==========================================================
   * SESSÃO ATIVA
   * ==========================================================
   *
   * O key=sessionId também garante que uma nova
   * sessão monte uma nova instância do Provider.
   *
   * Portanto uma nova sessão começa com:
   *
   * events = []
   * gazeState = UNKNOWN
   * EyeTracking = OFF
   * ==========================================================
   */

  return (
    <EyeTrackingProvider

      key={
        simulation.sessionId
      }

      userId={
        simulation.userId
      }

      applicationName={
        simulation.applicationName
      }

      sessionId={
        simulation.sessionId
      }

    >
      <main
        className="app-content"
      >
        {/* ===================================================
            CONTEÚDO DA APLICAÇÃO
            =================================================== */}

        <section
          className="demo-content"
        >
          <span
            className="simulation-eyebrow"
          >
            Aplicação de teste
          </span>

          <h1>
            Eye Tracking
          </h1>

          <p>
            Esta área representa o conteúdo
            normal da aplicação que está
            sendo monitorada.
          </p>

          <p>
            Utilize o controle do olho para
            ativar o Eye Tracking. Após a
            calibração, o monitor começará a
            registrar as mudanças observáveis
            do olhar e da aplicação.
          </p>

          <div
            className="demo-area"
          >
            <h2>
              Área de conteúdo
            </h2>

            <p>
              Durante os testes, experimente
              olhar para diferentes regiões
              da tela, retirar o olhar da
              área visível e alternar entre
              abas ou aplicações.
            </p>

            <p>
              O objetivo neste momento é
              validar os eventos produzidos
              pelo EyeTrackingContext antes
              da integração com o serviço
              remoto de logs.
            </p>
          </div>
        </section>

        {/* ===================================================
            MONITOR DE EVENTOS
            =================================================== */}

        <EyeTrackingEventMonitor
          onEndSession={
            endSimulation
          }
        />

      </main>

      {/* =====================================================
          CONTROLE DO EYE TRACKING
          ===================================================== */}

      <EyeTrackingControl />

    </EyeTrackingProvider>
  );
}

export default App;