const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkWorkspaces() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'suman.kadiyala@cdw.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.email, 'ID:', user.id);
    
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: user.id },
      include: { owner: true }
    });
    
    console.log('\nWorkspaces owned:', workspaces.length);
    workspaces.forEach(w => {
      console.log('- Name:', w.name, 'ID:', w.id);
    });
    
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });
    
    console.log('\nWorkspace memberships:', memberships.length);
    memberships.forEach(m => {
      console.log('- Workspace:', m.workspace.name, 'Role:', m.role);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkWorkspaces();
