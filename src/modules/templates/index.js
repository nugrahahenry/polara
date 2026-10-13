// Registry runtime: geometry dan aset berasal dari manifest overlay canonical.
import { frameCollections, frameOverlayTemplates } from './frame-overlays.generated.js';
import { buildOverlayTemplateHtml } from './overlay-renderer.js';

export const templates = [...frameOverlayTemplates];
export { frameCollections };
export const getTemplate = (id) => templates.find((template) => template.id === id) || templates[0];

export async function resolveTemplateHtml(template) {
  return buildOverlayTemplateHtml(template);
}

export const templateDims = (template) => ({
  w: template.canvas.width,
  h: template.canvas.height,
  slots: template.photoWindows.length,
});
