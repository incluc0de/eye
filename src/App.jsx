import { useEffect, useRef, useState } from "react";
import webgazer from "webgazer";
import "./App.css";

function App() {
  const [status, setStatus] = useState("Aguardando início...");
  const [x, setX] = useState("-");
  const [y, setY] = useState("-");
  const [predictions, setPredictions] = useState(0);
  const [erro, setErro] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [ativo, setAtivo] = useState(false);

  const iniciadoRef = useRef(false);

  async function iniciarWebGazer() {
    if (iniciadoRef.current || iniciando) {
      return;
    }

    try {
      setIniciando(true);
      setErro(null);
      setStatus("Inicializando WebGazer...");

      console.log("WebGazer:", webgazer);
      console.log(
        "begin:",
        typeof webgazer.begin
      );
      console.log(
        "setGazeListener:",
        typeof webgazer.setGazeListener
      );

      // --------------------------------------------------
      // Listener das coordenadas do olhar
      // --------------------------------------------------

      webgazer.setGazeListener(
        (data, elapsedTime) => {
          if (!data) {
            return;
          }

          const gazeX = Math.round(data.x);
          const gazeY = Math.round(data.y);

          setX(gazeX);
          setY(gazeY);

          setPredictions(
            (valorAtual) => valorAtual + 1
          );

          setStatus("Rastreamento ativo");

          console.log("GAZE", {
            x: gazeX,
            y: gazeY,
            elapsedTime,
          });
        }
      );

      // --------------------------------------------------
      // Configurações visuais do WebGazer
      // --------------------------------------------------

      webgazer
        .showVideoPreview(true)
        .showPredictionPoints(true)
        .showFaceOverlay(true)
        .showFaceFeedbackBox(true);

      console.log(
        "Chamando webgazer.begin()..."
      );

      // --------------------------------------------------
      // Inicialização
      // --------------------------------------------------

      await webgazer.begin();

      console.log(
        "webgazer.begin() concluído."
      );

      iniciadoRef.current = true;

      setAtivo(true);

      setStatus(
        "WebGazer iniciado. Olhe para diferentes pontos da tela."
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

  async function pararWebGazer() {
    try {
      console.log(
        "Encerrando WebGazer..."
      );

      await webgazer.end();

      iniciadoRef.current = false;

      setAtivo(false);
      setStatus("WebGazer encerrado.");

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

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (iniciadoRef.current) {
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

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>EyeTrackingContext</h1>

      <h2>Teste WebGazer + TensorFlow.js</h2>

      <p>
        Teste do WebGazer utilizando o detector
        FaceMesh com runtime TensorFlow.js/WebGL.
      </p>

      {/* ----------------------------------------------
          CONTROLES
      ---------------------------------------------- */}

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
          onClick={iniciarWebGazer}
          disabled={iniciando || ativo}
          style={{
            padding: "10px 18px",
            cursor:
              iniciando || ativo
                ? "not-allowed"
                : "pointer",
          }}
        >
          {iniciando
            ? "Inicializando..."
            : "Iniciar Eye Tracking"}
        </button>

        <button
          onClick={pararWebGazer}
          disabled={!ativo}
          style={{
            padding: "10px 18px",
            cursor: ativo
              ? "pointer"
              : "not-allowed",
          }}
        >
          Parar Eye Tracking
        </button>
      </div>

      {/* ----------------------------------------------
          STATUS
      ---------------------------------------------- */}

      <div
        style={{
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <p>
          <strong>Status:</strong>{" "}
          {status}
        </p>

        <p>
          <strong>WebGazer:</strong>{" "}
          {ativo ? "Ativo" : "Inativo"}
        </p>

        <p>
          <strong>Predições:</strong>{" "}
          {predictions}
        </p>
      </div>

      {/* ----------------------------------------------
          COORDENADAS
      ---------------------------------------------- */}

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
            border: "1px solid #ccc",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              marginBottom: "8px",
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
            border: "1px solid #ccc",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              marginBottom: "8px",
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

      {/* ----------------------------------------------
          ÁREA DE TESTE
      ---------------------------------------------- */}

      <div
        style={{
          minHeight: "300px",
          padding: "30px",
          border: "2px dashed #aaa",
          borderRadius: "8px",
        }}
      >
        <h3>Área para teste do olhar</h3>

        <p>
          Após iniciar o Eye Tracking, mova o
          olhar entre diferentes regiões desta
          página.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "80px",
          }}
        >
          <strong>← ESQUERDA</strong>

          <strong>CENTRO</strong>

          <strong>DIREITA →</strong>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "120px",
          }}
        >
          <strong>↓ PARTE INFERIOR ↓</strong>
        </div>
      </div>

      {/* ----------------------------------------------
          ERRO
      ---------------------------------------------- */}

      {erro && (
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #999",
            borderRadius: "8px",
          }}
        >
          <h3>Erro</h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {erro}
          </pre>
        </div>
      )}
    </main>
  );
}

export default App;