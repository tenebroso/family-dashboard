// App shell

const { useState: useS, useEffect: useE, useMemo: useM } = React;

const THEMES = ["light", "warm", "dark"];
const TOD_PREVIEW = ["auto", "morning", "afternoon", "evening"];

/*EDITMODE-BEGIN*/const TWEAK_DEFAULTS = {
  "theme": "light",
  "todPreview": "auto"
}/*EDITMODE-END*/;

function applyAccent(tod) {
  const a = accentFor(tod);
  const root = document.documentElement;
  root.style.setProperty("--accent", `oklch(${a.mid} ${a.chroma} ${a.hue})`);
  root.style.setProperty("--accent-ink", `oklch(${a.ink} ${a.chroma} ${a.hue})`);
  root.style.setProperty("--accent-wash", `oklch(${a.wash} ${a.chroma * 0.35} ${a.hue})`);
  root.style.setProperty("--accent-wash-2", `oklch(${a.wash2} ${a.chroma * 0.55} ${a.hue})`);
  root.style.setProperty("--accent-hue", a.hue);
}

function App() {
  // persistent tweaks
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("fd-tweaks") || "{}"); }
    catch { return {}; }
  })();
  const [theme, setTheme] = useS(saved.theme || TWEAK_DEFAULTS.theme);
  const [todPreview, setTodPreview] = useS(saved.todPreview || TWEAK_DEFAULTS.todPreview);
  const [tweaksOpen, setTweaksOpen] = useS(false);

  const [now, setNow] = useS(() => new Date(DEMO_NOW_DEFAULT));
  const [peopleFilter, setPeopleFilter] = useS(() => new Set());
  const [weekOffset, setWeekOffset] = useS(0);

  // persist tweaks
  useE(() => {
    localStorage.setItem("fd-tweaks", JSON.stringify({ theme, todPreview }));
  }, [theme, todPreview]);

  // theme
  useE(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  // time-of-day preview overrides the demo clock
  useE(() => {
    const d = new Date(DEMO_NOW_DEFAULT);
    if (todPreview === "morning")    d.setHours(8, 24);
    else if (todPreview === "afternoon") d.setHours(14, 12);
    else if (todPreview === "evening")  d.setHours(19, 37);
    setNow(d);
  }, [todPreview]);

  // accent driven by current hour
  useE(() => {
    applyAccent(timeOfDay(now.getHours()));
  }, [now]);

  // tick the clock every 30s when "auto" — using demo now so the page looks alive
  useE(() => {
    if (todPreview !== "auto") return;
    const id = setInterval(() => {
      setNow(prev => {
        const d = new Date(prev);
        d.setMinutes(d.getMinutes() + 1);
        return d;
      });
    }, 30000);
    return () => clearInterval(id);
  }, [todPreview]);

  // host tweak protocol
  useE(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setTweaksOpen(true);
      if (d.type === "__deactivate_edit_mode") setTweaksOpen(false);
    }
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function togglePerson(id) {
    setPeopleFilter(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function updateTweak(patch) {
    if ("theme" in patch) setTheme(patch.theme);
    if ("todPreview" in patch) setTodPreview(patch.todPreview);
    window.parent?.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
  }

  return (
    <div className="app" data-screen-label="Family Dashboard">
      <div className="topbar">
        <div className="brand">
          <span className="mark">Home</span>
          <span className="sub">· {FAMILY.map(p => p.name).join(" · ")}</span>
        </div>
        <div className="grow" />
        <PeopleRail
          family={FAMILY}
          selected={peopleFilter}
          onToggle={togglePerson}
          onClear={() => setPeopleFilter(new Set())}
        />
      </div>

      <div className="grid">
        <HeroTile now={now} family={FAMILY} peopleFilter={peopleFilter} />
        <div className="side">
          <WeatherTile />
          <MessageTile family={FAMILY} />
        </div>
        <WeekTile
          family={FAMILY}
          peopleFilter={peopleFilter}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          today={now}
        />
      </div>

      {tweaksOpen && (
        <div className="tweaks-panel" role="dialog" aria-label="Tweaks">
          <h4>Tweaks</h4>
          <div className="row">
            <div className="label">Theme</div>
            <div className="seg">
              {THEMES.map(t => (
                <button key={t} aria-pressed={theme === t} onClick={() => updateTweak({ theme: t })}>{t}</button>
              ))}
            </div>
          </div>
          <div className="row">
            <div className="label">Time of day</div>
            <div className="seg">
              {TOD_PREVIEW.map(t => (
                <button key={t} aria-pressed={todPreview === t} onClick={() => updateTweak({ todPreview: t })}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5, marginTop: 8 }}>
            Accent and greeting shift across morning / afternoon / evening. Set back to <em>auto</em> to follow the clock.
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
