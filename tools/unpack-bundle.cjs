const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'HNUBS 관리 시스템 리뉴얼-original.html');
const output = path.join(root, 'reference');
const html = fs.readFileSync(source, 'utf8');

function readBundleScript(type) {
  const match = html.match(new RegExp(`<script type="${type}">([\\s\\S]*?)<\\/script>`));
  if (!match) throw new Error(`Missing ${type}`);
  return match[1].trim();
}

const manifest = JSON.parse(readBundleScript('__bundler/manifest'));
const order = JSON.parse(readBundleScript('__bundler/page_order'));
const template = JSON.parse(readBundleScript('__bundler/template'));
const frameNames = [...template.matchAll(/<iframe[^>]+src="about:blank#([^"]+)"[^>]+title="([^"]+)"/g)]
  .reduce((map, [, id, title]) => map.set(id, title), new Map());

const slugs = [
  'pc-home',
  'pc-weekly',
  'pc-ai-analysis',
  'pc-shoots',
  'pc-personal',
  'pc-people',
  'mobile-home',
  'mobile-weekly',
  'shared-header',
];

fs.mkdirSync(output, { recursive: true });
for (const [index, id] of order.entries()) {
  const entry = manifest[id];
  if (!entry) throw new Error(`Missing manifest entry ${id}`);
  const packed = Buffer.from(entry.data, 'base64');
  const content = entry.compressed ? zlib.gunzipSync(packed) : packed;
  const filename = `${String(index + 1).padStart(2, '0')}-${slugs[index]}.html`;
  fs.writeFileSync(path.join(output, filename), content);
  console.log(`${filename}\t${frameNames.get(id) || id}\t${content.length} bytes`);
}
