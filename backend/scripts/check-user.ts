import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

async function checkUser() {
  try {
    const email = 'suman.kadiyala@cdw.com';
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true, createdAt: true }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Password hash exists:', !!user.passwordHash);
      console.log('- Password hash length:', user.passwordHash?.length);
      console.log('- Created at:', user.createdAt);
      
      // Test password verification
      const testPassword = 'Password@123';
      const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
      console.log('\n🔐 Password verification test:');
      console.log('- Password matches:', isMatch);
    } else {
      console.log('❌ User not found');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
