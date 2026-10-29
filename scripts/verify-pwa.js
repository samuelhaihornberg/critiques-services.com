#!/usr/bin/env node
// PWA Verification Script
// Run after build to verify PWA requirements

import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve('dist');
const ERRORS = [];
const WARNINGS = [];

function log(msg) { console.log(`  ${msg}`); }
function error(msg) { ERRORS.push(msg); console.error(`  ❌ ${msg}`); }
function warn(msg) { WARNINGS.push(msg); console.warn(`  ⚠️  ${msg}`); }
function ok(msg) { console.log(`  ✅ ${msg}`); }

function readJSON(file) {
  const fullPath = path.join(DIST_DIR, file);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    error(`Invalid JSON in ${file}: ${e.message}`);
    return null;
  }
}

console.log('\n🔍 Verifying PWA build...\n');

// 1. Check manifest
console.log('\n📋 Manifest:');
const manifest = readJSON('manifest.webmanifest');
if (!manifest) {
  error('manifest.webmanifest missing or invalid');
} else {
  const required = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
  for (const field of required) {
    if (!manifest[field]) error(`Missing required field: ${field}`);
    else ok(`Has ${field}`);
  }
  if (manifest.icons?.length >= 2) ok(`Icons: ${manifest.icons.length} provided`);
  else warn(`Icons: only ${manifest.icons?.length || 0} (recommend 2+)`);
  
  if (manifest.display === 'standalone') ok('Display: standalone');
  else warn(`Display: ${manifest.display} (recommend standalone)`);
  
  if (manifest.start_url === '/') ok('Start URL: /');
  else warn(`Start URL: ${manifest.start_url}`);
  
  if (manifest.scope === '/') ok('Scope: /');
  else warn(`Scope: ${manifest.scope}`);
}

// 2. Check Service Worker
console.log('\n⚙️  Service Worker:');
const swPath = path.join(DIST_DIR, 'sw.js');
if (fs.existsSync(swPath)) {
  ok('sw.js exists');
  const swContent = fs.readFileSync(swPath, 'utf-8');
  if (swContent.includes('precacheAndRoute')) ok('Uses Workbox precacheAndRoute');
  if (swContent.includes('NavigationRoute') || swContent.includes('createHandlerBoundToURL')) ok('Handles SPA navigation');
  if (swContent.includes('cleanupOutdatedCaches')) ok('Cleans outdated caches');
  if (swContent.includes('skipWaiting') || swContent.includes('clientsClaim')) ok('Has skipWaiting/clientsClaim');
} else {
  error('sw.js missing');
}

const regSWPath = path.join(DIST_DIR, 'registerSW.js');
if (fs.existsSync(regSWPath)) {
  ok('registerSW.js exists');
} else {
  warn('registerSW.js missing (auto-registration)');
}

// 3. Check critical assets
console.log('\n📦 Critical Assets:');
const criticalAssets = [
  'index.html',
  'favicon.svg',
  'manifest.webmanifest',
  'sw.js',
  'registerSW.js'
];

for (const asset of criticalAssets) {
  const assetPath = path.join(DIST_DIR, asset);
  if (fs.existsSync(assetPath)) ok(`${asset}`);
  else error(`${asset} missing`);
}

// Check for JS/CSS bundles
const assetsDir = path.join(DIST_DIR, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  if (jsFiles.length) ok(`JS bundles: ${jsFiles.join(', ')}`);
  else error('No JS bundles found');
  if (cssFiles.length) ok(`CSS bundles: ${cssFiles.join(', ')}`);
  else error('No CSS bundles found');
}

// 4. Check icons
console.log('\n🎨 Icons:');
const iconFiles = ['pwa-192x192.svg', 'pwa-512x512.svg', 'favicon.svg'];
for (const icon of iconFiles) {
  const iconPath = path.join(DIST_DIR, icon);
  if (fs.existsSync(iconPath)) ok(`${icon}`);
  else warn(`${icon} missing`);
}

// 5. Check HTML
console.log('\n🌐 index.html:');
const htmlPath = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  if (html.includes('manifest.webmanifest')) ok('Links manifest');
  else warn('No manifest link in HTML');
  if (html.includes('registerSW.js') || html.includes('serviceWorker.register')) ok('Registers SW');
  else warn('No SW registration in HTML');
  if (html.includes('theme-color')) ok('Has theme-color meta');
  if (html.includes('viewport')) ok('Has viewport meta');
  if (html.includes('id="root"')) ok('Has root element');
}

// 6. Check 404.html for SPA
console.log('\n🔄 SPA Routing:');
const notFoundPath = path.join(DIST_DIR, '404.html');
if (fs.existsSync(notFoundPath)) ok('404.html exists (SPA fallback)');
else warn('404.html missing (needed for GitHub Pages SPA)');

// Summary
console.log('\n' + '='.repeat(50));
if (ERRORS.length === 0) {
  console.log('🎉 PWA verification PASSED');
  if (WARNINGS.length > 0) {
    console.log(`\n⚠️  ${WARNINGS.length} warnings - review recommended`);
  }
  process.exit(0);
} else {
  console.log(`❌ PWA verification FAILED (${ERRORS.length} errors)`);
  ERRORS.forEach(e => console.log(`  - ${e}`));
  process.exit(1);
}