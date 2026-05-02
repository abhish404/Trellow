import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('Trellow@123', 10);

  const alice = await db.user.upsert({
    where: { email: 'Aarav@trellow.com' },
    update: {},
    create: { name: 'Aarav Sharma', email: 'Aarav@trellow.com', passwordHash: hash }
  });

  const bob = await db.user.upsert({
    where: { email: 'Kavya@trellow.com' },
    update: {},
    create: { name: 'Kavya Iyer', email: 'Kavya@trellow.com', passwordHash: hash }
  });

  const carol = await db.user.upsert({
    where: { email: 'Rohan@trellow.com' },
    update: {},
    create: { name: 'Rohan Gupta', email: 'Rohan@trellow.com', passwordHash: hash }
  });

  const p = await db.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design',
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: carol.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const tasks = [
    { title: 'Design mockups', description: 'Create Figma mockups for all pages', status: 'DONE', priority: 'HIGH', assigneeId: alice.id, creatorId: alice.id },
    { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for auto deploy', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: bob.id, creatorId: alice.id },
    { title: 'Implement auth flow', description: 'JWT-based authentication with signup and login', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: bob.id, creatorId: alice.id },
    { title: 'Write API documentation', status: 'TODO', priority: 'LOW', assigneeId: carol.id, creatorId: alice.id },
    { title: 'Performance audit', description: 'Run Lighthouse and fix critical issues', status: 'TODO', priority: 'URGENT', assigneeId: null, creatorId: alice.id, dueDate: new Date('2025-12-01') },
    { title: 'Landing page copy', status: 'DONE', priority: 'MEDIUM', assigneeId: carol.id, creatorId: alice.id },
    { title: 'Mobile responsive pass', description: 'Ensure all pages work on mobile', status: 'TODO', priority: 'HIGH', assigneeId: alice.id, creatorId: alice.id, dueDate: new Date('2025-11-15') }
  ];

  for (const t of tasks) {
    await db.task.create({ data: { ...t, projectId: p.id } });
  }

  const p2 = await db.project.create({
    data: {
      name: 'Mobile App v2',
      description: 'React Native app for iOS and Android',
      members: {
        create: [
          { userId: bob.id, role: 'ADMIN' },
          { userId: alice.id, role: 'MEMBER' }
        ]
      }
    }
  });

  await db.task.createMany({
    data: [
      { title: 'App navigation redesign', status: 'TODO', priority: 'HIGH', projectId: p2.id, creatorId: bob.id, assigneeId: alice.id },
      { title: 'Push notification service', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: p2.id, creatorId: bob.id, assigneeId: bob.id },
      { title: 'Offline mode support', status: 'TODO', priority: 'URGENT', projectId: p2.id, creatorId: bob.id }
    ]
  });

  console.log('seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
