// src/app/inicio/layout.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ClientLayoutWrapper from './ClientLayoutWrapper';
import { authOptions } from '../api/auth/[...nextauth]/auth';

// getServerSession usa cookies/headers: no puede prerenderizarse en build.
export const dynamic = 'force-dynamic';

export default async function InicioLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const session = await getServerSession(authOptions);
 if (!session) {
  redirect('/login');
 }

 return <ClientLayoutWrapper>{children}</ClientLayoutWrapper>;
}
