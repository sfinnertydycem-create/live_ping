"use client";

import { useMemo, useState } from "react";

type Sample = { id: number; ms: number | null };
type TestResult = { id: number; time: string; average: number | null; loss: number; label: string; samples: Sample[] };

const SAMPLE_COUNT = 8;
const DATA_CENTERS_URL = "https://dycem.com/industry/data-centers/";

function quality(ms: number | null) {
  if (ms === null) return { label: "NO SIGNAL", className: "bad" };
  if (ms < 50) return { label: "EXCELLENT", className: "good" };
  if (ms < 100) return { label: "GOOD", className: "good" };
  if (ms < 180) return { label: "FAIR", className: "warn" };
  return { label: "SLOW", className: "bad" };
}

function summarize(samples: Sample[]) {
  const successful = samples.flatMap((sample) => sample.ms === null ? [] : [sample.ms]);
  const average = successful.length ? Math.round(successful.reduce((sum, ms) => sum + ms, 0) / successful.length) : null;
  const loss = samples.length ? Math.round(((samples.length - successful.length) / samples.length) * 100) : 0;
  return { average, loss, result: quality(average) };
}

export function PingTerminal() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const { average, loss, result } = summarize(samples);
  const complete = samples.length === SAMPLE_COUNT && !running;
  const bars = useMemo(() => Array.from({ length: SAMPLE_COUNT }, (_, index) => samples[index]?.ms), [samples]);

  async function runTest() {
    if (running) return;
    setRunning(true);
    setSamples([]);
    const completedSamples: Sample[] = [];

    for (let id = 1; id <= SAMPLE_COUNT; id += 1) {
      const started = performance.now();
      let ms: number | null = null;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`/api/ping?t=${Date.now()}-${id}`, { cache: "no-store", signal: controller.signal });
        if (response.ok) ms = Math.max(1, Math.round(performance.now() - started));
      } catch {
        ms = null;
      } finally {
        window.clearTimeout(timeout);
      }
      const sample = { id, ms };
      completedSamples.push(sample);
      setSamples([...completedSamples]);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }

    const summary = summarize(completedSamples);
    setHistory((current) => [{ id: current.length + 1, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), average: summary.average, loss: summary.loss, label: summary.result.label, samples: completedSamples }, ...current]);
    setRunning(false);
  }

  return (
    <main>
      <header className="site-header">
        <a className="logo" href={DATA_CENTERS_URL} target="_blank" rel="noreferrer" aria-label="Dycem Data Centers">
          <img src="/E6717-Dycem-DataCentre-Logo-RGB-White-Dycem.png" alt="Dycem Data Centers" />
        </a>
        <span className="header-note">LIVE NETWORK UTILITY</span>
      </header>

      <section className="hero-grid">
        <div className="hero-copy dot-field">
          <p className="kicker">DYCEM DATA CENTERS / CONNECTION TEST</p>
          <h1>Keep Your<br />Connection <em>Running.</em></h1>
          <p>Check this device’s live connection to the nearest hosting edge with eight real-time HTTPS probes.</p>
        </div>

        <div className="test-panel" aria-live="polite">
          <div className="panel-top"><span>LIVE CONNECTION TEST</span><b className={running ? "pulse" : ""}>{running ? "TESTING" : complete ? "COMPLETE" : "READY"}</b></div>
          <div className="metrics">
            <div className="main-metric"><span>AVERAGE LATENCY</span><strong>{average ?? "--"}<small>ms</small></strong><em className={result.className}>{samples.length ? result.label : "STANDBY"}</em></div>
            <div className="side-metrics"><p><span>PROBES</span><b>{samples.length}/{SAMPLE_COUNT}</b></p><p><span>PACKET LOSS</span><b>{loss}%</b></p></div>
          </div>
          <div className="graph" aria-label="Latency samples chart">
            {bars.map((ms, index) => <div className="bar-slot" key={index}><span className={ms === null ? "bar failed" : "bar"} style={{ height: ms === undefined ? 0 : ms === null ? "5%" : `${Math.min(100, Math.max(12, ms / 2.2))}%` }} /><small>{ms === undefined ? "·" : ms === null ? "×" : ms}</small></div>)}
          </div>
          {!complete ? (
            <button className="primary full" onClick={runTest} disabled={running}>{running ? "TEST IN PROGRESS" : "RUN CONNECTION TEST"}<span>↘</span></button>
          ) : (
            <div className="actions"><button className="primary" onClick={runTest}>RUN AGAIN <span>↻</span></button><a className="secondary" href={DATA_CENTERS_URL} target="_blank" rel="noreferrer">KEEP RUNNING FASTER <span>↘</span></a></div>
          )}
          <p className="privacy">NO DATA STORED / HISTORY CLEARS WHEN THIS PAGE CLOSES</p>
        </div>
      </section>

      <section className="history-section">
        <div className="section-title dot-field"><p>YOUR SESSION</p><h2>Connection Test <em>History</em></h2></div>
        <div className="history-list">
          {!history.length ? <div className="empty"><span>01</span><p>Your completed tests will appear here.</p></div> : history.map((test) => (
            <article className="history-card" key={test.id}>
              <div className="test-index"><span>TEST</span><b>{String(test.id).padStart(2, "0")}</b></div>
              <div className="history-stat"><span>TIME</span><b>{test.time}</b></div>
              <div className="history-stat"><span>AVERAGE</span><b>{test.average ?? "--"} ms</b></div>
              <div className="history-stat"><span>LOSS</span><b>{test.loss}%</b></div>
              <div className="history-stat"><span>RESULT</span><b className={quality(test.average).className}>{test.label}</b></div>
              <div className="sample-row" aria-label="Individual readings">{test.samples.map((sample) => <i key={sample.id}>{sample.ms === null ? "×" : sample.ms}</i>)}</div>
            </article>
          ))}
        </div>
      </section>

      <footer><span>DYCEM® DATA CENTERS</span><span>CLIENT-OBSERVED HTTPS ROUND-TRIP TIME</span></footer>
    </main>
  );
}


