"use client";

import { useMemo, useState } from "react";

type Sample = { id: number; ms: number | null };

const SAMPLE_COUNT = 8;

function quality(ms: number | null) {
  if (ms === null) return { label: "NO SIGNAL", className: "bad" };
  if (ms < 50) return { label: "EXCELLENT", className: "good" };
  if (ms < 100) return { label: "GOOD", className: "good" };
  if (ms < 180) return { label: "FAIR", className: "warn" };
  return { label: "SLOW", className: "bad" };
}

export function PingTerminal() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("READY");

  const successful = samples.flatMap((sample) =>
    sample.ms === null ? [] : [sample.ms],
  );
  const average = successful.length
    ? Math.round(successful.reduce((sum, ms) => sum + ms, 0) / successful.length)
    : null;
  const loss = samples.length
    ? Math.round(((samples.length - successful.length) / samples.length) * 100)
    : 0;
  const result = quality(average);

  const bars = useMemo(() => {
    const values = samples.map((sample) => sample.ms);
    return Array.from({ length: SAMPLE_COUNT }, (_, index) => values[index] ?? undefined);
  }, [samples]);

  async function runTest() {
    if (running) return;
    setRunning(true);
    setSamples([]);
    setStatus("TESTING ROUTE");

    for (let id = 1; id <= SAMPLE_COUNT; id += 1) {
      const started = performance.now();
      let ms: number | null = null;
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`/api/ping?t=${Date.now()}-${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        window.clearTimeout(timeout);
        if (response.ok) ms = Math.max(1, Math.round(performance.now() - started));
      } catch {
        ms = null;
      }
      setSamples((current) => [...current, { id, ms }]);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }

    setStatus("TEST COMPLETE");
    setRunning(false);
  }

  return (
    <main className="shell">
      <div className="scanlines" aria-hidden="true" />
      <header className="topbar">
        <div className="brand" aria-label="Dycem Data Centers">
          <span className="brand-name">Dycem</span>
          <span className="brand-unit">DATA CENTERS</span>
        </div>
        <div className="system-state"><i /> SYSTEM ONLINE</div>
      </header>

      <section className="hero">
        <p className="eyebrow">DYCEM NETWORK UTILITY // v1.0</p>
        <h1>CHECK YOUR<br /><span>CONNECTION.</span></h1>
        <p className="intro">
          Run a quick live latency test from this device to our network edge.
          Eight packets. One clear result.
        </p>
      </section>

      <section className="terminal" aria-live="polite">
        <div className="terminal-head">
          <span>C:\DYCEM\GUEST&gt; PING_TEST.EXE</span>
          <span className="window-controls">— □ ×</span>
        </div>
        <div className="terminal-body">
          <div className="readout">
            <p><span className="prompt">&gt;</span> STATUS <b>[{status}]</b></p>
            <p><span className="prompt">&gt;</span> PACKETS <b>[{samples.length}/{SAMPLE_COUNT}]</b></p>
            <p><span className="prompt">&gt;</span> PACKET LOSS <b>[{loss}%]</b></p>
          </div>

          <div className="result-grid">
            <div className="score">
              <span>AVERAGE LATENCY</span>
              <strong>{average ?? "--"}<small>ms</small></strong>
              <em className={result.className}>[{samples.length ? result.label : "STANDBY"}]</em>
            </div>
            <div className="graph" aria-label="Latency samples chart">
              {bars.map((ms, index) => (
                <div className="bar-slot" key={index}>
                  <span
                    className={ms === null ? "bar failed" : "bar"}
                    style={{ height: ms === undefined ? 0 : ms === null ? "5%" : `${Math.min(100, Math.max(12, ms / 2.2))}%` }}
                  />
                  <small>{ms === undefined ? "·" : ms === null ? "×" : ms}</small>
                </div>
              ))}
            </div>
          </div>

          <button className="run" onClick={runTest} disabled={running}>
            <span>{running ? "TEST IN PROGRESS" : samples.length ? "RUN AGAIN" : "RUN PING TEST"}</span>
            <b>{running ? "···" : "↗"}</b>
          </button>
        </div>
      </section>

      <footer>
        <span>REAL-TIME BROWSER-TO-EDGE ROUND TRIP</span>
        <span>NO DATA STORED // SECURE CONNECTION</span>
      </footer>
    </main>
  );
}
