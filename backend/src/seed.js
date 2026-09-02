require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function main() {
  console.log('Seeding Farma.APP...');

  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@farma.app' },
    update: {},
    create: { name: 'Administrador Farma.APP', email: 'admin@farma.app', passwordHash: adminPass, role: 'ADMIN' }
  });

  const pharmPass = await bcrypt.hash('farmacia123', 10);
  const pharmOwner = await prisma.user.upsert({
    where: { email: 'farmacia@farma.app' },
    update: {},
    create: { name: 'Farmácia Central', email: 'farmacia@farma.app', passwordHash: pharmPass, role: 'PHARMACY' }
  });

  let pharmacy = await prisma.pharmacy.findUnique({ where: { ownerId: pharmOwner.id } });
  if (!pharmacy) {
    pharmacy = await prisma.pharmacy.create({
      data: { name: 'Farmácia Central', description: 'Sua farmácia, mais perto de você!', city: 'Fortaleza', latitude: -3.7319, longitude: -38.5267, ownerId: pharmOwner.id }
    });
  }

  const custPass = await bcrypt.hash('cliente123', 10);
  await prisma.user.upsert({
    where: { email: 'cliente@farma.app' },
    update: {},
    create: { name: 'Cliente Teste', email: 'cliente@farma.app', passwordHash: custPass, role: 'CUSTOMER' }
  });

  const categoryData = [
    { name: 'Medicamentos', icon: 'pill' },
    { name: 'Higiene', icon: 'bottle' },
    { name: 'Beleza', icon: 'vial' },
    { name: 'Vitaminas', icon: 'vitamin' },
    { name: 'Cuidados', icon: 'heart' }
  ];
  const categories = {};
  for (const c of categoryData) {
    categories[c.name] = await prisma.category.upsert({ where: { name: c.name }, update: {}, create: c });
  }

  const products = [
    { name: 'Dipirona 1g', description: '10 comprimidos', price: 7.9, originalPrice: 9.9, category: 'Medicamentos' },
    { name: 'Vitamina C 1g', description: '10 comprimidos efervescentes', price: 16.9, originalPrice: 19.9, category: 'Vitaminas' },
    { name: 'Protetor Solar FPS 50', description: '120ml', price: 44.9, originalPrice: 49.9, category: 'Beleza' },
    { name: 'Paracetamol 750mg', description: '20 comprimidos', price: 12.5, originalPrice: null, category: 'Medicamentos' },
    { name: 'Álcool em Gel 70%', description: '500ml', price: 9.9, originalPrice: null, category: 'Higiene' },
    { name: 'Vitamina D3 2000UI', description: '60 cápsulas', price: 32.9, originalPrice: 39.9, category: 'Vitaminas' },
    { name: 'Termômetro Digital', description: 'Medição rápida', price: 24.9, originalPrice: null, category: 'Cuidados' },
    { name: 'Sabonete Líquido Antisséptico', description: '250ml', price: 14.9, originalPrice: null, category: 'Higiene' },
    { name: 'Máscara Facial Descartável', description: 'Pacote com 50 un.', price: 19.9, originalPrice: 24.9, category: 'Cuidados' },
    { name: 'Ibuprofeno 400mg', description: '20 comprimidos', price: 11.9, originalPrice: null, category: 'Medicamentos' }
  ];

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name, pharmacyId: pharmacy.id } });
    if (!exists) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          categoryId: categories[p.category].id,
          pharmacyId: pharmacy.id
        }
      });
    }
  }

  console.log('Seed concluído.');
  console.log('Login admin: admin@farma.app / admin123');
  console.log('Login farmácia: farmacia@farma.app / farmacia123');
  console.log('Login cliente: cliente@farma.app / cliente123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
