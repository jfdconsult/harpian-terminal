import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE, type AccessTokenPayload } from "@/lib/access";

/**
 * Le o email do usuario logado a partir do cookie de sessao (server-side
 * only — API routes / server components). Diferente do `/favorites`
 * existente (que confia no email que o CLIENTE manda no corpo/query), isto
 * decodifica o JWT no servidor: um usuario logado nao pode ler/editar
 * portfolios de outro so mudando o email na requisicao.
 *
 * Retorna null se nao houver sessao valida — o middleware ja bloqueia isso
 * antes de chegar aqui em condicoes normais, mas as rotas nao devem confiar
 * cegamente nisso (defesa em profundidade).
 */
export async function getSessionEmail(): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    const p = payload as unknown as AccessTokenPayload;
    return (p.email || p.sub || "").trim().toLowerCase() || null;
  } catch {
    return null;
  }
}
