// Regenerates STIMULI.md from src/lib/provocations.ts (run from repo root):
//   node docs/design/provoke-me/generate_stimuli_md.mjs src/lib/provocations.ts docs/design/provoke-me/STIMULI.md
// With --json <file>, prints the stimuli as JSON instead (input for generate_plates.py).
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[process.argv[2] === '--json' ? 3 : 2], 'utf8');
const start = src.indexOf('export const STIMULI: Stimulus[] = ') + 'export const STIMULI: Stimulus[] = '.length;
const end = src.indexOf('];', start) + 1;
const STIMULI = (0, eval)('(' + src.slice(start, end) + ')');
if (process.argv[2] === '--json') { process.stdout.write(JSON.stringify(STIMULI)); process.exit(0); }
const order = ['injustice','failure','conflict','helplessness','overload','exhaustion','uncertainty','absurdity'];
let md = `# Provoke Me: stimulus templates (for review)

Generated from [\`src/lib/provocations.ts\`](../../../src/lib/provocations.ts), which is the source of truth. Edit there, not here.

- ${STIMULI.length} stimuli across all 8 triggers. Every one was picked because it can be drawn as a single plate: one subject (A), one stimulus object (B), one piece of evidence (C: a distance, a count, a time).
- **Drawn:** ${STIMULI.filter(s=>s.image).length} of ${STIMULI.length}. Any stimulus without an image shows an "illustration withheld" plate in the app.
- **Incident** is what gets pre-filled into the intake when the patient answers "yes".
- See all plates: [preview.html](preview.html). New plates: \`generate_plates.py\` (see its header).

`;
for (const t of order) {
  const group = STIMULI.filter(s => s.trigger === t);
  md += `## ${t[0].toUpperCase() + t.slice(1)} (${group.length})\n\n`;
  for (const s of group) {
    md += `### FIG. ${s.fig}: ${s.stimulus}${s.image ? ' ✅ drawn' : ''}\n\n`;
    md += `- **Legend:** ${s.legend}\n- **Incident:** ${s.incident}\n- **Image brief:** ${s.imageBrief}\n\n`;
  }
}
fs.writeFileSync(process.argv[3], md);
console.log('stimuli:', STIMULI.length, 'drawn:', STIMULI.filter(s=>s.image).length);
