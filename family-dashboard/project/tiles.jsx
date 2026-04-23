// Tiles: Hero, Weather, Message, Week

const { useState: useState2, useEffect: useEffect2, useRef: useRef2, useMemo: useMemo2 } = React;

// ----- HERO -----
function HeroTile({ now, family, peopleFilter }) {
  const todayOffset = 6; // Sunday
  const todaysEvents = WEEK_EVENTS
    .filter(e => e.dayOffset === todayOffset && !e.allDay)
    .filter(e => peopleFilter.size === 0 || peopleFilter.has(e.who))
    .sort((a, b) => parseTime(a.start) - parseTime(b.start));

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nextIdx = todaysEvents.findIndex(e => parseTime(e.start) >= nowMins);
  const next = nextIdx >= 0 ? todaysEvents[nextIdx] : null;
  const nextPerson = next ? family.find(p => p.id === next.who) : null;

  const tod = timeOfDay(now.getHours());
  const greet = accentFor(tod).greet;

  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const rest = [
    now.toLocaleDateString("en-US", { month: "long" }),
    String(now.getDate())
  ];
  const clockStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  let nextRel = "";
  if (next) {
    const diff = parseTime(next.start) - nowMins;
    if (diff <= 0) nextRel = "now";
    else if (diff < 60) nextRel = `in ${diff} min`;
    else if (diff < 24 * 60) nextRel = `in ${Math.round(diff / 60)}h`;
  }

  return (
    <div className="tile hero">
      <div className="hero-head">
        <div>
          <div className="hero-greet">{greet}, family</div>
          <h1 className="hero-date">
            {weekday}, <em>{rest.join(" ")}</em>
          </h1>
        </div>
        <div className="hero-clock">
          {clockStr}
          <div className="tz">Sunday · Week 16</div>
        </div>
      </div>

      {next ? (
        <div className="hero-next">
          <div>
            <div className="badge">Up next</div>
            <div className="time" style={{ marginTop: 8 }}>
              {fmtTime(next.start)}
              <span className="mins">{nextRel}</span>
            </div>
          </div>
          <div className="sep" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="title" style={{ "--p-color": nextPerson?.color }}>{next.title}</div>
            <div className="who">
              {nextPerson && <Avatar person={nextPerson} size={18} />}
              <span>{nextPerson?.name}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="hero-next">
          <div>
            <div className="badge">All clear</div>
            <div className="title" style={{ marginTop: 10 }}>Nothing else on the calendar today.</div>
          </div>
        </div>
      )}

      <div className="timeline">
        <div className="timeline-head">
          <h3>Today's agenda</h3>
          <span className="count">{todaysEvents.length} {todaysEvents.length === 1 ? "event" : "events"}</span>
        </div>
        {todaysEvents.map((e, i) => {
          const mins = parseTime(e.start);
          const past = mins + 30 < nowMins;
          const isNow = e === next && (mins - nowMins) < 60;
          const p = family.find(x => x.id === e.who);
          return (
            <div key={i} className={"t-row" + (past ? " past" : "") + (isNow ? " now" : "")}
                 style={{ "--p-color": p?.color }}>
              <div className="t-time">{fmtTimeShort(e.start)}</div>
              <div className="t-body">
                <span className="t-dot" />
                <span className="t-title">{e.title}</span>
                <span className="t-who">{p?.name}</span>
              </div>
            </div>
          );
        })}
        {todaysEvents.length === 0 && (
          <div style={{ color: "var(--ink-3)", fontSize: 14, padding: "20px 0" }}>
            No matching events for this filter.
          </div>
        )}
      </div>
    </div>
  );
}

// ----- WEATHER -----
function WeatherTile() {
  const { now, range, forecast } = WEATHER;
  return (
    <div className="tile weather">
      <div className="tile-eyebrow">Weather · Home</div>
      <div className="weather-main">
        <div className="weather-temp">{now.temp}<span className="deg">°</span></div>
        <div className="wicon"><WeatherIcon kind={now.icon} size={64} /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{now.cond}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", fontVariantNumeric: "tabular-nums" }}>
          H {range.hi}° · L {range.lo}°
        </div>
      </div>
      <div className="forecast">
        {forecast.map(f => (
          <div key={f.d}>
            <span className="d">{f.d}</span>
            <span className="ic"><WeatherIcon kind={f.icon} size={22} /></span>
            <span className="t">{f.t}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- MESSAGE -----
function MessageTile({ family }) {
  const [messages, setMessages] = useState2(MESSAGES);
  const [draft, setDraft] = useState2("");
  const feedRef = useRef2(null);

  useEffect2(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages.length]);

  function send() {
    const t = draft.trim();
    if (!t) return;
    setMessages(m => [...m, { who: "krysten", text: t, at: "now" }]);
    setDraft("");
  }

  return (
    <div className="tile message">
      <div className="tile-eyebrow">Family thread</div>
      <div className="msg-feed" ref={feedRef}>
        {messages.map((m, i) => {
          const p = family.find(x => x.id === m.who);
          return (
            <div key={i} className="msg">
              <span className="avatar" style={{ background: p?.color }}>{p?.initial}</span>
              <div className="bubble">
                <div className="meta">
                  <span>{p?.name}</span>
                  <span>{m.at}</span>
                </div>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <form className="msg-compose" onSubmit={e => { e.preventDefault(); send(); }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Message the family…"
        />
        <button className="send" type="submit">Send</button>
      </form>
    </div>
  );
}

// ----- WEEK CALENDAR -----
function WeekTile({ family, peopleFilter, weekOffset, setWeekOffset, today }) {
  const start = new Date(WEEK_START);
  start.setDate(start.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const title = (() => {
    const s = start;
    const e = days[6];
    const mS = s.toLocaleString("en-US", { month: "short" });
    const mE = e.toLocaleString("en-US", { month: "short" });
    if (mS === mE) return `${mS} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`;
    return `${mS} ${s.getDate()} – ${mE} ${e.getDate()}, ${e.getFullYear()}`;
  })();

  const visibleEvents = (offset) => {
    const list = weekOffset === 0
      ? WEEK_EVENTS.filter(e => e.dayOffset === offset)
      : [];
    return list.sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay) return 0;
      return parseTime(a.start) - parseTime(b.start);
    });
  };

  return (
    <div className="tile week" style={{ padding: 0 }}>
      <div className="week-head">
        <h2 className="week-title">{title}</h2>
        <div className="week-nav">
          <button aria-label="Previous week" onClick={() => setWeekOffset(w => w - 1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="10 3 5 8 10 13" /></svg>
          </button>
          <button aria-label="Next week" onClick={() => setWeekOffset(w => w + 1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 3 11 8 6 13" /></svg>
          </button>
        </div>
        {weekOffset !== 0 && (
          <button className="today-btn" onClick={() => setWeekOffset(0)}>Today</button>
        )}
        <div className="grow" />
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
          Tap a person above to filter
        </div>
      </div>
      <div className="week-grid">
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          const events = visibleEvents(i);
          return (
            <div key={i} className={"week-day" + (isToday ? " today" : "")}>
              <div className="day-head">
                <span className="dow">{d.toLocaleString("en-US", { weekday: "short" })}</span>
                <span className="num">{d.getDate()}</span>
              </div>
              {events.map((e, j) => {
                const p = family.find(x => x.id === e.who);
                const dim = peopleFilter.size > 0 && !peopleFilter.has(e.who);
                return (
                  <div
                    key={j}
                    className={"event" + (dim ? " dim" : "")}
                    style={{ "--p-color": p?.color }}
                    title={`${e.title} · ${p?.name}`}
                  >
                    <div className="title">{e.title}</div>
                    <div className="meta">{e.allDay ? "All day" : fmtTime(e.start)}{p ? ` · ${p.name}` : ""}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { HeroTile, WeatherTile, MessageTile, WeekTile });
