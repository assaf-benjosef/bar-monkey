import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  // If the APP_PASSWORD variable isn't set, allow everyone (good for local dev unless you want to test it)
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Split on the colon. Username doesn't matter (can be anything), password matters.
    const [user, pwd] = atob(authValue).split(':');

    if (pwd === process.env.APP_PASSWORD) {
      return NextResponse.next();
    }
  }

  // Trigger the native browser Basic Auth password prompt
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Bar Monkey Secure Area"',
    },
  });
}

// Apply this middleware to every route except static assets and images
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
