# 2. File System Access folder picker for photos

Date: 2026-07-26

## Status

Accepted

## Context

The Photos Scene needs images. Bundling personal photos into the repo would make them public URLs the moment the site deploys (the site is intended to be publicly deployed, like chetan-examples). Alternatives considered: bundled photos, drag-and-drop per session, remote photo APIs.

## Decision

Photos are read at runtime from a local folder the user picks via the File System Access API (`showDirectoryPicker`). The directory handle is persisted in IndexedDB; after a reload the user re-grants access with one click. The Photos Scene is excluded from auto-rotation until a folder has been picked.

## Consequences

- Photos never leave the machine, even with the site publicly deployed.
- Chrome/Edge only; other browsers see a notice and the Scene stays out of rotation.
- One-click re-grant friction after each browser restart (a user gesture is required by the API).
