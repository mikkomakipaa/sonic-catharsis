import type { VittuiluMessage } from './validation';

// The notes API accepts at most 300 characters. Preserve the patient's own
// words even if the model omits them from its optional summary.
export function sceneNotesContext(summary: string | undefined, messages: VittuiluMessage[]): string | undefined {
  const reply = messages.findLast((message) => message.role === 'user')?.text.replace(/\s+/g, ' ').trim();
  if (!reply) return summary?.slice(0, 300) || undefined;
  let excerpt = reply.slice(0, 200);
  while (JSON.stringify(excerpt).length > 240) excerpt = excerpt.slice(0, -1);
  const userDetail = `Patient replied: ${JSON.stringify(excerpt)}`;
  const remaining = Math.max(0, 300 - userDetail.length - 1);
  const scene = summary?.replace(/\s+/g, ' ').trim().slice(0, remaining);
  return scene ? `${scene} ${userDetail}` : userDetail;
}
