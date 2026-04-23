// Small shared components

const { useState, useEffect, useRef, useMemo } = React;

function Avatar({ person, size = 28 }) {
  if (!person) return null;
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: person.color, fontSize: size * 0.42 }}
      aria-hidden="true"
    >{person.initial}</span>
  );
}

function PeopleRail({ family, selected, onToggle, onClear }) {
  const hasSel = selected.size > 0;
  return (
    <div className={"people-rail" + (hasSel ? " dim" : "")}>
      {family.map(p => (
        <button
          key={p.id}
          className="person-chip"
          aria-pressed={selected.has(p.id)}
          onClick={() => onToggle(p.id)}
        >
          <Avatar person={p} />
          <span className="name">{p.name}</span>
        </button>
      ))}
      {hasSel && (
        <button className="clear" onClick={onClear}>Show all</button>
      )}
    </div>
  );
}

// simple line-drawn weather icons
function WeatherIcon({ kind = "sun", size = 72 }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "sun") {
    return (
      <svg {...common} className="wicon-svg">
        <circle cx="24" cy="24" r="8" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
          const r1 = 14, r2 = 18;
          const x1 = 24 + r1 * Math.cos(a * Math.PI / 180);
          const y1 = 24 + r1 * Math.sin(a * Math.PI / 180);
          const x2 = 24 + r2 * Math.cos(a * Math.PI / 180);
          const y2 = 24 + r2 * Math.sin(a * Math.PI / 180);
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </svg>
    );
  }
  if (kind === "cloud") {
    return (
      <svg {...common}>
        <path d="M14 30c-3 0-6-2.5-6-6 0-3.2 2.6-5.8 5.8-5.8 0.5 0 1 0.05 1.4 0.15C16.5 15 19.5 13 23 13c4.5 0 8 3.5 8 8 0 0.3 0 0.7-0.05 1C33.6 22.2 36 24.5 36 27.5c0 3-2.5 5.5-5.5 5.5H14z" />
      </svg>
    );
  }
  if (kind === "rain") {
    return (
      <svg {...common}>
        <path d="M14 24c-3 0-6-2.5-6-6 0-3.2 2.6-5.8 5.8-5.8 0.5 0 1 0.05 1.4 0.15C16.5 9 19.5 7 23 7c4.5 0 8 3.5 8 8 0 0.3 0 0.7-0.05 1C33.6 16.2 36 18.5 36 21.5c0 3-2.5 5.5-5.5 5.5H14z" />
        <line x1="16" y1="32" x2="14" y2="38" />
        <line x1="24" y1="32" x2="22" y2="38" />
        <line x1="32" y1="32" x2="30" y2="38" />
      </svg>
    );
  }
  return null;
}

function forecastIcon(kind) {
  if (kind === "sun") return "☀";
  if (kind === "cloud") return "⛅";
  if (kind === "rain") return "☔";
  return "·";
}

function useTick(intervalMs = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

Object.assign(window, { Avatar, PeopleRail, WeatherIcon, forecastIcon, useTick });
