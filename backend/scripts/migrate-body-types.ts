/**
 * Migration script to update body types from old names to new names
 * Old: 'urlencoded', 'formdata' 
 * New: 'x-www-form-urlencoded', 'form-data'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBodyTypes() {
  console.log('Starting body type migration...');

  try {
    // Get all requests
    const requests = await prisma.request.findMany();
    console.log(`Found ${requests.length} requests to check`);

    let updatedCount = 0;

    for (const request of requests) {
      let needsUpdate = false;
      let updatedBody = request.body;

      if (request.body && typeof request.body === 'object') {
        const body = request.body as any;

        // Check if body type needs migration
        if (body.type === 'urlencoded') {
          console.log(`Updating request ${request.id} (${request.name}): urlencoded -> x-www-form-urlencoded`);
          body.type = 'x-www-form-urlencoded';
          
          // If content is an array, stringify it
          if (Array.isArray(body.content)) {
            body.content = JSON.stringify(body.content);
          }
          
          needsUpdate = true;
        } else if (body.type === 'formdata') {
          console.log(`Updating request ${request.id} (${request.name}): formdata -> form-data`);
          body.type = 'form-data';
          
          // If content is an array, stringify it
          if (Array.isArray(body.content)) {
            body.content = JSON.stringify(body.content);
          }
          
          needsUpdate = true;
        }

        if (needsUpdate) {
          updatedBody = body;
          await prisma.request.update({
            where: { id: request.id },
            data: { body: updatedBody as any }
          });
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Total requests checked: ${requests.length}`);
    console.log(`   Requests updated: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateBodyTypes()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
