import {
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import webgazer from "webgazer";
  
  import Calibration from "./components/Calibration";
  
  import "./AppTeste.css";
  
  function AppTeste() {
  
    /*
     * ==========================================================
     * Estado do WebGazer
     * ==========================================================
     */
  
    const [status, setStatus] =
      useState(
        "Aguardando início..."
      );
  
    const [x, setX] =
      useState("-");
  
    const [y, setY] =
      useState("-");
  
    const [
      predictions,
      setPredictions,
    ] = useState(0);
  
    const [erro, setErro] =
      useState(null);
  
    const [
      iniciando,
      setIniciando,
    ] = useState(false);
  
    const [ativo, setAtivo] =
      useState(false);
  
    /*
     * ==========================================================
     * Estado da calibração
     * ==========================================================
     */
  
    const [
      calibrating,
      setCalibrating,
    ] = useState(false);
  
    const [
      calibrated,
      setCalibrated,
    ] = useState(false);
  
    /*
     * ==========================================================
     * Referências
     * ==========================================================
     */
  
    const iniciadoRef =
      useRef(false);
  
    /*
     * ==========================================================
     * Inicialização do WebGazer
     * ==========================================================
     */
  
    async function iniciarWebGazer() {
  
      if (
        iniciadoRef.current ||
        iniciando
      ) {
        return;
      }
  
      try {
  
        setIniciando(true);
  
        setErro(null);
  
        setStatus(
          "Inicializando WebGazer..."
        );
  
        console.log(
          "WebGazer:",
          webgazer
        );
  
        console.log(
          "begin:",
          typeof webgazer.begin
        );
  
        console.log(
          "setGazeListener:",
          typeof webgazer.setGazeListener
        );
  
        /*
         * ------------------------------------------------------
         * Listener das coordenadas do olhar
         * ------------------------------------------------------
         */
  
        webgazer.setGazeListener(
          (
            data,
            elapsedTime
          ) => {
  
            if (!data) {
              return;
            }
  
            const gazeX =
              Math.round(data.x);
  
            const gazeY =
              Math.round(data.y);
  
            setX(gazeX);
  
            setY(gazeY);
  
            setPredictions(
              (valorAtual) =>
                valorAtual + 1
            );
  
            setStatus(
              "Rastreamento ativo"
            );
  
            console.log(
              "GAZE",
              {
                x: gazeX,
                y: gazeY,
                elapsedTime,
              }
            );
          }
        );
  
        /*
         * ------------------------------------------------------
         * Configurações visuais do WebGazer
         * ------------------------------------------------------
         */
  
        webgazer
          .showVideoPreview(true)
          .showPredictionPoints(true)
          .showFaceOverlay(true)
          .showFaceFeedbackBox(true);
  
        console.log(
          "Chamando webgazer.begin()..."
        );
  
        /*
         * ------------------------------------------------------
         * Inicialização
         * ------------------------------------------------------
         */
  
        await webgazer.begin();
  
        console.log(
          "webgazer.begin() concluído."
        );
  
        iniciadoRef.current =
          true;
  
        setAtivo(true);
  
        /*
         * Sempre que iniciamos uma nova
         * sessão, consideramos que ainda
         * não houve calibração.
         */
  
        setCalibrated(false);
  
        setCalibrating(false);
  
        setStatus(
          "WebGazer iniciado. Realize a calibração."
        );
  
      } catch (error) {
  
        console.error(
          "ERRO WEBGAZER:",
          error
        );
  
        setErro(
          error?.stack ||
          error?.message ||
          String(error)
        );
  
        setStatus(
          "Erro ao inicializar WebGazer."
        );
  
      } finally {
  
        setIniciando(false);
      }
    }
  
    /*
     * ==========================================================
     * Encerramento do WebGazer
     * ==========================================================
     */
  
    async function pararWebGazer() {
  
      try {
  
        console.log(
          "Encerrando WebGazer..."
        );
  
        /*
         * Fecha eventual tela
         * de calibração.
         */
  
        setCalibrating(false);
  
        await webgazer.end();
  
        iniciadoRef.current =
          false;
  
        setAtivo(false);
  
        setCalibrated(false);
  
        setStatus(
          "WebGazer encerrado."
        );
  
        setX("-");
  
        setY("-");
  
        setPredictions(0);
  
        console.log(
          "WebGazer encerrado."
        );
  
      } catch (error) {
  
        console.error(
          "Erro ao encerrar WebGazer:",
          error
        );
      }
    }
  
    /*
     * ==========================================================
     * Iniciar calibração
     * ==========================================================
     */
  
    function iniciarCalibracao() {
  
      if (!ativo) {
        return;
      }
  
      console.log(
        "[Calibration] Iniciando calibração."
      );
  
      setCalibrated(false);
  
      setCalibrating(true);
  
      setStatus(
        "Calibração em andamento..."
      );
    }
  
    /*
     * ==========================================================
     * Finalizar calibração
     * ==========================================================
     */
  
    function finalizarCalibracao() {
  
      console.log(
        "[Calibration] Calibração finalizada."
      );
  
      setCalibrating(false);
  
      setCalibrated(true);
  
      setStatus(
        "Calibração concluída. Rastreamento ativo."
      );
    }
  
    /*
     * ==========================================================
     * Cancelar calibração
     * ==========================================================
     */
  
    function cancelarCalibracao() {
  
      console.log(
        "[Calibration] Calibração cancelada."
      );
  
      setCalibrating(false);
  
      setCalibrated(false);
  
      setStatus(
        "Calibração cancelada. Rastreamento ativo."
      );
    }
  
    /*
     * ==========================================================
     * Cleanup
     * ==========================================================
     */
  
    useEffect(() => {
  
      return () => {
  
        if (
          iniciadoRef.current
        ) {
  
          try {
  
            webgazer.end();
  
          } catch (error) {
  
            console.error(
              "Erro ao finalizar WebGazer:",
              error
            );
          }
        }
      };
  
    }, []);
  
    /*
     * ==========================================================
     * Interface
     * ==========================================================
     */
  
    return (
      <>
  
        <main
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px",
            fontFamily:
              "Arial, sans-serif",
          }}
        >
  
          <h1>
            EyeTrackingContext
          </h1>
  
          <h2>
            Teste WebGazer +
            TensorFlow.js
          </h2>
  
          <p>
            Teste do WebGazer
            utilizando o detector
            FaceMesh com runtime
            TensorFlow.js/WebGL.
          </p>
  
          {/* ==============================================
              CONTROLES
          ============================================== */}
  
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "24px",
              marginBottom: "24px",
            }}
          >
  
            <button
              onClick={
                iniciarWebGazer
              }
              disabled={
                iniciando ||
                ativo
              }
              style={{
                padding:
                  "10px 18px",
  
                cursor:
                  iniciando ||
                  ativo
                    ? "not-allowed"
                    : "pointer",
              }}
            >
  
              {iniciando
                ? "Inicializando..."
                : "Iniciar Eye Tracking"}
  
            </button>
  
            <button
              onClick={
                pararWebGazer
              }
              disabled={
                !ativo
              }
              style={{
                padding:
                  "10px 18px",
  
                cursor:
                  ativo
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Parar Eye Tracking
            </button>
  
            <button
              onClick={
                iniciarCalibracao
              }
              disabled={
                !ativo ||
                calibrating
              }
              style={{
                padding:
                  "10px 18px",
  
                cursor:
                  ativo &&
                  !calibrating
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Calibrar
            </button>
  
          </div>
  
          {/* ==============================================
              STATUS
          ============================================== */}
  
          <div
            style={{
              padding: "20px",
              border:
                "1px solid #ccc",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
  
            <p>
              <strong>
                Status:
              </strong>{" "}
              {status}
            </p>
  
            <p>
              <strong>
                WebGazer:
              </strong>{" "}
              {ativo
                ? "Ativo"
                : "Inativo"}
            </p>
  
            <p>
              <strong>
                Predições:
              </strong>{" "}
              {predictions}
            </p>
  
            <p>
              <strong>
                Calibração:
              </strong>{" "}
  
              {calibrating
                ? "Em andamento"
                : calibrated
                  ? "Concluída"
                  : "Não realizada"}
  
            </p>
  
          </div>
  
          {/* ==============================================
              COORDENADAS
          ============================================== */}
  
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
  
            <div
              style={{
                flex: 1,
                padding: "24px",
                border:
                  "1px solid #ccc",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
  
              <div
                style={{
                  fontSize: "14px",
                  marginBottom:
                    "8px",
                }}
              >
                GAZE X
              </div>
  
              <strong
                style={{
                  fontSize: "36px",
                }}
              >
                {x}
              </strong>
  
            </div>
  
            <div
              style={{
                flex: 1,
                padding: "24px",
                border:
                  "1px solid #ccc",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
  
              <div
                style={{
                  fontSize: "14px",
                  marginBottom:
                    "8px",
                }}
              >
                GAZE Y
              </div>
  
              <strong
                style={{
                  fontSize: "36px",
                }}
              >
                {y}
              </strong>
  
            </div>
  
          </div>
  
          {/* ==============================================
              ÁREA DE TESTE
          ============================================== */}
  
          <div
            style={{
              minHeight: "300px",
              padding: "30px",
              border:
                "2px dashed #aaa",
              borderRadius: "8px",
            }}
          >
  
            <h3>
              Área para teste
              do olhar
            </h3>
  
            <p>
              Após iniciar o Eye
              Tracking e realizar a
              calibração, mova o olhar
              entre diferentes regiões
              desta página.
            </p>
  
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginTop: "80px",
              }}
            >
  
              <strong>
                ← ESQUERDA
              </strong>
  
              <strong>
                CENTRO
              </strong>
  
              <strong>
                DIREITA →
              </strong>
  
            </div>
  
            <div
              style={{
                textAlign: "center",
                marginTop: "120px",
              }}
            >
  
              <strong>
                ↓ PARTE INFERIOR ↓
              </strong>
  
            </div>
  
          </div>
  
          {/* ==============================================
              ERRO
          ============================================== */}
  
          {erro && (
  
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                border:
                  "1px solid #999",
                borderRadius: "8px",
              }}
            >
  
              <h3>
                Erro
              </h3>
  
              <pre
                style={{
                  whiteSpace:
                    "pre-wrap",
  
                  wordBreak:
                    "break-word",
                }}
              >
                {erro}
              </pre>
  
            </div>
  
          )}
  
        </main>
  
        {/* ==============================================
            CALIBRAÇÃO
        ============================================== */}
  
        {calibrating && (
  
          <Calibration
            webgazer={webgazer}
  
            onComplete={
              finalizarCalibracao
            }
  
            onCancel={
              cancelarCalibracao
            }
          />
  
        )}
  
      </>
    );
  }
  
  export default AppTeste;