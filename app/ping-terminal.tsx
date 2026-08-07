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
          Send eight cache-bypassed HTTPS probes from this device to the nearest
          Vercel edge region. We report client-observed round-trip latency and loss.
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

          <details className="methodology">
            <summary>TEST METHODOLOGY <span>[EXPAND]</span></summary>
            <div className="method-grid">
              <p><span>TRANSPORT</span><b>HTTPS GET /api/ping</b></p>
              <p><span>SAMPLE SET</span><b>8 sequential probes</b></p>
              <p><span>CACHE</span><b>Bypassed + unique token</b></p>
              <p><span>TIMEOUT</span><b>5,000 ms per probe</b></p>
              <p><span>METRIC</span><b>Client wall-clock RTT</b></p>
              <p><span>LOSS</span><b>Failed / aborted requests</b></p>
            </div>
            <p className="method-note">
              This is application-layer HTTP latency, not ICMP ping. Results may
              include connection setup, TLS, HTTP processing, browser scheduling,
              and the network path to the hosting edge. It does not test Dycem’s
              corporate network or data-center infrastructure.
            </p>
          </details>
        </div>
      </section>

      <footer>
        <span>CLIENT-OBSERVED HTTPS RTT // NEAREST VERCEL EDGE</span>
        <span>NO DATA STORED // SECURE CONNECTION</span>
      </footer>

      <details className="packet-egg">
        <summary aria-label="Open hidden keyboard easter egg">
          <span className="packet-glyph" aria-hidden="true"><i /><i /><i /></span>
        </summary>
        <div className="keyboard-secret">
          <p>&gt; UNAUTHORIZED INPUT DEVICE DETECTED_</p>
          <pre>{`┌──────────────────────────────────┐
│ ESC  1  2  3  4  5  6  7  8  9 │
│ TAB   Q  W  E  R  T  Y  U  I  O │
│ CAPS   A  S  D  F  G  H  J  K   │
│ SHIFT   Z  X  C  V  B  N  M  ↵  │
│       [ DYCEM TERMINAL ]         │
└──────────────────────────────────┘`}</pre>
          <small>PACKET ACCEPTED // NICE FIND</small>
        </div>
      </details>
    </main>
  );
}
