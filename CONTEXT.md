# Context

Glossary for the custom-screensaver domain.

## Scene

One self-contained full-screen visual (e.g. Matrix Rain, Starfield Warp, Aurora, Clock, Photos). A Scene owns its own animation and its own cleanup; it knows nothing about other Scenes or about switching.

## Player

The shell that runs Scenes: it shows one Scene at a time, rotates between eligible Scenes on a timer, and crossfades transitions. The Player is the only thing that decides *which* Scene is on screen.

## Locked

Player state in which rotation is paused: the current Scene stays on screen until unlocked or manually switched. Manual switching is allowed while Locked.

## Wallpaper mode

Running the Player as a desktop background (no keyboard/mouse focus): controls are absent and rotation is fully automatic.
