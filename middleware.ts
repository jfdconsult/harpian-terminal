import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE } from "@/lib/access";

// ============================================================
// GATE 1 · acesso ao Terminal inteiro — email + senha (JWT cookie)
// ============================================================
// Mesmo mecanismo do gate da apresentacao institucional. Cobre paginas E
// APIs (senao um nao-autenticado pode ler /api/strategy-catalog direto sem
// nunca passar pelo login). So ficam de fora: a propria tela de login, as
// rotas de login/logout, e assets estaticos (matcher abaixo).
const ACCESS_PUBLIC_PATHS = new Set<string>(["/login"]);

function isAccessPublicPath(pathname: string): boolean {
  if (ACCESS_PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/access/")) return true;
  return false;
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL("/login", req.url);
  const originalPath = req.nextUrl.pathname + req.nextUrl.search;
  if (originalPath && originalPath !== "/login") {
    loginUrl.searchParams.set("next", originalPath);
  }
  return NextResponse.redirect(loginUrl);
}

// ============================================================
// GATE 2 · redireciona mobile UA para o app PWA (so paginas, nao API)
// ============================================================
// Bypass: query ?desktop=1 seta cookie force_desktop=1 (30 dias) que
// pula o redirect nas requisicoes seguintes — permite abrir a versao
// desktop no celular quando o usuario quiser.

const MOBILE_URL = "https://harpian-mobile-next.vercel.app";
const MOBILE_UA_RE = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile Safari|webOS|BlackBerry/i;
const BYPASS_COOKIE = "force_desktop";

function mobileRedirectCheck(req: NextRequest): NextResponse | null {
  const url = req.nextUrl;

  if (url.searchParams.get("desktop") === "1") {
    const res = NextResponse.next();
    res.cookies.set(BYPASS_COOKIE, "1", { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax" });
    return res;
  }
  if (req.cookies.get(BYPASS_COOKIE)?.value === "1") return null;

  const ua = req.headers.get("user-agent") || "";
  if (!MOBILE_UA_RE.test(ua)) return null;

  const target = new URL(url.pathname + url.search, MOBILE_URL);
  return NextResponse.redirect(target, 302);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isAccessPublicPath(pathname)) {
    const ok = await isAuthenticated(req);
    if (!ok) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
      return redirectToLogin(req);
    }
  }

  // Mobile-redirect so se aplica a navegacao de pagina, nunca a API.
  if (!pathname.startsWith("/api/")) {
    const mobile = mobileRedirectCheck(req);
    if (mobile) return mobile;
  }

  return NextResponse.next();
}

export const config = {
  // Roda em tudo, inclusive /api — so exclui assets estaticos e metadados.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|icon|apple-icon|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)",
  ],
};
