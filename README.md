# Dycem Live Ping

A phone-first, retro-terminal landing page that runs a real-time browser-to-edge latency test. Built for QR-code activations and Dycem Data Centers conversations.

## Features

- Eight live round-trip latency samples
- Average latency, packet-loss percentage, and connection rating
- Animated sample chart
- Responsive Dycem-branded terminal design
- No visitor data storage

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Import this repository into Vercel. The included Next.js API route provides the live edge endpoint used by the test.
