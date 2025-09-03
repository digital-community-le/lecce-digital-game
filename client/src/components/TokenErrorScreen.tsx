import React from "react";

interface TokenErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

const TokenErrorScreen: React.FC<TokenErrorScreenProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, var(--ldc-primary) 0%, var(--ldc-primary-dark) 100%)",
        imageRendering: "pixelated",
      }}
    >
      <div className="max-w-lg w-full">
        <div
          className="nes-container is-centered is-rounded with-title mb-6"
          style={{ background: "var(--ldc-background)" }}
        >

          {/* Icona di warning */}
          <div className="text-center mt-4">
            <i
              className="nes-icon close is-medium"
              style={{
                color: "var(--ldc-error)",
                transform: "scale(1.5)",
              }}
            ></i>
          </div>

          <h2
            className="mb-6"
            style={{ color: "var(--ldc-error)" }}
          >
            ACCESSO NEGATO
          </h2>

          {/* Messaggio principale */}
          <p
            className="font-retro mb-4"
            style={{ fontSize: "10px", lineHeight: "1.6", textAlign: "center" }}
          >
            Il token di accesso ricevuto non è valido o è scaduto.
          </p>

          {/* Dettagli errore */}

          <div className="nes-container is-error is-rounded">
            <p
              className="font-retro"
              style={{ fontSize: "8px", lineHeight: "1.4" }}
            >
              <span style={{ color: "var(--ldc-on-background)" }}>ERRORE:</span>
              <br />
              <span style={{ fontSize: "7px", wordBreak: "break-all" }}>
                {error}
              </span>
            </p>
          </div>
          <div className="mb-6"></div>

          {/* Azioni */}
          <div className="text-center mb-4">
            {onRetry && (
              <button
                onClick={onRetry}
                className="nes-btn is-error font-retro"
                style={{ fontSize: "10px" }}
              >
                RIPROVA
              </button>
            )}
          </div>

          {/* Note supporto */}
          <p
            className="font-retro text-center"
            style={{
              fontSize: "8px",
              color: "var(--ldc-on-background)",
              opacity: "0.7",
              lineHeight: "1.4",
            }}
          >
            Se il problema persiste,
            <br />
            contatta il supporto tecnico.
          </p>
        </div>

        {/* Footer branding */}
        <div className="text-center">
          <p
            className="font-retro"
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.8)",
              textShadow: "1px 1px 0px rgba(0,0,0,0.8)",
            }}
          >
            Quest Digitale di Lecce
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenErrorScreen;
