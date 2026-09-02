import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configDir = path.resolve(__dirname, '..');

test('packages/config package.json is valid', () => {
  const pkgPath = path.join(configDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.equal(pkg.name, '@pairly/config');
  assert.ok(Array.isArray(pkg.files), 'files field must be an array');
  assert.ok(pkg.files.includes('tsconfig.base.json'), 'files must include tsconfig.base.json');
});

test('tsconfig.base.json enforces strict TypeScript flags', () => {
  const baseTsConfigPath = path.join(configDir, 'tsconfig.base.json');
  assert.ok(fs.existsSync(baseTsConfigPath), 'tsconfig.base.json must exist');
  const tsconfig = JSON.parse(fs.readFileSync(baseTsConfigPath, 'utf8'));

  assert.equal(tsconfig.compilerOptions.strict, true, 'strict must be true');
  assert.equal(
    tsconfig.compilerOptions.noUncheckedIndexedAccess,
    true,
    'noUncheckedIndexedAccess must be true',
  );
  assert.equal(tsconfig.compilerOptions.noImplicitAny, true, 'noImplicitAny must be true');
  assert.equal(tsconfig.compilerOptions.noImplicitReturns, true, 'noImplicitReturns must be true');
});

test('child tsconfigs extend tsconfig.base.json', () => {
  const nodeTsConfigPath = path.join(configDir, 'tsconfig.node.json');
  const reactTsConfigPath = path.join(configDir, 'tsconfig.react.json');

  assert.ok(fs.existsSync(nodeTsConfigPath), 'tsconfig.node.json must exist');
  assert.ok(fs.existsSync(reactTsConfigPath), 'tsconfig.react.json must exist');

  const nodeTsConfig = JSON.parse(fs.readFileSync(nodeTsConfigPath, 'utf8'));
  const reactTsConfig = JSON.parse(fs.readFileSync(reactTsConfigPath, 'utf8'));

  assert.equal(nodeTsConfig.extends, './tsconfig.base.json');
  assert.equal(reactTsConfig.extends, './tsconfig.base.json');
});
