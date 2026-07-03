// Rutas autenticadas con searchParams / sesión: no prerenderizar en build.
export const dynamic = 'force-dynamic';

export default function FormularioRGRLLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
