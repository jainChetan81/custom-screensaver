# 1. Standalone Vite static app, not part of chetan-examples

Date: 2026-07-26

## Status

Accepted

## Context

A Matrix rain animation already exists as a page in the `jainChetan81/examples` Next.js site. The screensaver could have been added there as more pages, or built as its own project. The screensaver needs no SSR, routing, or data fetching — it is one full-screen page with client-side animation — and it will be pointed at by wallpaper/screensaver wrappers (Plash, WebViewScreenSaver) that just load a URL.

## Decision

Build a standalone Vite + TypeScript static app in its own repo (`custom-screensaver`), with no UI framework. The existing Matrix rain is ported in as a Scene rather than shared with the examples repo.

## Consequences

- Zero framework baggage; the whole app is a static `dist/` deployable anywhere.
- The Matrix rain code now exists in two places; the examples repo copy is frozen, this repo's copy is canonical for the screensaver.
- A separate deploy/URL from chetan-examples.
