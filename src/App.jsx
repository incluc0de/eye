import { useEffect, useRef, useState } from 'react';
import webgazer from 'webgazer';
import './App.css';

function App() {
  const [status, setStatus] = useState('Aguardando inicialização');
  const [x, setX] = useState('-');
  const [y, setY] = useState('-');
  const [predictions, setPredictions] = useState(0);

  // Evita inicialização duplicada durante desenvolvimento
  const started = useRef(false);

  useEffect(() => {
    return () => {
      // Por enquanto não fazemos nada no cleanup.
      // O controle será feito explicitamente.
    };
  }, []);

  async function iniciarWebGazer() {
    if (started.current) {
      console.log('WebGazer já foi iniciado.');
      return;
    }

    try {
      setStatus('Inicializando...');

      console.log('WebGazer:', webgazer);
      console.log('begin:', typeof webgazer.begin);
      console.log('setGazeListener:', typeof webgazer.setGazeListener);

      webgazer.setGazeListener((data, elapsedTime) => {
        if (!data) {
          return;
        }

        const gazeX = Math.round(data.x);
        const gazeY = Math.round(data.y);

        setX(gazeX);
        setY(gazeY);

        setPredictions((value) => value + 1);

        setStatus('Rastreamento ativo');

        console.log('GAZE', {
          x: gazeX,
          y: gazeY,
          elapsedTime,
        });
      });

      console.log('Chamando webgazer.begin()...');

      await webgazer.begin();

      started.current = true;

      console.log('WebGazer iniciado.');

      setStatus('WebGazer iniciado');
    } catch (error) {
      console.error('ERRO WEBGAZER:', error);

      setStatus(`Erro: ${error?.message || String(error)}`);
    }
  }

  return (
    <main className="container">
      <h1>IncluC0de</h1>

      <h2>Teste WebGazer + React/Vite</h2>

      <button className="start-button" onClick={iniciarWebGazer}>
        Iniciar Eye Tracking
      </button>

      <section className="panel">
        <h3>Eye Tracking</h3>

        <p>
          <strong>Status:</strong> <span>{status}</span>
        </p>

        <div className="coordinates">
          <div>
            <span>X</span>
            <strong>{x}</strong>
          </div>

          <div>
            <span>Y</span>
            <strong>{y}</strong>
          </div>

          <div>
            <span>Previsões</span>
            <strong>{predictions}</strong>
          </div>
        </div>
      </section>

      <section className="content">
        <h2>Área de teste</h2>

        <p>
          Depois de permitir o acesso à câmera, olhe para diferentes regiões da
          tela.
        </p>

        <p>
          Neste primeiro teste queremos apenas verificar se o WebGazer consegue
          gerar coordenadas X e Y.
        </p>

        <div className="test-area">
          <div>SUPERIOR ESQUERDO</div>
          <div>SUPERIOR DIREITO</div>

          <div>INFERIOR ESQUERDO</div>
          <div>INFERIOR DIREITO</div>
        </div>
      </section>
    </main>
  );
}

export default App;
