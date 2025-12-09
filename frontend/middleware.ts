// import { type NextRequest } from "next/server";
// import { updateSession } from "@/utils/supabase/middleware";

// export async function middleware(request: NextRequest) {
//   return await updateSession(request);
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
//      * Feel free to modify this pattern to include more paths.
//      */
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };

// middleware.ts
// Next.js middleware for authentication and subscription checks

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/transcripts",
  "/settings",
  "/my-content",
];
const SUBSCRIPTION_REQUIRED_ROUTES = [
  "/dashboard",
  "/transcripts",
  "/my-content",
];

// Routes that should redirect logged-in users
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response to pass through
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path requires subscription
  const requiresSubscription = SUBSCRIPTION_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check subscription for routes that require it
  if (requiresSubscription && user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    const hasActiveSubscription = subscription?.status === "active";
    const hasPastDueSubscription = subscription?.status === "past_due";

    // No subscription at all - redirect to pricing
    if (!subscription) {
      return NextResponse.redirect(new URL("/pricing", request.url));
    }

    // Past due - redirect to billing to fix payment
    // Allow access but they'll see the payment failed banner
    if (hasPastDueSubscription) {
      // Let them through but the page will show the payment failed banner
      // Alternatively, uncomment below to force them to billing:
      // return NextResponse.redirect(new URL('/settings/billing', request.url));
    }

    // Canceled or other inactive status - redirect to pricing
    if (!hasActiveSubscription && !hasPastDueSubscription) {
      return NextResponse.redirect(new URL("/pricing", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
