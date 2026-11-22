import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session fresh on every request and sends signed-out
 * visitors to /login. Pages, actions and route handlers check again
 * (lib/auth.ts), so this is a convenience, not the only lock.
 */

/** Reachable without signing in */
const OPEN = [/^\/privacy$/, /^\/api\/whatsapp\/webhook$/, /^\/api\/cron\//, /^\/api\/health$/];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (OPEN.some((r) => r.test(path))) return NextResponse.next();

  const config = supabaseConfig();
  if (!config) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next(); // local practice
    return new NextResponse("Sign-in isn't set up: add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.", { status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  // Redirects must carry any refreshed or cleared auth cookies along
  const redirectTo = (url: URL) => {
    const r = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) r.cookies.set(cookie);
    return r;
  };

  if (path === "/login") return signedIn ? redirectTo(new URL("/", request.url)) : response;
  if (signedIn) return response;

  if (path.startsWith("/api/")) return Response.json({ error: "Sign in first." }, { status: 401 });
  const login = new URL("/login", request.url);
  if (path !== "/") login.searchParams.set("next", path + request.nextUrl.search);
  return redirectTo(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
