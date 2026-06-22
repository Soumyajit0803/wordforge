import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import guestNames from "@/guestNames.json"

// Helper to generate names on the edge
const generateGuestName = () => {
  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return random(guestNames[1]) + random(guestNames[0]);
};

export function proxy(request: NextRequest) {
  // 1. Pass the request through to generate the base response
  const response = NextResponse.next();

  // 2. Check for NextAuth session cookies (handles both dev and production secure cookies)
  const hasSession = 
    request.cookies.has('next-auth.session-token') || 
    request.cookies.has('__Secure-next-auth.session-token');

  // 3. Check for your custom guest cookie
  const hasGuestProfile = request.cookies.has('guest_profile');

  // 4. If they have neither, they are a brand new visitor. Assign guest profile instantly.
  if (!hasSession && !hasGuestProfile) {
    const guestName = generateGuestName();
    const newGuest = {
      id: guestName + "-" + crypto.randomUUID(),
      name: guestName,
      isGuest: true,
    };

    // 5. Attach the new cookie to the outgoing response
    response.cookies.set('guest_profile', JSON.stringify(newGuest), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      // Set to false so your client-side usePlayer hook can still read it via js-cookie if needed
      httpOnly: false, 
    });
  }

  return response;
}

// 6. Configure the matcher so this runs on all pages except static files and APIs
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};