# OpenC5 — N-Degree Relationship Diagram Generator

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Demo: GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-informational)

A single-file, dependency-free web app that generalizes the classic "circle of fifths" into a configurable N-degree ring diagram generator.

## Introduction

OpenC5 takes the circle-of-fifths idea and generalizes it into a configurable ring diagram. Instead of being limited to a single music-theory layout, it lets you build 1–99 concentric rings, choose what each ring is divided into, and rotate every ring independently. It is useful for music theory, traditional culture, astronomy, and other cyclic or relationship-based visualizations.

## Features

- Multi-ring layout: 1–99 concentric rings, each configured independently.
- 11 preset segment types: Manual input, Heavenly Stems, Earthly Branches, 24 Solar Terms, Earlier Heaven Bagua, Later Heaven Bagua, Meridian hours (Ziwu Liuzhu), Major keys (circle of fifths), Minor keys, Zodiac signs, and Chinese zodiac animals.
- Two segment display modes per ring: solid color or multi-colored segments.
- Interactive rotation: drag a ring to rotate it, or use the angle slider / numeric input.
- Real-time SVG preview.
- Legend: on/off toggle with position options (right / bottom-right).
- Configuration management: export and import JSON configuration.
- Export: copy the SVG source to the clipboard or download an SVG file (SVG only, no PNG).
- Internationalization: Chinese / English interface switch.
- Themes: light / dark / follow system.
- Responsive layout with mobile touch support.
- Settings are persisted with `localStorage`.

## Live Demo

https://fengdonglu.github.io/OpenC5/

## Quick Start

Open the app directly in a browser:

```text
Open index.html in any modern browser.
```

Or serve the folder over HTTP (recommended so that clipboard and `localStorage` behave consistently):

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Usage

### Basic parameters

Set the number of rings (1–99), choose the display mode (solid color or multi-colored segments), and adjust the overall angle. Each ring is configured independently.

### Ring configuration

For every ring you can pick a preset segment type, edit the segment labels, choose colors, and set the rotation angle.

### Presets

Use one of the 11 built-in preset segment types (see the table below) or type a fully custom list of segments.

### Rotation

Rotate a ring by dragging it in the preview, or by using the angle slider / numeric input.

### Export

Copy the generated SVG source to the clipboard, or download it as an `.svg` file. A real exported sample is available at `examples/sample-export-zodiac.svg`.

### Configuration import / export

Save the full configuration as JSON and import it back later to restore a diagram.

### Mobile

The layout is responsive and supports touch interactions.

## Preset Segment Types

| # | Preset segment type |
| --- | --- |
| 1 | Manual input |
| 2 | Heavenly Stems |
| 3 | Earthly Branches |
| 4 | 24 Solar Terms |
| 5 | Earlier Heaven Bagua |
| 6 | Later Heaven Bagua |
| 7 | Meridian hours (Ziwu Liuzhu) |
| 8 | Major keys (circle of fifths) |
| 9 | Minor keys |
| 10 | Zodiac signs |
| 11 | Chinese zodiac animals |

## Architecture

OpenC5 is a single-file application. All HTML, CSS, and JavaScript live in `index.html`. It has zero dependencies and no build step. The JavaScript is written as plain object-literal modules in vanilla JavaScript — there is no framework (no Vue), no class hierarchy, and no bundler. The diagram is rendered directly to SVG, and settings are persisted in `localStorage`.

## Browser Compatibility

OpenC5 targets modern evergreen browsers (recent Chrome, Edge, Firefox, and Safari). It relies on standard SVG rendering, `localStorage`, the Clipboard API, and `prefers-color-scheme` for the "follow system" theme. Exact behavior may vary in older browsers that do not support these features.

## RoadMap

The following items are **Planned / Not yet implemented**:

- Dedicated music circle-of-fifths mode: start key / direction / start angle, number of accidentals, enharmonic spelling (F♯/G♭), note-name systems (English/German H-B/Chinese), relative major-minor links, ii–V–I progression paths, and fourth-cycle arrows (Planned / Not yet implemented).
- General N-node ring mode: configurable step k, node grouping colors, and directed/undirected/weighted edges (Planned / Not yet implemented).
- PNG / PDF export via offscreen Canvas rendering (Planned / Not yet implemented).
- Preset management UI: rename / delete / import / export (Planned / Not yet implemented).
- Accessibility improvements: full ARIA, keyboard navigation, and screen-reader descriptions (Planned / Not yet implemented).
- Unit tests / visual regression / end-to-end tests (Planned / Not yet implemented).
- Plugin system, PWA offline mode, and more presets (planets, elements, etc.) (Planned / Not yet implemented).

## License

MIT © 2025 fengdonglu. See [LICENSE](LICENSE).

## Vibe Coding

> This project was built through Vibe Coding — the author did not hand-write any code. The entire codebase was generated by AI agents driven purely by natural-language instructions.

## Repository

Back to the repository: https://github.com/fengdonglu/OpenC5
