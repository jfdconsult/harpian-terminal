#!/usr/bin/env node
/**
 * Gera hash bcrypt para adicionar um novo usuario (cliente/equipe) em
 * lib/users.ts.
 *
 * Uso: node scripts/generate-user-hash.js "senha-do-cliente"
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/generate-user-hash.js "senha"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(hash);
