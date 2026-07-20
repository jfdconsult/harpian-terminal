import { NextRequest, NextResponse } from "next/server";

// Detecta user-agent mobile e redireciona para o app mobile PWA.
// Bypass: query ?desktop=1 seta cookie force_desktop=1 (30 dias) que
// pula o redirect nas requisicoes seguintes — permite abrir a versao
// desktop no celular quando o usuario quiser.

const MOBILE_URL = "https://harpian-mobile-next.vercel.app";
const MOBILE_UA_RE = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile Safari|webOS|BlackBerry/i;
const BYPASS_COOKIE = "force_desktop";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Bypass explicito via ?desktop=1 — seta cookie e continua no desktop
  if (url.searchParams.get("desktop") === "1") {
    const res = NextResponse.next();
    res.cookies.set(BYPASS_COOKIE, "1", {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
      sameSite: "lax",
    });
    return res;
  }

  // Cookie ja setado — nunca redireciona
  if (req.cookies.get(BYPASS_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  const ua = req.headers.get("user-agent") || "";
  if (!MOBILE_UA_RE.test(ua)) return NextResponse.next();

  // Preserva pathname + querystring no destino mobile
  const target = new URL(url.pathname + url.search, MOBILE_URL);
  return NextResponse.redirect(target, 302);
}

export const config = {
  // Nao roda em assets, api, arquivos de metadados
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|icon|apple-icon|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)",
  ],
};
