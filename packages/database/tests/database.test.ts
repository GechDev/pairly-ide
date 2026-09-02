import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const dbPackageDir = path.resolve(__dirname, '..');

describe('Database Architecture & Infrastructure Contracts', () => {
  it('infra/docker-compose.yml defines robust PostgreSQL and Redis services with healthchecks', () => {
    const composePath = path.join(rootDir, 'infra', 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const composeContent = fs.readFileSync(composePath, 'utf8');
    expect(composeContent).toContain('postgres:16-alpine');
    expect(composeContent).toContain('pairly_postgres');
    expect(composeContent).toContain('POSTGRES_DB');
    expect(composeContent).toContain('POSTGRES_USER');
    expect(composeContent).toContain('POSTGRES_PASSWORD');
    expect(composeContent).toContain('postgres_data:/var/lib/postgresql/data');
    expect(composeContent).toContain('pg_isready');

    expect(composeContent).toContain('redis:7-alpine');
    expect(composeContent).toContain('pairly_redis');
    expect(composeContent).toContain('redis-server --appendonly yes');
    expect(composeContent).toContain('redis_data:/data');
    expect(composeContent).toContain('redis-cli');
  });

  it('prisma/schema.prisma exists and configures postgresql provider and client generator', () => {
    const schemaPath = path.join(dbPackageDir, 'prisma', 'schema.prisma');
    expect(fs.existsSync(schemaPath)).toBe(true);

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    expect(schemaContent).toMatch(/provider\s*=\s*"postgresql"/);
    expect(schemaContent).toMatch(/provider\s*=\s*"prisma-client-js"/);
  });

  it('schema.prisma declares all required domain Enums matching @pairly/contracts', () => {
    const schemaPath = path.join(dbPackageDir, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // RoomRole enum
    expect(schemaContent).toContain('enum RoomRole');
    expect(schemaContent).toContain('HOST');
    expect(schemaContent).toContain('EDITOR');
    expect(schemaContent).toContain('COMMENTER');
    expect(schemaContent).toContain('VIEWER');

    // RoomAccessMode enum
    expect(schemaContent).toContain('enum RoomAccessMode');
    expect(schemaContent).toContain('PUBLIC');
    expect(schemaContent).toContain('PASSCODE');
    expect(schemaContent).toContain('INVITE_ONLY');
    expect(schemaContent).toContain('LOBBY');

    // RoomMode enum
    expect(schemaContent).toContain('enum RoomMode');
    expect(schemaContent).toContain('COLLABORATIVE');
    expect(schemaContent).toContain('INTERVIEW');
    expect(schemaContent).toContain('CLASSROOM');
  });

  it('schema.prisma defines User model with required fields, relations, and indices', () => {
    const schemaPath = path.join(dbPackageDir, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    expect(schemaContent).toContain('model User');
    expect(schemaContent).toContain('id          String   @id @default(cuid())');
    expect(schemaContent).toContain('email       String?  @unique');
    expect(schemaContent).toContain('name        String');
    expect(schemaContent).toContain('avatar      String?');
    expect(schemaContent).toContain('githubId    String?  @unique');
    expect(schemaContent).toContain('preferences Json?');
    expect(schemaContent).toContain('createdAt   DateTime @default(now())');
    expect(schemaContent).toContain('updatedAt   DateTime @updatedAt');
    expect(schemaContent).toContain('deletedAt   DateTime?');
    expect(schemaContent).toContain('@@index([email])');
    expect(schemaContent).toContain('@@index([githubId])');
  });

  it('schema.prisma defines Room model with foreign keys, cascade delete, and indices', () => {
    const schemaPath = path.join(dbPackageDir, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    expect(schemaContent).toContain('model Room');
    expect(schemaContent).toContain('code             String         @unique');
    expect(schemaContent).toContain('accessMode       RoomAccessMode @default(PUBLIC)');
    expect(schemaContent).toContain('roomMode         RoomMode       @default(COLLABORATIVE)');
    expect(schemaContent).toContain('hostId           String');
    expect(schemaContent).toContain(
      'host             User           @relation("HostRooms", fields: [hostId], references: [id], onDelete: Cascade)',
    );
    expect(schemaContent).toContain('isLocked         Boolean        @default(false)');
    expect(schemaContent).toContain('executionEnabled Boolean        @default(true)');
    expect(schemaContent).toContain('aiEnabled        Boolean        @default(true)');
    expect(schemaContent).toContain('maxParticipants  Int            @default(20)');
    expect(schemaContent).toContain('defaultRole      RoomRole       @default(EDITOR)');
    expect(schemaContent).toContain('@@index([code])');
    expect(schemaContent).toContain('@@index([hostId])');
    expect(schemaContent).toContain('@@index([expiresAt])');
  });

  it('schema.prisma defines RoomParticipant model supporting guest and registered identities', () => {
    const schemaPath = path.join(dbPackageDir, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    expect(schemaContent).toContain('model RoomParticipant');
    expect(schemaContent).toContain('roomId           String');
    expect(schemaContent).toContain(
      'room             Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)',
    );
    expect(schemaContent).toContain('userId           String?');
    expect(schemaContent).toContain(
      'user             User?     @relation(fields: [userId], references: [id], onDelete: SetNull)',
    );
    expect(schemaContent).toContain('guestDisplayName String?');
    expect(schemaContent).toContain('guestAvatar      String?');
    expect(schemaContent).toContain('guestColor       String?');
    expect(schemaContent).toContain('role             RoomRole  @default(EDITOR)');
    expect(schemaContent).toContain('isMuted          Boolean   @default(false)');
    expect(schemaContent).toContain('isBanned         Boolean   @default(false)');
    expect(schemaContent).toContain('@@index([roomId])');
    expect(schemaContent).toContain('@@index([userId])');
    expect(schemaContent).toContain('@@index([roomId, role])');
  });

  it('schema.prisma defines WorkspaceSnapshot model with byte storage and version tracking', () => {
    const schemaPath = path.join(dbPackageDir, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    expect(schemaContent).toContain('model WorkspaceSnapshot');
    expect(schemaContent).toContain('roomId      String');
    expect(schemaContent).toContain(
      'room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)',
    );
    expect(schemaContent).toContain('version     Int      @default(1)');
    expect(schemaContent).toContain('data        Bytes');
    expect(schemaContent).toContain('sizeBytes   Int      @default(0)');
    expect(schemaContent).toContain('createdById String?');
    expect(schemaContent).toContain(
      'createdBy   User?    @relation(fields: [createdById], references: [id], onDelete: SetNull)',
    );
    expect(schemaContent).toContain('@@index([roomId])');
    expect(schemaContent).toContain('@@index([roomId, version])');
    expect(schemaContent).toContain('@@index([createdAt])');
  });
});
