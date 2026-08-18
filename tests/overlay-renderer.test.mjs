import test from 'node:test';
import assert from 'node:assert/strict';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';
import { buildOverlayTemplateHtml, waitForOverlayImage } from '../src/modules/templates/overlay-renderer.js';


const pocaSingle = frameOverlayTemplates.find((template) => template.id === 'poca-purikura.single');
const dailySingle = frameOverlayTemplates.find((template) => template.id === 'polara-daily-single');
const midnightStrip = frameOverlayTemplates.find((template) => template.id === 'polara-midnight-club-strip');


test('renderer PNG membuat canvas, slot, overlay, dan sticker layer pada z-order canonical', () => {
  const html = buildOverlayTemplateHtml(pocaSingle);

  assert.match(html, /class="ph-canvas ph-canvas-overlay"/);
  assert.match(html, /data-render-mode="png-overlay"/);
  assert.match(html, /width:1080px/);
  assert.match(html, /height:1350px/);
  assert.match(html, /class="ph-slot"[\s\S]*data-slot="1"[\s\S]*left:124px[\s\S]*top:270px[\s\S]*width:832px[\s\S]*height:840px[\s\S]*z-index:10/);
  assert.match(html, /class="ph-frame-overlay"[\s\S]*poca-purikura-single-overlay\.png\?v=frame-overlay-v4[\s\S]*aria-hidden="true"[\s\S]*z-index:20/);
  assert.match(html, /class="ph-sticker-layer"[\s\S]*z-index:30/);
  assert.doesNotMatch(html, /class="ph-caption"/);
});


test('renderer PNG menolak mode dan jumlah slot yang melanggar manifest', () => {
  assert.throws(
    () => buildOverlayTemplateHtml({ ...pocaSingle, renderMode: 'html' }),
    /bukan png-overlay/,
  );
  assert.throws(
    () => buildOverlayTemplateHtml({ ...pocaSingle, photoWindows: [] }),
    /jumlah photo window/,
  );
});


test('renderer PNG meng-escape nilai yang masuk ke markup', () => {
  const html = buildOverlayTemplateHtml({
    ...pocaSingle,
    id: 'frame<script>',
    slotBackground: '#fff7ef" onmouseover="alert(1)',
  });

  assert.doesNotMatch(html, /frame<script>/);
  assert.doesNotMatch(html, /onmouseover="alert\(1\)"/);
  assert.match(html, /frame&lt;script&gt;/);
});


test('renderer polygon memakai bounding slot dan clip-path dari geometry registry yang sama', () => {
  const html = buildOverlayTemplateHtml(dailySingle);

  assert.match(html, /data-mask-type="polygon"/);
  assert.match(html, /left:52px[\s\S]*top:301px[\s\S]*width:729px[\s\S]*height:745px/);
  assert.match(html, /clip-path:polygon\(3\.8409% 0%,95\.3361% 0%,100% 3\.6242%,100% 100%,0% 100%,0% 3\.6242%\)/);
});


test('renderer rounded rectangles menjaga radius masing-masing photo window', () => {
  const html = buildOverlayTemplateHtml(midnightStrip);

  assert.match(html, /data-mask-type="rounded-rectangles"/);
  assert.equal((html.match(/border-radius:14px/g) || []).length, 3);
});


test('overlay load gate menerima canvas legacy atau image siap dan menolak image rusak', async () => {
  await waitForOverlayImage({ querySelector: () => null });
  await waitForOverlayImage({ querySelector: () => ({ complete: true, naturalWidth: 1080 }) });
  await assert.rejects(
    waitForOverlayImage({ querySelector: () => ({ complete: true, naturalWidth: 0 }) }),
    /gagal dimuat/,
  );
});
