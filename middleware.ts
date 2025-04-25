import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Si l'utilisateur est déjà connecté
    if (req.nextauth?.token) {
      // Si la page est login ou register, on le redirige
      if (pathname === '/login' || pathname === '/register') {
        return NextResponse.redirect(new URL('/', req.url)); // Redirige vers la home ou dashboard
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Active la récupération du token pour toutes les routes
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ['/login', '/register'], // Limite le middleware aux pages concernées
};