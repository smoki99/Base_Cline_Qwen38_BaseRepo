#!/usr/bin/env node
const fs = require('fs'),
  path = require('path');
const lock = require('../package-lock.json');
const lockNames = new Set(
  Object.keys(lock.packages)
    .filter((k) => k.startsWith('node_modules/'))
    .map((k) => k.substring(k.lastIndexOf('node_modules/') + 13))
);
function walk(dir, found) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith('@')) {
      for (const s of fs.readdirSync(full, { withFileTypes: true })) {
        if (!s.isDirectory() || s.name.startsWith('.')) continue;
        found.add(e.name + '/' + s.name);
        const nm = path.join(full, s.name, 'node_modules');
        if (fs.existsSync(nm)) walk(nm, found);
      }
    } else if (e.isDirectory()) {
      found.add(e.name);
      const nm = path.join(full, 'node_modules');
      if (fs.existsSync(nm)) walk(nm, found);
    }
  }
}
const projectRoot = path.resolve(__dirname, '..');
const installed = new Set();
walk(path.join(projectRoot, 'node_modules'), installed);
const unexpected = [...installed].filter((n) => !lockNames.has(n));
if (unexpected.length) {
  console.error('Unexpected packages in node_modules:', unexpected.join(', '));
  process.exit(1);
}
console.log('✓ ' + installed.size + ' packages verified against lockfile');
