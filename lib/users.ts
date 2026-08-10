/**
 * Cadastro de usuarios com acesso ao Terminal (equipe + clientes).
 *
 * Cada usuario tem email + hash bcrypt de senha PROPRIA (nao mais senha
 * compartilhada). Visao do Terminal e igual para todos os usuarios ativos
 * (nao ha isolamento de dados por cliente).
 *
 * Os hashes abaixo (`passwordHash`) sao o fallback commitado no repo — ainda
 * todos identicos (herdados da senha compartilhada antiga), ate as senhas
 * individuais serem definidas. Em producao, sobrescrever via env var
 * TERMINAL_USER_HASHES na Vercel: JSON `{ "email": "hashBcrypt" }`, fora do
 * Git. O que estiver no env tem prioridade; o que faltar cai no hash do
 * codigo abaixo.
 *
 * Para gerar um hash novo:
 *   node scripts/generate-user-hash.js "senha-do-cliente"
 * Copiar o hash para o env TERMINAL_USER_HASHES (producao) ou, se preferir
 * manter em codigo, para a lista abaixo, e commitar.
 */

export interface TerminalUser {
  email: string;
  passwordHash: string;
  label: string; // nome/identificacao interna, so para logs
  active: boolean;
}

export const USERS: readonly TerminalUser[] = [
  {
    email: "dj@harpian.com",
    passwordHash: "$2b$12$4jAE5dqNwWtA.zvg/5Gin.gO90QNrEFlHZn4xCATh4Wy/6lFHmVWO",
    label: "DJ (equipe)",
    active: true,
  },
  {
    email: "ds@harpian.com",
    passwordHash: "$2b$12$sSwRXF5/5EL5qhOKGVwE9eT8JHSZO24KF6QqJjlPDaCNH1tDuHhJ6",
    label: "DS (equipe)",
    active: true,
  },
  {
    email: "jfd@harpian.com",
    passwordHash: "$2b$12$sSwRXF5/5EL5qhOKGVwE9eT8JHSZO24KF6QqJjlPDaCNH1tDuHhJ6",
    label: "JFD (equipe)",
    active: true,
  },
  {
    email: "jz@harpian.com",
    passwordHash: "$2b$12$sSwRXF5/5EL5qhOKGVwE9eT8JHSZO24KF6QqJjlPDaCNH1tDuHhJ6",
    label: "JZ (equipe)",
    active: true,
  },
  {
    email: "jp@harpian.com",
    passwordHash: "$2b$12$4jAE5dqNwWtA.zvg/5Gin.gO90QNrEFlHZn4xCATh4Wy/6lFHmVWO",
    label: "JP (equipe)",
    active: true,
  },
] as const;

function envHashOverrides(): Record<string, string> {
  const raw = process.env.TERMINAL_USER_HASHES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [email, hash] of Object.entries(parsed)) {
      if (typeof hash === "string") out[email.trim().toLowerCase()] = hash;
    }
    return out;
  } catch {
    return {};
  }
}

export function findUser(email: string): TerminalUser | undefined {
  const normalized = email.trim().toLowerCase();
  const user = USERS.find(
    (u) => u.active && u.email.toLowerCase() === normalized
  );
  if (!user) return undefined;
  const override = envHashOverrides()[normalized];
  return override ? { ...user, passwordHash: override } : user;
}
