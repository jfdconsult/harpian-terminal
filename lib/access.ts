/**
 * Terminal Access Gate — controle de acesso ao HARPIAN ETP Terminal.
 *
 * Cada usuario (equipe ou cliente) tem email + senha PROPRIA (hash bcrypt
 * individual, ver lib/users.ts). Visao do Terminal e igual para todos os
 * usuarios ativos — nao ha isolamento de dados por cliente, so controle de
 * quem entra.
 *
 * - Usuarios autorizados: lib/users.ts (email + hash individual)
 * - Sessao: JWT httpOnly cookie, 7 dias
 * - Log: cada acesso registra email + user-agent + timestamp (server logs)
 */

export const ACCESS_COOKIE = "harpian_terminal_access";
export const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export interface AccessTokenPayload {
  sub: string; // email
  email: string;
  iat?: number;
  exp?: number;
}
