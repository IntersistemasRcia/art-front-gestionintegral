// src/app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // No usar hooks de contexto aquí, ya que durante el build los providers no están disponibles
  // Solo loguear en el cliente
  if (typeof window !== 'undefined') {
    console.error('Global error:', error);
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - ART Gestión Integral</title>
      </head>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Algo salió mal
          </h1>
          <p style={{ marginBottom: '24px', color: '#666' }}>
            {error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}

