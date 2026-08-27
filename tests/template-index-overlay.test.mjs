import test from 'node:test';
import assert from 'node:assert/strict';

import {
  templates,
  heroHtmlRollbackTemplates,
  legacyPickerRollbackTemplates,
  resolveTemplateHtml,
  templateDims,
} from '../src/modules/templates/index.js';


test('picker runtime berisi tepat tujuh keluarga dan empat belas Hero sementara source lama tetap tersedia untuk rollback', () => {
  const heroes = templates.filter((template) => template.pickerBadge === 'Hero');

  assert.equal(templates.length, 14);
  assert.equal(heroes.length, 14);
  assert.equal(new Set(heroes.map((template) => template.familyId)).size, 7);
  assert.ok(heroes.every((template) => template.renderMode === 'png-overlay'));
  assert.ok(heroes.every((template) => template.status === 'runtime-overlay'));
  assert.equal(heroHtmlRollbackTemplates.length, 6);
  assert.ok(heroHtmlRollbackTemplates.every((template) => template.status === 'temporary-code-frame'));
  assert.equal(legacyPickerRollbackTemplates.length, 8);
});


test('resolver dan dimensi memakai manifest overlay tanpa menghitung ulang geometry', async () => {
  const single = templates.find((template) => template.id === 'poca-purikura.single');
  const strip = templates.find((template) => template.id === 'vintage-film-lofi.strip');
  const html = await resolveTemplateHtml(single);

  assert.match(html, /data-render-mode="png-overlay"/);
  assert.deepEqual(templateDims(single), { w: 1080, h: 1350, slots: 1 });
  assert.deepEqual(templateDims(strip), { w: 720, h: 1800, slots: 3 });
});
