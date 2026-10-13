import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as registry from '../src/modules/templates/index.js';
import { buildOverlayTemplateHtml } from '../src/modules/templates/overlay-renderer.js';

test('public README matches the release and links only to available files', async () => {
  const readme = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8');
  const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(readme.split(/\r?\n/)[0], `# Polara v${pkg.version}`);
  for (const [, target] of readme.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(target)) continue;
    await fs.access(new URL(`../${target}`, import.meta.url));
  }
});

test('all production variants render directly from canonical overlays', async () => {
  assert.equal(registry.templates.length, 26);
  for (const template of registry.templates) {
    assert.equal(template.renderMode, 'png-overlay');
    assert.equal(template.file, undefined);
    assert.equal(await registry.resolveTemplateHtml(template), buildOverlayTemplateHtml(template));
    assert.deepEqual(registry.templateDims(template), {
      w: template.canvas.width, h: template.canvas.height, slots: template.photoWindows.length,
    });
  }
});

test('retired standalone templates and iframe loader are absent from runtime', async () => {
  const files = await fs.readdir(new URL('../src/modules/templates/', import.meta.url));
  assert.ok(files.every((file) => !file.endsWith('.html')));
  assert.ok(!files.includes('loader.js'));
  assert.equal(registry.heroHtmlRollbackTemplates, undefined);
  assert.equal(registry.legacyPickerRollbackTemplates, undefined);
  const app = await fs.readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /resolveTemplateDoc|thumbFrames|scaleThumb|createElement\('iframe'\)/);
});
