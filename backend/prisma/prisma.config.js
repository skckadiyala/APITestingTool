"use strict";
const dotenv_1 = require("dotenv");
const path_1 = require("path");
// Load environment variables from the backend directory
(0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, '..', '.env') });

console.log('[Prisma Config] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

/**
 * Prisma configuration for Prisma 7+
 * Database connection URL configuration for migrations
 * See: https://pris.ly/d/config-datasource
 */
module.exports = {
    datasource: {
        url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/api_testing_tool?schema=public',
    },
};
