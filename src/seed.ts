import { seedDatabase } from './services/seed.service';

void (async () => {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
})();
