import {
  EyeTrackingState,
  useEyeTracking,
} from "./EyeTrackingProvider";

import "./eyeTracking.css";

function EyeTrackingControl() {
  const {
    state,
    toggle,
  } = useEyeTracking();

  /*
   * Durante a calibração o controle
   * principal não é exibido.
   *
   * O usuário utiliza o botão Cancelar
   * disponível no próprio overlay.
   */

  if (
    state ===
    EyeTrackingState.CALIBRATING
  ) {
    return null;
  }

  /*
   * ==========================================================
   * ESTADO VISUAL
   * ==========================================================
   */

  let statusClass =
    "status-off";

  let label =
    "Ativar rastreamento ocular";

  let eyeOpen = false;

  /*
   * ----------------------------------------------------------
   * INICIALIZANDO
   * ----------------------------------------------------------
   */

  if (
    state ===
    EyeTrackingState.INITIALIZING
  ) {
    statusClass =
      "status-initializing";

    label =
      "Inicializando rastreamento ocular";

    eyeOpen = true;
  }

  /*
   * ----------------------------------------------------------
   * MONITORANDO
   * ----------------------------------------------------------
   */

  if (
    state ===
    EyeTrackingState.TRACKING
  ) {
    statusClass =
      "status-tracking";

    label =
      "Desativar rastreamento ocular";

    eyeOpen = true;
  }

  /*
   * ----------------------------------------------------------
   * PERDA DO RASTREAMENTO
   * ----------------------------------------------------------
   */

  if (
    state ===
    EyeTrackingState.LOST
  ) {
    statusClass =
      "status-lost";

    label =
      "Rastreamento ocular temporariamente indisponível";

    eyeOpen = true;
  }

  /*
   * ----------------------------------------------------------
   * ERRO
   * ----------------------------------------------------------
   */

  if (
    state ===
    EyeTrackingState.ERROR
  ) {
    statusClass =
      "status-error";

    label =
      "Erro no rastreamento ocular";

    eyeOpen = false;
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <button
      type="button"

      className={`
        eye-tracking-control
        ${statusClass}
      `}

      onClick={toggle}

      disabled={
        state ===
        EyeTrackingState.INITIALIZING
      }

      aria-label={label}

      title={label}
    >
      {/*
       * ======================================================
       * ÍCONE DO OLHO
       * ======================================================
       */}

      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/*
         * Forma principal do olho
         */}

        <path
          d="
            M2 12
            C4.8 7.5 8.1 5.5 12 5.5
            C15.9 5.5 19.2 7.5 22 12
            C19.2 16.5 15.9 18.5 12 18.5
            C8.1 18.5 4.8 16.5 2 12
            Z
          "
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/*
         * Pupila
         */}

        {eyeOpen && (
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        )}

        {/*
         * Quando desligado ou em erro,
         * mostramos o risco sobre o olho.
         */}

        {!eyeOpen && (
          <path
            d="M4 4L20 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}

export default EyeTrackingControl;