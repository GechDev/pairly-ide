import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('pnpm-workspace.yaml exists and defines proper package globs', () => {
  const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
  assert.ok(fs.existsSync(workspacePath), 'pnpm-workspace.yaml must exist');
  const content = fs.readFileSync(workspacePath, 'utf8');
  assert.match(content, /apps\/\*/, 'workspace must include apps/*');
  assert.match(content, /packages\/\*/, 'workspace must include packages/*');
});

test('turbo.json exists and defines standard task pipelines', () => {
  const turboPath = path.join(rootDir, 'turbo.json');
  assert.ok(fs.existsSync(turboPath), 'turbo.json must exist');
  const turboConfig = JSON.parse(fs.readFileSync(turboPath, 'utf8'));

  assert.ok(turboConfig.tasks, 'tasks object must exist in turbo.json');
  assert.ok(turboConfig.tasks.build, 'turbo must define build task');
  assert.ok(turboConfig.tasks.lint, 'turbo must define lint task');
  assert.ok(turboConfig.tasks.test, 'turbo must define test task');
  assert.ok(turboConfig.tasks.typecheck, 'turbo must define typecheck task');
  assert.ok(turboConfig.tasks.dev, 'turbo must define dev task');
});

test('root package.json has scripts and valid turbo/prettier/typescript dependencies', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'root package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.equal(pkg.private, true, 'root package must be private');
  assert.ok(pkg.scripts.build, 'build script required');
  assert.ok(pkg.scripts.lint, 'lint script required');
  assert.ok(pkg.scripts.test, 'test script required');
  assert.ok(pkg.devDependencies.turbo, 'turbo required in devDependencies');
  assert.ok(pkg.devDependencies.typescript, 'typescript required in devDependencies');
  assert.ok(pkg.devDependencies.prettier, 'prettier required in devDependencies');
});

test('.gitignore properly ignores sensitive and generated paths', () => {
  const gitignorePath = path.join(rootDir, '.gitignore');
  assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');

  assert.match(gitignore, /node_modules/, 'must ignore node_modules');
  assert.match(gitignore, /\.turbo/, 'must ignore .turbo');
  assert.match(gitignore, /dist/, 'must ignore dist');
  assert.match(gitignore, /\.env/, 'must ignore .env');
});
