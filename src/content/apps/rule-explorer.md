---
title: Rule Explorer
summary: Explore elementary cellular automata. Pick a rule from 0 to 255, edit its rule table directly, and watch the pattern it generates.
status: experiment
interaction: Edit the rule table or type a rule number, then replay the pattern.
entryComponent: rule-explorer
categories: [Generative, Algorithms]
updated: 2026-10-12
featured: false
sourceUrl: https://github.com/sawyer-dev/Sawyersite/tree/main/src/app-registry/rule-explorer
limitations:
  - The grid is a fixed 81 cells wide and 48 generations tall, and the edges wrap around.
  - Settings are not saved or shareable. Reloading the page resets the app.
  - The pattern image is a single graphic with a text description, not a cell-by-cell readable grid.
---

## What it does

An elementary cellular automaton is a row of cells that are either on or off. Each cell's next state depends only on itself and its two neighbours, so there are eight possible neighbourhoods. A rule is a choice of on or off for each, which gives 256 possible rules.

Each row below is the next generation of the row above it.

## How to use it

1. Type a rule number, or choose a preset.
2. Or change the **rule table**: each button shows a neighbourhood and the cell it produces. Activate one to flip its result and the rule number updates to match.
3. Pick a starting row: a single cell, or a random row.
4. Use **Replay** to watch the pattern grow, and **Reset** to return to rule 30 with a single cell.

Some rules to try: 30 looks chaotic, 90 draws a Sierpinski triangle, and 110 is known to be Turing complete.

## Technical notes

The simulation is a small pure TypeScript module with unit tests, and the pattern is drawn as one SVG path with horizontal runs merged. The interface is a React component loaded on demand, and it runs entirely in your browser.
