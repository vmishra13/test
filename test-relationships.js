// Quick test to check Prisma relationship names
const { PrismaClient } = require('./src/db/postgres/generated/postgres-client');

const prisma = new PrismaClient();

async function testRelationships() {
  try {
    const user = await prisma.user.findFirst({
      include: {
        user_role: {
          include: {
            role: true
          }
        },
        user_type: true,
        client: true
      }
    });
    
    if (user) {
      console.log('User properties:', Object.keys(user));
      console.log('user_role type:', Array.isArray(user.user_role) ? 'array' : 'object');
      if (user.user_role.length > 0) {
        console.log('First user_role keys:', Object.keys(user.user_role[0]));
      }
      console.log('user_type keys:', Object.keys(user.user_type));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRelationships();
