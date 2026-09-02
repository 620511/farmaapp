const prisma = require('../prisma');

// Configurações globais da plataforma (linha única na tabela Settings).
// Hoje guarda só o percentual da taxa cobrada de cada farmácia por venda.
async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'singleton', platformFeePercent: 5 } });
  }
  return settings;
}

module.exports = { getSettings };
