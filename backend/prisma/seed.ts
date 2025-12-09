import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.requestHistory.deleteMany();
  await prisma.request.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      passwordHash: hashedPassword,
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      passwordHash: hashedPassword,
      name: 'Jane Smith',
    },
  });

  console.log('✅ Created test users');

  // Create workspaces
  const workspace1 = await prisma.workspace.create({
    data: {
      name: 'Personal Workspace',
      ownerId: user1.id,
    },
  });

  const workspace2 = await prisma.workspace.create({
    data: {
      name: 'Team Project',
      ownerId: user2.id,
    },
  });

  console.log('✅ Created workspaces');

  // Create environments
  await prisma.environment.create({
    data: {
      name: 'Development',
      workspaceId: workspace1.id,
      variables: [
        { key: 'API_URL', value: 'http://localhost:3000', type: 'default', enabled: true },
        { key: 'API_KEY', value: 'dev_key_12345', type: 'secret', enabled: true },
        { key: 'TIMEOUT', value: '5000', type: 'default', enabled: true },
      ],
    },
  });

  await prisma.environment.create({
    data: {
      name: 'Production',
      workspaceId: workspace1.id,
      variables: [
        { key: 'API_URL', value: 'https://api.example.com', type: 'default', enabled: true },
        { key: 'API_KEY', value: 'prod_key_67890', type: 'secret', enabled: true },
        { key: 'TIMEOUT', value: '10000', type: 'default', enabled: true },
      ],
    },
  });

  await prisma.environment.create({
    data: {
      name: 'Staging',
      workspaceId: workspace2.id,
      variables: [
        { key: 'API_URL', value: 'https://staging.example.com', type: 'default', enabled: true },
        { key: 'API_KEY', value: 'staging_key_abcde', type: 'secret', enabled: true },
      ],
    },
  });

  console.log('✅ Created environments');

  // Create collections
  const apiCollection = await prisma.collection.create({
    data: {
      name: 'User API',
      description: 'Collection for user-related API endpoints',
      workspaceId: workspace1.id,
      type: 'COLLECTION',
      orderIndex: 0,
    },
  });

  const authFolder = await prisma.collection.create({
    data: {
      name: 'Authentication',
      description: 'Auth endpoints',
      workspaceId: workspace1.id,
      parentFolderId: apiCollection.id,
      type: 'FOLDER',
      orderIndex: 0,
    },
  });

  const usersFolder = await prisma.collection.create({
    data: {
      name: 'Users',
      description: 'User management endpoints',
      workspaceId: workspace1.id,
      parentFolderId: apiCollection.id,
      type: 'FOLDER',
      orderIndex: 1,
    },
  });

  const ecommerceCollection = await prisma.collection.create({
    data: {
      name: 'E-commerce API',
      description: 'Collection for e-commerce endpoints',
      workspaceId: workspace2.id,
      type: 'COLLECTION',
      orderIndex: 0,
    },
  });

  const productsFolder = await prisma.collection.create({
    data: {
      name: 'Products',
      description: 'Product management',
      workspaceId: workspace2.id,
      parentFolderId: ecommerceCollection.id,
      type: 'FOLDER',
      orderIndex: 0,
    },
  });

  console.log('✅ Created collections and folders');

  // Create requests
  const loginRequest = await prisma.request.create({
    data: {
      name: 'Login',
      method: 'POST',
      url: '{{API_URL}}/auth/login',
      collectionId: authFolder.id,
      orderIndex: 0,
    },
  });

  await prisma.request.create({
    data: {
      name: 'Register',
      method: 'POST',
      url: '{{API_URL}}/auth/register',
      collectionId: authFolder.id,
      orderIndex: 1,
    },
  });

  const getUsersRequest = await prisma.request.create({
    data: {
      name: 'Get All Users',
      method: 'GET',
      url: '{{API_URL}}/users',
      collectionId: usersFolder.id,
      orderIndex: 0,
    },
  });

  const getUserRequest = await prisma.request.create({
    data: {
      name: 'Get User by ID',
      method: 'GET',
      url: '{{API_URL}}/users/:id',
      collectionId: usersFolder.id,
      orderIndex: 1,
    },
  });

  const createUserRequest = await prisma.request.create({
    data: {
      name: 'Create User',
      method: 'POST',
      url: '{{API_URL}}/users',
      collectionId: usersFolder.id,
      orderIndex: 2,
    },
  });

  const updateUserRequest = await prisma.request.create({
    data: {
      name: 'Update User',
      method: 'PUT',
      url: '{{API_URL}}/users/:id',
      collectionId: usersFolder.id,
      orderIndex: 3,
    },
  });

  const deleteUserRequest = await prisma.request.create({
    data: {
      name: 'Delete User',
      method: 'DELETE',
      url: '{{API_URL}}/users/:id',
      collectionId: usersFolder.id,
      orderIndex: 4,
    },
  });

  const getProductsRequest = await prisma.request.create({
    data: {
      name: 'Get Products',
      method: 'GET',
      url: '{{API_URL}}/products',
      collectionId: productsFolder.id,
      orderIndex: 0,
    },
  });

  await prisma.request.create({
    data: {
      name: 'Create Product',
      method: 'POST',
      url: '{{API_URL}}/products',
      collectionId: productsFolder.id,
      orderIndex: 1,
    },
  });

  console.log('✅ Created requests');

  // Create request history
  await prisma.requestHistory.create({
    data: {
      requestId: loginRequest.id,
      userId: user1.id,
      method: 'POST',
      url: 'https://api.example.com/auth/login',
      requestBodyId: 'seed-login-body',
      statusCode: 200,
      responseTime: 145,
      executedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: getUsersRequest.id,
      userId: user1.id,
      method: 'GET',
      url: 'https://api.example.com/users',
      requestBodyId: 'seed-getusers-body',
      statusCode: 200,
      responseTime: 89,
      executedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: updateUserRequest.id,
      userId: user1.id,
      method: 'PUT',
      url: 'https://api.example.com/users/123',
      requestBodyId: 'seed-updateuser-body',
      statusCode: 200,
      responseTime: 156,
      executedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: createUserRequest.id,
      userId: user1.id,
      method: 'POST',
      url: 'https://api.example.com/users',
      requestBodyId: 'seed-createuser-body',
      statusCode: 201,
      responseTime: 234,
      executedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: deleteUserRequest.id,
      userId: user1.id,
      method: 'DELETE',
      url: 'https://api.example.com/users/123',
      requestBodyId: 'seed-deleteuser-body',
      statusCode: 204,
      responseTime: 67,
      executedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: getProductsRequest.id,
      userId: user2.id,
      method: 'GET',
      url: 'https://api.example.com/products',
      requestBodyId: 'seed-getproducts-body',
      statusCode: 200,
      responseTime: 123,
      executedAt: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    },
  });

  console.log('✅ Created request history');

  console.log('\n📊 Seed Summary:');
  console.log(`   Users: 2`);
  console.log(`   Workspaces: 2`);
  console.log(`   Environments: 3`);
  console.log(`   Collections: 2`);
  console.log(`   Folders: 3`);
  console.log(`   Requests: 9`);
  console.log(`   History entries: 6`);
  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n🔑 Test credentials:');
  console.log('   Email: john@example.com');
  console.log('   Password: password123');
  console.log('   ---');
  console.log('   Email: jane@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
