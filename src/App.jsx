import { useRef, useState } from "react";
import { testarTfjs } from "./testTfjs";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("Aguardando teste...");
  const [facesDetectadas, setFacesDetectadas] = useState(0);
  const [backend, setBackend] = useState("-");
  const [erro, setErro] = useState(null);
  const [testando, setTestando] = useState(false);

  async function testarDetector() {
    try {
      setTestando(true);
      setErro(null);
      setFacesDetectadas(0);

      // --------------------------------------------------
      // 1. Solicitar acesso à webcam
      // --------------------------------------------------

      setStatus("Solicitando acesso à câmera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      // --------------------------------------------------
      // 2. Associar webcam ao elemento <video>
      // --------------------------------------------------

      const video = videoRef.current;

      if (!video) {
        throw new Error("Elemento de vídeo não encontrado.");
      }

      video.srcObject = stream;

      await video.play();

      setStatus("Câmera ativa. Inicializando TensorFlow.js...");

      // --------------------------------------------------
      // 3. Executar teste TensorFlow.js
      // --------------------------------------------------

      const faces = await testarTfjs(video);

      // --------------------------------------------------
      // 4. Resultado
      // --------------------------------------------------

      const quantidade = faces?.length ?? 0;

      setFacesDetectadas(quantidade);
      setBackend("WebGL");

      if (quantidade > 0) {
        setStatus(
          `TensorFlow.js funcionando! ${quantidade} face(s) detectada(s).`
        );

        console.log("TESTE TFJS CONCLUÍDO COM SUCESSO");
        console.log("Faces:", faces);

        if (faces[0]?.keypoints) {
          console.log(
            "Quantidade de keypoints:",
            faces[0].keypoints.length
          );

          console.log(
            "Primeiros keypoints:",
            faces[0].keypoints.slice(0, 10)
          );
        }
      } else {
        setStatus(
          "TensorFlow.js executou corretamente, mas nenhuma face foi detectada."
        );

        console.log("Nenhuma face detectada.");
      }
    } catch (error) {
      console.error("ERRO TESTE TFJS:", error);

      setErro(error?.stack || error?.message || String(error));

      setStatus("Erro durante o teste TensorFlow.js.");
    } finally {
      setTestando(false);
    }
  }

  // --------------------------------------------------
  // Encerrar câmera
  // --------------------------------------------------

  function pararCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("Câmera encerrada.");
    setFacesDetectadas(0);
  }

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

      <h2>Teste TensorFlow.js / Face Landmarks</h2>

      <p>
        Este teste verifica se o detector facial funciona utilizando
        TensorFlow.js com backend WebGL, sem utilizar o runtime MediaPipe/WASM.
      </p>

      {/* Webcam */}

      <div
        style={{
          marginTop: "24px",
          marginBottom: "24px",
        }}
      >
        <video
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            maxWidth: "640px",
            background: "#111",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Botões */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={testarDetector}
          disabled={testando}
          style={{
            padding: "10px 18px",
            cursor: testando ? "not-allowed" : "pointer",
          }}
        >
          {testando
            ? "Testando..."
            : "Testar FaceMesh TFJS"}
        </button>

        <button
          onClick={pararCamera}
          style={{
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          Parar câmera
        </button>
      </div>

      {/* Informações */}

      <div
        style={{
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <p>
          <strong>Status:</strong> {status}
        </p>

        <p>
          <strong>Backend:</strong> {backend}
        </p>

        <p>
          <strong>Faces detectadas:</strong>{" "}
          {facesDetectadas}
        </p>
      </div>

      {/* Erro */}

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