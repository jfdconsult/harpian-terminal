/**
 * Cadastro de usuarios com acesso ao Terminal (equipe + clientes).
 *
 * Cada usuario tem email + hash bcrypt de senha PROPRIA (nao mais senha
 * compartilhada). Visao do Terminal e igual para todos os usuarios ativos
 * (nao ha isolamento de dados por cliente).
 *
 * Para adicionar um cliente:
 *   node scripts/generate-user-hash.js "senha-do-cliente"
 * Copiar o hash gerado para a lista abaixo, ao lado do email do cliente,
 * e commitar.
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
    passwordHash: "$2b$12$4jAE5dqNwWtA.zvg/5Gin.gO90QNrEFlHZn4xCATh4Wy/6lFHmVWO",
    label: "DS (equipe)",
    active: true,
  },
  {
    email: "jfd@harpian.com",
    passwordHash: "$2b$12$4jAE5dqNwWtA.zvg/5Gin.gO90QNrEFlHZn4xCATh4Wy/6lFHmVWO",
    label: "JFD (equipe)",
    active: true,
  },
  {
    email: "jz@harpian.com",
    passwordHash: "$2b$12$4jAE5dqNwWtA.zvg/5Gin.gO90QNrEFlHZn4xCATh4Wy/6lFHmVWO",
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

export function findUser(email: string): TerminalUser | undefined {
  const normalized = email.trim().toLowerCase();
  return USERS.find(
    (user) => user.active && user.email.toLowerCase() === normalized
  );
}
