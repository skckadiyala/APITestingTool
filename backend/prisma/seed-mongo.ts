import mongoose from 'mongoose';
import { RequestBody } from '../src/models/RequestBody';
import { ResponseBody } from '../src/models/ResponseBody';
import { connectMongoDB } from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function seedMongoDB() {
  try {
    console.log('🌱 Starting MongoDB seed...');

    // Connect to MongoDB
    await connectMongoDB();

    // Clean existing data
    await RequestBody.deleteMany({});
    await ResponseBody.deleteMany({});

    console.log('✅ Cleaned existing MongoDB data');

    // Create sample request bodies
    await RequestBody.create({
      requestId: 'sample-login-request-id',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true },
      ],
      body: {
        type: 'json',
        content: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
      auth: {
        type: 'noauth',
        config: {},
      },
      testScript: `
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("token");
  pm.environment.set("auth_token", jsonData.token);
});
      `.trim(),
    });

    await RequestBody.create({
      requestId: 'sample-create-user-request-id',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Authorization', value: 'Bearer {{auth_token}}', enabled: true },
      ],
      body: {
        type: 'json',
        content: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'user',
        },
      },
      auth: {
        type: 'bearer',
        config: {
          token: '{{auth_token}}',
        },
      },
      preRequestScript: `
// Set timestamp
pm.request.headers.add({
  key: "X-Timestamp",
  value: Date.now().toString()
});

console.log("Pre-request script executed");
      `.trim(),
      testScript: `
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("User created successfully", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData.email).to.equal("john.doe@example.com");
  pm.collectionVariables.set("user_id", jsonData.id);
});

pm.test("Response time is acceptable", function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});
      `.trim(),
    });

    await RequestBody.create({
      requestId: 'sample-get-users-request-id',
      headers: [
        { key: 'Authorization', value: 'Bearer {{auth_token}}', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true },
      ],
      body: {
        type: 'raw',
        content: '',
      },
      auth: {
        type: 'bearer',
        config: {
          token: '{{auth_token}}',
        },
      },
      testScript: `
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

pm.test("Users have required fields", function () {
  const jsonData = pm.response.json();
  if (jsonData.length > 0) {
    pm.expect(jsonData[0]).to.have.property("id");
    pm.expect(jsonData[0]).to.have.property("email");
    pm.expect(jsonData[0]).to.have.property("name");
  }
});
      `.trim(),
    });

    await RequestBody.create({
      requestId: 'sample-create-product-request-id',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Authorization', value: 'Bearer {{auth_token}}', enabled: true },
        { key: 'X-API-Key', value: '{{API_KEY}}', enabled: true },
      ],
      body: {
        type: 'json',
        content: {
          name: 'Sample Product',
          description: 'This is a sample product',
          price: 29.99,
          category: 'electronics',
          inStock: true,
          tags: ['new', 'featured'],
        },
      },
      auth: {
        type: 'apikey',
        config: {
          key: 'X-API-Key',
          value: '{{API_KEY}}',
          addTo: 'header',
        },
      },
      preRequestScript: `
// Generate random product ID
const randomId = Math.floor(Math.random() * 10000);
pm.collectionVariables.set("product_id", randomId.toString());

// Add custom header
pm.request.headers.add({
  key: "X-Request-ID",
  value: pm.variables.replaceIn("{{$randomUUID}}")
});
      `.trim(),
      testScript: `
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Product created with correct data", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.name).to.equal("Sample Product");
  pm.expect(jsonData.price).to.equal(29.99);
});
      `.trim(),
    });

    await RequestBody.create({
      requestId: 'sample-upload-file-request-id',
      headers: [
        { key: 'Authorization', value: 'Bearer {{auth_token}}', enabled: true },
      ],
      body: {
        type: 'form-data',
        content: [
          { key: 'file', value: '[FILE]', type: 'file' },
          { key: 'description', value: 'Profile picture', type: 'text' },
          { key: 'userId', value: '{{user_id}}', type: 'text' },
        ],
      },
      auth: {
        type: 'bearer',
        config: {
          token: '{{auth_token}}',
        },
      },
    });

    console.log('✅ Created request bodies');

    // Create sample response bodies
    await ResponseBody.create({
      historyId: 'sample-history-1',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'X-Response-Time', value: '45ms' },
      ],
      body: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
        },
        expiresIn: 3600,
      },
      cookies: [
        {
          name: 'session_id',
          value: 'abc123def456',
          domain: 'example.com',
          path: '/',
          httpOnly: true,
          secure: true,
        },
      ],
      size: 245,
    });

    await ResponseBody.create({
      historyId: 'sample-history-2',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'X-Total-Count', value: '3' },
      ],
      body: [
        {
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'admin',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          role: 'user',
          createdAt: '2024-02-20T14:45:00Z',
        },
        {
          id: 'user-3',
          email: 'bob@example.com',
          name: 'Bob Johnson',
          role: 'user',
          createdAt: '2024-03-10T09:15:00Z',
        },
      ],
      cookies: [],
      size: 512,
    });

    await ResponseBody.create({
      historyId: 'sample-history-3',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Location', value: '/users/user-456' },
      ],
      body: {
        success: true,
        message: 'User created successfully',
        data: {
          id: 'user-456',
          email: 'john.doe@example.com',
          name: 'John Doe',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      },
      cookies: [],
      size: 189,
    });

    await ResponseBody.create({
      historyId: 'sample-history-4',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
      ],
      body: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: 'The requested user with ID user-999 does not exist',
        },
      },
      cookies: [],
      size: 134,
    });

    await ResponseBody.create({
      historyId: 'sample-history-5',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'X-Request-ID', value: 'req-789xyz' },
      ],
      body: {
        success: true,
        product: {
          id: 'prod-789',
          name: 'Sample Product',
          description: 'This is a sample product',
          price: 29.99,
          category: 'electronics',
          inStock: true,
          tags: ['new', 'featured'],
          createdAt: new Date().toISOString(),
        },
      },
      cookies: [],
      size: 298,
    });

    console.log('✅ Created response bodies');

    console.log('\n📊 MongoDB Seed Summary:');
    console.log(`   Request Bodies: 5`);
    console.log(`   Response Bodies: 5`);
    console.log('\n✅ MongoDB seeding completed successfully!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding MongoDB:', error);
    process.exit(1);
  }
}

seedMongoDB();
