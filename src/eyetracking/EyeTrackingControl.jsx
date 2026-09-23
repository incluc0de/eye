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

  const isOff =
    state ===
    EyeTrackingState.OFF;

  const isInitializing =
    state ===
    EyeTrackingState.INITIALIZING;

  const isCalibrating =
    state ===
    EyeTrackingState.CALIBRATING;

  const isTracking =
    state ===
    EyeTrackingState.TRACKING;

  const isError =
    state ===
    EyeTrackingState.ERROR;

  /*
   * Durante a calibração o controle
   * principal não aparece.
   *
   * O overlay possui o botão Cancelar.
   */

  if (isCalibrating) {
    return null;
  }

  let indicatorClass =
    "eye-status-off";

  let label =
    "Eye Tracking desativado";

  if (isInitializing) {
    indicatorClass =
      "eye-status-initializing";

    label =
      "Inicializando Eye Tracking";
  }

  if (isTracking) {
    indicatorClass =
      "eye-status-active";

    label =
      "Eye Tracking ativo";
  }

  if (isError) {
    indicatorClass =
      "eye-status-error";

    label =
      "Eye Tracking indisponível";
  }

  async function handleClick() {
    if (isInitializing) {
      return;
    }

    await toggle();
  }

  return (
    <button
      type="button"
      className="eye-tracking-control"
      onClick={handleClick}
      disabled={isInitializing}

      title={
        isOff
          ? "Ativar Eye Tracking"
          : isError
            ? "Tentar novamente"
            : "Desativar Eye Tracking"
      }

      aria-label={label}
    >

      <span
        className={
          isOff
            ? "eye-icon eye-icon-off"
            : "eye-icon"
        }
        aria-hidden="true"
      >

        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >

          <path
            d="
              M2 12
              S5.5 6
              12 6
              22 12
              22 12
              18.5 18
              12 18
              2 12
              2 12
            "
          />

          {!isOff && (
            <circle
              cx="12"
              cy="12"
              r="3"
            />
          )}

          {isOff && (
            <path
              d="M4 4 L20 20"
            />
          )}

        </svg>

      </span>

      <span
        className={
          `eye-status-dot ${indicatorClass}`
        }
        aria-hidden="true"
      />

    </button>
  );
}

export default EyeTrackingControl;