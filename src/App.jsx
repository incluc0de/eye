import {
  EyeTrackingProvider,
} from "./eyetracking/EyeTrackingProvider";

import EyeTrackingControl
  from "./eyetracking/EyeTrackingControl";

import "./App.css";

function App() {
  return (
    <EyeTrackingProvider>

      <main className="app-content">

        <h1>
          Aplicação monitorada
        </h1>

        <p>
          Esta área representa o
          conteúdo normal da aplicação.
        </p>

        <p>
          O Eye Tracking pode ser
          ativado ou desativado pelo
          usuário a qualquer momento.
        </p>

      </main>

      <EyeTrackingControl />

    </EyeTrackingProvider>
  );
}

export default App;