const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Change provider
schema = schema.replace('provider = "postgresql"', 'provider = "mongodb"');

// Replace @id
schema = schema.replace(/@id @default\(uuid\(\)\)/g, '@id @default(auto()) @map("_id") @db.ObjectId');

// Replace any foreign keys ending with Id to use @db.ObjectId
schema = schema.replace(/(\w+Id\s+String\??)(\s+)/g, '$1 @db.ObjectId$2');

// Replace Decimal types
schema = schema.replace(/Decimal\s+@db\.Decimal\(\d+,\s*\d+\)/g, 'Float');
schema = schema.replace(/Decimal/g, 'Float');

// Fix @@id in UserPermission model since MongoDB doesn't support compound @@id
schema = schema.replace(/@@id\(\[userId, permissionId\]\)/, '@@unique([userId, permissionId])');

// Add id field to UserPermission
schema = schema.replace(/model UserPermission \{/, `model UserPermission {\n  id              String             @id @default(auto()) @map("_id") @db.ObjectId`);

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully');
