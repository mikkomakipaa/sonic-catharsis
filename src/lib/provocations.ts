import type { TriggerType } from '@/types';
import type { Stage } from './theme';
import { PSEUDO_VITUTUS_STAGE, STAGES } from './theme';

// --- Provoke Me: the clinic's controlled-stimulus protocol -------------------
// When a reading comes back too calm to treat, the Epicrisis offers to
// "administer a stimulus": a deadpan textbook-style figure plate of an
// everyday annoyance. If it works ("Nyt vituttaa?" → yes), the stimulus's
// incident text and trigger are pre-filled into a fresh intake, and the new
// reading is flagged `provoked` so the Matcher can note the condition is
// iatrogenic — caused by the clinic itself. See docs/data-model.md.
//
// Every stimulus is written to be drawable as a plate (see
// docs/design/provoke-me/): one subject (A), one stimulus object (B), one
// piece of evidence (C — a distance, a count, a timestamp). `image` is set
// only once the plate has actually been drawn; until then the UI shows a
// text-only "illustration withheld" plate built from the same fields.

export interface Stimulus {
  id: string;
  // Figure number on the plate. Deliberately non-sequential — reads as
  // excerpts from a much larger (fictional) clinical atlas.
  fig: number;
  trigger: TriggerType;
  // Caption after "FIG. n — Stimulus:". Short: it has to fit one plate line.
  stimulus: string;
  // The A/B/C key under the caption.
  legend: string;
  // Pre-filled into the incident field on "yes". First person, as a user
  // would type it. Must stay within the 500-char intake limit.
  incident: string;
  // What to draw. For whoever makes the plate — never shown to users.
  imageBrief: string;
  // Public path of the drawn plate, if one exists yet.
  image?: string;
}

export const STIMULI: Stimulus[] = [
  // --- injustice ---
  {
    id: 'trolley',
    fig: 14,
    trigger: 'injustice',
    stimulus: 'unattended trolley, bay 3.',
    legend: 'A: subject, departing. B: trolley. C: return, empty.',
    incident: 'Someone left their shopping trolley in the middle of a parking space. The trolley return was two metres away. Two.',
    imageBrief: 'Side view. Stick figure walking away left with motion lines; trolley mid-bay; empty trolley shelter right; red 2.0 m measure between trolley and shelter.',
    image: '/provocations/fig-14-trolley.svg',
  },
  {
    id: 'fish-microwave',
    fig: 22,
    trigger: 'injustice',
    stimulus: 'reheated fish, shared microwave.',
    legend: 'A: source. B: odour radius (est.). C: subject, desk 14 m.',
    incident: 'A coworker reheated fish in the shared office microwave. Again. I can smell it from my desk on the other side of the floor.',
    imageBrief: 'Microwave on counter with fish skeleton inside; dashed red odour arcs spreading right; seated subject at desk holding nose; red 14 m measure.',
    image: '/provocations/fig-22-microwave.svg',
  },
  {
    id: 'late-merge',
    fig: 3,
    trigger: 'injustice',
    stimulus: 'late merge, lane 2.',
    legend: 'A: queue, 14 vehicles. B: subject. C: merging vehicle.',
    incident: 'Sat in a queue for ten minutes and a car drove past all of us in the empty lane and squeezed in right in front of me at the last second.',
    imageBrief: 'Top-down road. Left lane: row of identical box cars, subject car marked B. Right lane empty except one car with long red arrow cutting in ahead of B at the lane-end chevrons.',
    image: '/provocations/fig-3-late-merge.svg',
  },
  {
    id: 'lift-door',
    fig: 9,
    trigger: 'injustice',
    stimulus: 'lift door, closing.',
    legend: 'A: subject, running. B: occupant, finger on CLOSE. C: gap, 1.5 m.',
    incident: 'I ran for the lift, the person inside looked right at me and pressed the close button.',
    imageBrief: 'Lift doors half closed; figure inside with arm extended to button panel (button labelled ▶◀); subject running with motion lines; red 1.5 m measure.',
    image: '/provocations/fig-9-lift-door.svg',
  },

  // --- failure ---
  {
    id: 'usb',
    fig: 5,
    trigger: 'failure',
    stimulus: 'USB insertion, attempt 3.',
    legend: 'A: plug. B: port. C: orientation, attempts 1–3.',
    incident: 'Tried to plug in a USB cable. Wrong way. Flipped it. Wrong way again. Flipped it back. It went in.',
    imageBrief: 'Three small panels left to right: plug approaching port, each with a curved rotation arrow; first two marked ✕ in red, third ✓ — but the plug is in the same orientation as panel 1.',
    image: '/provocations/fig-5-usb.svg',
  },
  {
    id: 'toast',
    fig: 17,
    trigger: 'failure',
    stimulus: 'toast, buttered, in descent.',
    legend: 'A: table edge. B: toast, trajectory. C: point of impact, butter side.',
    incident: 'Dropped my toast. Butter side down. Of course butter side down.',
    imageBrief: 'Table edge left; dotted parabola of a slice rotating through 4 positions; butter side hatched; lands face down on floor; red C at impact.',
    image: '/provocations/fig-17-toast.svg',
  },
  {
    id: 'flatpack',
    fig: 26,
    trigger: 'failure',
    stimulus: 'flat-pack shelf, assembly complete.',
    legend: 'A: shelf. B: instructions, step 31 of 31. C: screw, surplus.',
    incident: 'Spent three hours building a flat-pack shelf. Finished it. There is one screw left over and I have no idea where it goes.',
    imageBrief: 'Finished bookshelf slightly leaning; open instruction booklet on floor; single screw on floor circled in red with dashed circle and C.',
    image: '/provocations/fig-26-flatpack.svg',
  },
  {
    id: 'pen',
    fig: 33,
    trigger: 'failure',
    stimulus: 'signature, interrupted.',
    legend: 'A: document. B: pen, empty. C: signature, 40% complete.',
    incident: 'Signing an important form and the pen ran out halfway through my name. In front of everyone.',
    imageBrief: 'Form with signature line; cursive scrawl fading to indented scratch marks; pen resting at the end; red bracket under the visible part marked 40%.',
    image: '/provocations/fig-33-pen.svg',
  },

  // --- conflict ---
  {
    id: 'armrest',
    fig: 8,
    trigger: 'conflict',
    stimulus: 'shared armrest, row 23.',
    legend: 'A: subject. B: neighbour, elbow. C: armrest, available width 0 cm.',
    incident: 'The person next to me on the plane took the whole armrest for the entire four-hour flight.',
    imageBrief: 'Front view of two seats; neighbour elbow covering armrest fully; subject arms tucked in; red measure across armrest reading 0 cm.',
    image: '/provocations/fig-8-armrest.svg',
  },
  {
    id: 'thermostat',
    fig: 20,
    trigger: 'conflict',
    stimulus: 'office thermostat, contested.',
    legend: 'A: subject. B: thermostat. C: setpoint over 5 days.',
    incident: 'Someone keeps turning the office thermostat down. I keep turning it back up. Neither of us has said a word about it.',
    imageBrief: 'Wall thermostat dial centre; small line graph below: setpoint zig-zagging between 19 and 23 across Mon–Fri in red; two hands reaching for the dial from opposite sides.',
    image: '/provocations/fig-20-thermostat.svg',
  },
  {
    id: 'fridge-note',
    fig: 27,
    trigger: 'conflict',
    stimulus: 'communal fridge, annotated.',
    legend: 'A: note. B: milk, contested. C: subject’s milk, 0 ml.',
    incident: 'Someone keeps drinking my milk from the office fridge. Today there was a note on the fridge about people “respecting shared spaces”.',
    imageBrief: 'Open fridge; note taped to door (scribbled lines, underlined twice); milk carton tipped, dotted empty level line; red C.',
    image: '/provocations/fig-27-fridge-note.svg',
  },
  {
    id: 'sauna',
    fig: 35,
    trigger: 'conflict',
    stimulus: 'sauna, unrequested löyly.',
    legend: 'A: subject, top bench. B: ladle, 4th pour. C: temperature.',
    incident: 'Someone in the sauna kept throwing water on the stove without asking anyone. Four ladles. I could not breathe.',
    imageBrief: 'Side section of sauna benches; figure at stove pouring ladle, steam curls; subject on top bench hunched; wall thermometer with red needle off the scale.',
    image: '/provocations/fig-35-sauna.svg',
  },

  // --- helplessness ---
  {
    id: 'bus',
    fig: 31,
    trigger: 'helplessness',
    stimulus: 'bus 55, status “arriving”.',
    legend: 'A: subject. B: display, four readings. C: patience, observed.',
    incident: 'The bus stop screen said my bus was arriving in 1 minute. It said that for twelve minutes.',
    imageBrief: 'Top: four LED displays reading “55 1 min” at t=0/4/8/12. Bottom left: red stepped patience curve falling to zero. Bottom right: subject at stop.',
    image: '/provocations/fig-31-bus.svg',
  },
  {
    id: 'progress-bar',
    fig: 6,
    trigger: 'helplessness',
    stimulus: 'software update, 99%.',
    legend: 'A: progress bar. B: clock. C: time at 99%, 40 min.',
    incident: 'My computer started an update I did not ask for. It has been stuck at 99% for forty minutes.',
    imageBrief: 'Laptop screen with a nearly-full progress bar labelled 99%; wall clock beside it with a red shaded 40-minute sector.',
    image: '/provocations/fig-6-progress-bar.svg',
  },
  {
    id: 'hold-music',
    fig: 12,
    trigger: 'helplessness',
    stimulus: 'telephone queue, minute 47.',
    legend: 'A: subject. B: handset, hold music. C: queue position, unchanged.',
    incident: 'On hold with customer service for 47 minutes. The voice still says I am caller number 12.',
    imageBrief: 'Subject slumped with phone; music notes drifting out; two speech bubbles at 00:01 and 00:47 both reading “caller 12”; red C between them.',
    image: '/provocations/fig-12-hold-music.svg',
  },
  {
    id: 'parking-fine',
    fig: 24,
    trigger: 'helplessness',
    stimulus: 'parking fine, 1 minute over.',
    legend: 'A: subject, returning. B: ticket. C: time exceeded.',
    incident: 'Got a parking fine. I was one minute late back to the car. One.',
    imageBrief: 'Car windscreen with ticket under wiper; subject running in, holding a coffee; parking disc and watch side by side with red C at 1 min.',
    image: '/provocations/fig-24-parking-fine.svg',
  },

  // --- overload ---
  {
    id: 'headphone-knot',
    fig: 4,
    trigger: 'overload',
    stimulus: 'headphone cable, spontaneous knot.',
    legend: 'A: pocket. B: cable. C: knot, detail ×4.',
    incident: 'Pulled my headphones out of my pocket and they had tied themselves into a knot. I only put them in there ten minutes ago.',
    imageBrief: 'Trouser pocket outline; cable emerging into a dense tangle; circular magnified inset (×4) of the knot with red C.',
    image: '/provocations/fig-4-headphone-knot.svg',
  },
  {
    id: 'inbox',
    fig: 11,
    trigger: 'overload',
    stimulus: 'return from leave, day 1, 09:00.',
    legend: 'A: subject. B: laptop. C: unread, 147.',
    incident: 'Took one day off. Opened my laptop this morning: 147 unread messages.',
    imageBrief: 'Subject at desk, laptop open; screen shows envelope icon with red badge “147”; small sweat droplet; stack of papers.',
    image: '/provocations/fig-11-inbox.svg',
  },
  {
    id: 'reply-all',
    fig: 19,
    trigger: 'overload',
    stimulus: 'reply-all, cascade.',
    legend: 'A: origin, “thanks!”. B: recipients, 214. C: replies asking to be removed.',
    incident: 'Someone replied all to a 214-person email to say “thanks!”. Then twelve people replied all asking to be removed from the list.',
    imageBrief: 'Tree diagram: one envelope at top fanning out to a grid of tiny envelopes; red arrows looping back up from several of them labelled C.',
    image: '/provocations/fig-19-reply-all.svg',
  },
  {
    id: 'open-office',
    fig: 23,
    trigger: 'overload',
    stimulus: 'open-plan office, three calls on speaker.',
    legend: 'A: subject. B: sources, 3. C: overlapping wavefronts.',
    incident: 'Three people around my desk are all on speakerphone calls at the same time. I am trying to write one email.',
    imageBrief: 'Top-down office: subject desk centre, three desks around it each emitting concentric red arcs that overlap on the subject.',
    image: '/provocations/fig-23-open-office.svg',
  },

  // --- exhaustion ---
  {
    id: 'snooze',
    fig: 2,
    trigger: 'exhaustion',
    stimulus: 'alarm, snoozed ×4.',
    legend: 'A: subject. B: alarm, 06:00–06:36. C: alertness, inverse.',
    incident: 'Snoozed the alarm four times and somehow woke up more tired than before.',
    imageBrief: 'Row of five alarm clocks 06:00, 06:09, 06:18, 06:27, 06:36; below, a red line labelled alertness going DOWN across them; subject in bed, pillow over head.',
    image: '/provocations/fig-2-snooze.svg',
  },
  {
    id: 'lift-out-of-order',
    fig: 15,
    trigger: 'exhaustion',
    stimulus: 'lift, out of service.',
    legend: 'A: subject, groceries ×3. B: sign. C: destination, floor 7.',
    incident: 'The lift was out of order. I live on the seventh floor. I had three bags of groceries.',
    imageBrief: 'Lift door with taped sign “POIS KÄYTÖSTÄ”; staircase zig-zagging up to a 7 at top; subject at bottom with three bags; red dotted path up the stairs.',
    image: '/provocations/fig-15-lift-out-of-order.svg',
  },
  {
    id: 'mosquito',
    fig: 21,
    trigger: 'exhaustion',
    stimulus: 'mosquito, single, 03:12.',
    legend: 'A: subject. B: mosquito, flight path. C: location, never confirmed.',
    incident: 'One mosquito kept me awake from 3 a.m. onwards. I turned the light on four times. Never found it.',
    imageBrief: 'Subject in bed eyes open; looping dotted flight path around head ending off-frame; clock 03:12; red C with “?” where the path exits.',
    image: '/provocations/fig-21-mosquito.svg',
  },

  // --- uncertainty ---
  {
    id: 'delivery-window',
    fig: 7,
    trigger: 'uncertainty',
    stimulus: 'parcel, delivery window 08–21.',
    legend: 'A: subject, at window. B: clock, window shaded. C: arrival, unknown.',
    incident: 'My parcel was arriving “between 8 and 21”. I could not leave the house all day. It came at 20:58.',
    imageBrief: 'Clock face with almost the whole dial shaded red; subject peering through a window; doorbell with question mark.',
    image: '/provocations/fig-7-delivery-window.svg',
  },
  {
    id: 'queue-choice',
    fig: 13,
    trigger: 'uncertainty',
    stimulus: 'checkout queues, selection error.',
    legend: 'A: subject, queue 1. B: queue 2. C: relative progress.',
    incident: 'Picked the shorter checkout queue. The other one has now moved six people while mine has not moved at all.',
    imageBrief: 'Two parallel queues of stick figures at tills; subject in left queue stationary; right queue with red forward arrows; small bar comparison C.',
    image: '/provocations/fig-13-queue-choice.svg',
  },
  {
    id: 'seen',
    fig: 29,
    trigger: 'uncertainty',
    stimulus: 'message, read, no reply.',
    legend: 'A: message. B: status, “seen 14:02”. C: elapsed, 4 h 38 min.',
    incident: 'Sent a message at 14:02. It says “seen”. It is now 18:40. Nothing.',
    imageBrief: 'Phone screen with one chat bubble and small “Seen 14:02”; wall clock 18:40 beside it; red bracket between the two times.',
    image: '/provocations/fig-29-seen.svg',
  },

  // --- absurdity ---
  {
    id: 'push-door',
    fig: 10,
    trigger: 'absurdity',
    stimulus: 'door, labelled PUSH.',
    legend: 'A: subject. B: sign. C: handle, pull type.',
    incident: 'The door said PUSH. It had a big pull handle. It was a pull door.',
    imageBrief: 'Glass door with sign “PUSH”; large D-shaped pull handle circled in red; subject pressing flat palm against the door, motion lines bouncing back.',
    image: '/provocations/fig-10-push-door.svg',
  },
  {
    id: 'captcha',
    fig: 16,
    trigger: 'absurdity',
    stimulus: 'verification, traffic lights, attempt 3.',
    legend: 'A: grid, 3 × 3. B: traffic light, partial. C: result, “try again”.',
    incident: 'Failed the “select all squares with traffic lights” test three times. I am a human. I think.',
    imageBrief: '3×3 grid with a traffic light spanning parts of 4 cells, one corner cell barely touched by its pole; red outline on that ambiguous cell; “TRY AGAIN” stamp.',
    image: '/provocations/fig-16-captcha.svg',
  },
  {
    id: 'crossing-button',
    fig: 25,
    trigger: 'absurdity',
    stimulus: 'pedestrian button, pressed ×11.',
    legend: 'A: subject. B: button. C: signal, unchanged.',
    incident: 'Pressed the pedestrian crossing button eleven times. Still red. I am fairly sure it is not connected to anything.',
    imageBrief: 'Crossing pole with button box; hand pressing with tally marks ×11 beside it; pedestrian signal showing red figure; red dashed line from button to nowhere.',
    image: '/provocations/fig-25-crossing-button.svg',
  },
  {
    id: 'printer',
    fig: 30,
    trigger: 'absurdity',
    stimulus: 'printer, paper jam (no paper present).',
    legend: 'A: display, “PAPER JAM”. B: tray, empty. C: jam, not located.',
    incident: 'The printer says paper jam. There is no paper in it. There is no jam.',
    imageBrief: 'Office printer with tiny display reading PAPER JAM; tray pulled out and empty; all hatches open; subject on knees peering in; red C with “?” inside.',
    image: '/provocations/fig-30-printer.svg',
  },
];

// How many stimuli one session administers before the patient is
// discharged as immune.
export const MAX_STIMULI_PER_SESSION = 5;

// Where Provoke Me is offered: the two readings that are "too calm to
// treat" — Level 0 (Pseudo-vitutus, the clinic declined to certify it) and
// Stage I (the lowest real stage, effectively intensity 0). Compared by
// reference, never by `index`, since PSEUDO_VITUTUS_STAGE and SURFACE share
// index 0 (see lib/theme.ts). Change this one predicate to move the offer.
export function shouldOfferProvocation(stage: Stage): boolean {
  return stage === PSEUDO_VITUTUS_STAGE || stage === STAGES[0];
}

// One session's stimuli: drawn plates first (so patients see real
// illustrations when there are any), each group shuffled. `random` is
// injectable for tests.
export function pickStimuli(
  count: number = MAX_STIMULI_PER_SESSION,
  random: () => number = Math.random,
  pool: Stimulus[] = STIMULI
): Stimulus[] {
  const shuffle = (items: Stimulus[]) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const drawn = shuffle(pool.filter((s) => s.image));
  const undrawn = shuffle(pool.filter((s) => !s.image));
  return [...drawn, ...undrawn].slice(0, count);
}
