const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marryme.uz' },
    update: {},
    create: {
      email: 'admin@marryme.uz',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      profile: { create: { firstName: 'Admin', lastName: 'MarryMe', lang: 'UZ' } },
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Services
  const services = [
    {
      slug: 'wedding',
      category: 'WEDDING',
      basePrice: 15000000,
      images: ['/uploads/samples/wedding1.jpg', '/uploads/samples/wedding2.jpg'],
      translations: {
        UZ: { name: 'To\'y Marosimi', description: 'Eng yaxshi to\'y tashkilotchisi. Samarqand uslubidan zamonaviy chic gacha.', features: ['Dekoratsiya', 'Fotograf', 'Videograf', 'Koordinator'] },
        RU: { name: 'Свадебная церемония', description: 'Лучший организатор свадеб. От самаркандского стиля до современного шика.', features: ['Декор', 'Фотограф', 'Видеограф', 'Координатор'] },
        EN: { name: 'Wedding Ceremony', description: 'Best wedding organizer. From Samarkand style to modern chic.', features: ['Decoration', 'Photographer', 'Videographer', 'Coordinator'] },
      },
      packages: [
        { slug: 'silver', price: 15000000, isPopular: false, translations: { UZ: { name: 'Silver', includes: ['Dekoratsiya', 'Fotograf (4 soat)', 'Koordinator'] }, RU: { name: 'Серебро', includes: ['Декор', 'Фотограф (4 часа)', 'Координатор'] }, EN: { name: 'Silver', includes: ['Decoration', 'Photographer (4h)', 'Coordinator'] } } },
        { slug: 'gold', price: 28000000, isPopular: true, translations: { UZ: { name: 'Gold', includes: ['Premium dekoratsiya', 'Fotograf (8 soat)', 'Videograf', 'Koordinator', 'Gul bezaklari'] }, RU: { name: 'Золото', includes: ['Премиум декор', 'Фотограф (8 часов)', 'Видеограф', 'Координатор', 'Флористика'] }, EN: { name: 'Gold', includes: ['Premium decoration', 'Photographer (8h)', 'Videographer', 'Coordinator', 'Floristry'] } } },
        { slug: 'platinum', price: 50000000, isPopular: false, translations: { UZ: { name: 'Platinum', includes: ['Eksklyuziv dekoratsiya', 'Fotograf (butun kun)', 'Videograf + drone', 'Bosh koordinator', 'Gul bezaklari', 'Animatsiya'] }, RU: { name: 'Платинум', includes: ['Эксклюзивный декор', 'Фотограф (весь день)', 'Видеограф + дрон', 'Главный координатор', 'Флористика', 'Анимация'] }, EN: { name: 'Platinum', includes: ['Exclusive decor', 'Photographer (full day)', 'Videographer + drone', 'Lead coordinator', 'Floristry', 'Animation'] } } },
      ],
    },
    {
      slug: 'love-story',
      category: 'LOVE_STORY',
      basePrice: 2000000,
      images: ['/uploads/samples/lovestory1.jpg'],
      translations: {
        UZ: { name: 'Love Story', description: 'Registon, Buxoro, Chorvoq — eng go\'zal joylarda romantik fotosessiya.', features: ['2-4 soat sessiya', 'Professional fotograf', 'Tahrirlanган foto', 'Online galereya'] },
        RU: { name: 'Love Story', description: 'Регистан, Бухара, Чорвак — романтическая фотосессия в красивых местах.', features: ['2-4 часа съёмки', 'Профессиональный фотограф', 'Обработка фото', 'Онлайн галерея'] },
        EN: { name: 'Love Story', description: 'Registan, Bukhara, Charvak — romantic photoshoot at the most beautiful places.', features: ['2-4 hour session', 'Professional photographer', 'Edited photos', 'Online gallery'] },
      },
      packages: [
        { slug: 'silver', price: 2000000, isPopular: false, translations: { UZ: { name: 'Basic', includes: ['2 soat', '30+ foto', '1 lokatsiya'] }, RU: { name: 'Базовый', includes: ['2 часа', '30+ фото', '1 локация'] }, EN: { name: 'Basic', includes: ['2 hours', '30+ photos', '1 location'] } } },
        { slug: 'gold', price: 3500000, isPopular: true, translations: { UZ: { name: 'Premium', includes: ['4 soat', '80+ foto', '2 lokatsiya', 'Video klip'] }, RU: { name: 'Премиум', includes: ['4 часа', '80+ фото', '2 локации', 'Видеоклип'] }, EN: { name: 'Premium', includes: ['4 hours', '80+ photos', '2 locations', 'Video clip'] } } },
      ],
    },
    {
      slug: 'proposal',
      category: 'PROPOSAL',
      basePrice: 1500000,
      images: ['/uploads/samples/proposal1.jpg'],
      translations: {
        UZ: { name: 'Surprise Proposal', description: 'Unutilmas taklifnoma marosimi. Yashirin kamera, gul ko\'chasi, surprise dinner.', features: ['Maxsus joy bezash', 'Yashirin fotograf', 'Gul kompozitsiyasi', 'Video yozuv'] },
        RU: { name: 'Сюрприз-предложение', description: 'Незабываемая церемония предложения. Скрытая камера, цветочная дорожка.', features: ['Оформление места', 'Скрытый фотограф', 'Цветочная композиция', 'Видеозапись'] },
        EN: { name: 'Surprise Proposal', description: 'Unforgettable proposal ceremony. Hidden camera, flower path, surprise dinner.', features: ['Venue setup', 'Hidden photographer', 'Flower arrangement', 'Video recording'] },
      },
      packages: [
        { slug: 'silver', price: 1500000, isPopular: false, translations: { UZ: { name: 'Romantic', includes: ['Joy bezash', 'Fotograf', 'Gul yo\'lak'] }, RU: { name: 'Романтик', includes: ['Оформление', 'Фотограф', 'Цветочная дорожка'] }, EN: { name: 'Romantic', includes: ['Setup', 'Photographer', 'Flower path'] } } },
        { slug: 'gold', price: 3000000, isPopular: true, translations: { UZ: { name: 'Dream', includes: ['Premium bezash', 'Fotograf + videograf', 'Gul kompozitsiyasi', 'Surprise dinner'] }, RU: { name: 'Мечта', includes: ['Премиум оформление', 'Фото + видео', 'Цветочная композиция', 'Ужин-сюрприз'] }, EN: { name: 'Dream', includes: ['Premium setup', 'Photo + video', 'Flower composition', 'Surprise dinner'] } } },
      ],
    },
    {
      slug: 'birthday',
      category: 'BIRTHDAY',
      basePrice: 3000000,
      images: ['/uploads/samples/birthday1.jpg'],
      translations: {
        UZ: { name: 'Tug\'ilgan Kun', description: 'Bolalar va kattalar uchun kreativ tug\'ilgan kun. Temalı bezash, animatorlar, tort.', features: ['Tema tanlash', 'Dekoratsiya', 'Animator', 'Fotograf'] },
        RU: { name: 'День Рождения', description: 'Креативный день рождения для детей и взрослых. Тематическое оформление.', features: ['Выбор темы', 'Декорация', 'Аниматор', 'Фотограф'] },
        EN: { name: 'Birthday Party', description: 'Creative birthday for kids and adults. Themed decoration, animators, cake.', features: ['Theme selection', 'Decoration', 'Animator', 'Photographer'] },
      },
      packages: [
        { slug: 'silver', price: 3000000, isPopular: false, translations: { UZ: { name: 'Fun', includes: ['Dekoratsiya', 'Animator (2h)', 'Fotograf'] }, RU: { name: 'Фан', includes: ['Декор', 'Аниматор (2ч)', 'Фотограф'] }, EN: { name: 'Fun', includes: ['Decoration', 'Animator (2h)', 'Photographer'] } } },
        { slug: 'gold', price: 6000000, isPopular: true, translations: { UZ: { name: 'Party', includes: ['Premium dekoratsiya', 'Animator (4h)', 'Fotograf + video', 'Tortga yozuv'] }, RU: { name: 'Пати', includes: ['Премиум декор', 'Аниматор (4ч)', 'Фото + видео', 'Надпись на торте'] }, EN: { name: 'Party', includes: ['Premium decoration', 'Animator (4h)', 'Photo + video', 'Cake inscription'] } } },
      ],
    },
  ];

  for (const svc of services) {
    const service = await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {},
      create: {
        slug: svc.slug,
        category: svc.category,
        basePrice: svc.basePrice,
        images: svc.images,
        translations: {
          create: Object.entries(svc.translations).map(([lang, t]) => ({
            lang, name: t.name, description: t.description, features: t.features,
          })),
        },
        packages: {
          create: svc.packages.map(pkg => ({
            slug: pkg.slug,
            price: pkg.price,
            isPopular: pkg.isPopular,
            translations: {
              create: Object.entries(pkg.translations).map(([lang, t]) => ({
                lang, name: t.name, includes: t.includes,
              })),
            },
          })),
        },
      },
    });
    console.log(`✅ Service: ${svc.slug}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('📧 Admin: admin@marryme.uz / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
