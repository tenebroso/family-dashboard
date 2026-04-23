// Family dashboard — mock data

const FAMILY = [
  { id: "jon",     name: "Jon",     role: "Dad",     color: "var(--p-jon)",     initial: "J" },
  { id: "krysten", name: "Krysten", role: "Mom",     color: "var(--p-krysten)", initial: "K" },
  { id: "harry",   name: "Harry",   role: "Son",     color: "var(--p-harry)",   initial: "H" },
  { id: "ruby",    name: "Ruby",    role: "Daughter",color: "var(--p-ruby)",    initial: "R" },
  { id: "mylo",    name: "Mylo",    role: "Son",     color: "var(--p-mylo)",   initial: "M" },
];

// Today = Sun Apr 19 2026 per system; we'll drive relative to a demo "now"
// Keep a mutable "DEMO_NOW" so time-of-day preview can shift it
const DEMO_NOW_DEFAULT = new Date(2026, 3, 19, 10, 42); // Apr 19, 2026 10:42

const WEEK_START = new Date(2026, 3, 13); // Mon Apr 13

// Events live relative to day offset from WEEK_START (0..6)
const WEEK_EVENTS = [
  // Mon 13
  { dayOffset: 0, allDay: true,  start: null,   title: "Krysten — work trip",    who: "krysten" },
  // Tue 14
  { dayOffset: 1, start: "19:00", title: "Book club",              who: "krysten" },
  { dayOffset: 1, start: "17:30", title: "Harry — soccer practice",who: "harry"   },
  // Wed 15
  { dayOffset: 2, allDay: true,  start: null,   title: "Jon — offsite",          who: "jon"     },
  { dayOffset: 2, start: "17:00", title: "Ruby's therapy",         who: "ruby"    },
  // Thu 16
  { dayOffset: 3, start: "10:15", title: "H therapy",              who: "harry"   },
  { dayOffset: 3, start: "15:30", title: "Ruby's drum lesson",     who: "ruby"    },
  { dayOffset: 3, start: "19:00", title: "Parent-teacher night",   who: "krysten" },
  // Fri 17
  { dayOffset: 4, allDay: true,  start: null,   title: "Krysten — work trip",    who: "krysten" },
  { dayOffset: 4, start: "16:00", title: "Mylo arrives home",      who: "mylo"    },
  // Sat 18
  { dayOffset: 5, start: "11:00", title: "Nolan plays at Bavarian Inn", who: "jon" },
  { dayOffset: 5, start: "18:30", title: "Dinner at the Kims",     who: "krysten" },
  // Sun 19 (today)
  { dayOffset: 6, start: "08:30", title: "Farmer's market run",    who: "jon"     },
  { dayOffset: 6, start: "11:00", title: "Mylo — campus tour recap",who:"mylo"    },
  { dayOffset: 6, start: "13:30", title: "Ruby — drum practice",   who: "ruby"    },
  { dayOffset: 6, start: "16:00", title: "Harry's friends over",   who: "harry"   },
  { dayOffset: 6, start: "19:00", title: "Family movie night",     who: "krysten" },
];

const CHORES = [
  { id: "c1", title: "Empty dishwasher", who: "harry",   done: false },
  { id: "c2", title: "Take out trash",   who: "jon",     done: true  },
  { id: "c3", title: "Fold laundry",     who: "ruby",    done: false },
  { id: "c4", title: "Water plants",     who: "krysten", done: true  },
];

const GROCERY = [
  { id: "g1", title: "Milk",     qty: "1 gal",   who: "krysten", cat: "Dairy",   done: false },
  { id: "g2", title: "Pop tarts",qty: "",        who: "ruby",    cat: "Snacks",  done: false },
  { id: "g3", title: "Coffee",   qty: "1 lb",    who: "jon",     cat: "Pantry",  done: false },
  { id: "g4", title: "Berries",  qty: "2 pints", who: "harry",   cat: "Produce", done: true  },
];

const WEATHER = {
  now: { temp: 46, cond: "Mostly sunny", icon: "sun" },
  range: { hi: 58, lo: 41 },
  forecast: [
    { d: "Mon", t: 61, icon: "sun" },
    { d: "Tue", t: 55, icon: "cloud" },
    { d: "Wed", t: 49, icon: "rain" },
    { d: "Thu", t: 52, icon: "cloud" },
  ],
};

const MESSAGES = [
  { who: "krysten", text: "Don't forget Ruby has drum lesson Thursday — Mylo can drive.", at: "8:14 AM" },
  { who: "jon",     text: "Picking up coffee on the way home.",                           at: "9:32 AM" },
  { who: "mylo",    text: "Home by 4 Friday. Bringing laundry. Sorry.",                   at: "10:05 AM" },
];

// helpers
function timeOfDay(hour) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
function accentFor(tod) {
  // [hue, chroma, lightness]  -- driven via CSS var overrides
  if (tod === "morning")   return { hue: 60,  ink: 0.38, mid: 0.70, wash: 0.95, wash2: 0.90, chroma: 0.14, greet: "Good morning" };
  if (tod === "afternoon") return { hue: 145, ink: 0.38, mid: 0.68, wash: 0.94, wash2: 0.88, chroma: 0.10, greet: "Good afternoon" };
  return                           { hue: 320, ink: 0.40, mid: 0.62, wash: 0.94, wash2: 0.88, chroma: 0.11, greet: "Good evening" };
}
function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}
function fmtTime(str) {
  const [h, m] = str.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}
function fmtTimeShort(str) {
  const [h, m] = str.split(":").map(Number);
  const ampm = h >= 12 ? "p" : "a";
  const hh = ((h + 11) % 12) + 1;
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, "0")}${ampm}`;
}
function minsUntil(nowMins, mins) { return mins - nowMins; }

Object.assign(window, {
  FAMILY, WEEK_START, WEEK_EVENTS, CHORES, GROCERY, WEATHER, MESSAGES, DEMO_NOW_DEFAULT,
  timeOfDay, accentFor, parseTime, fmtTime, fmtTimeShort, minsUntil
});
