# Implementation Plan: Todo List Dashboard

## Overview

Implement a standalone, zero-dependency personal productivity dashboard as a single `index.html` + `css/style.css` + `js/app.js` triple. The JavaScript is structured with the **Revealing Module Pattern** under an `App` namespace. Each module is implemented in order of dependency — shared utilities first, then widgets. Property-based tests use **fast-check** loaded via a CDN script tag in a separate `tests/app.test.html` file (no build tools required).

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with semantic landmark regions (`<header>`, `<main>`, four `<section>` elements) and `id` attributes matching each widget's expected root element
  - Add `<link>` to `css/style.css` and `<script defer>` to `js/app.js`
  - Create `css/style.css` with CSS custom properties for colour tokens, layout grid, and widget card styles — ensure 4.5:1 contrast ratio for all text/background pairs
  - Create `js/app.js` with the `App` namespace object and a `DOMContentLoaded` entry point that calls each widget's `init()` in order
  - Create `tests/app.test.html` with a `<script src="https://cdn.jsdelivr.net/npm/fast-check/lib/bundle/fast-check.js">` tag and a minimal self-running harness that logs pass/fail to the console
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.3, 7.4_

- [x] 2. Implement `StorageService`
  - [x] 2.1 Implement `StorageService.load(key)`, `StorageService.save(key, data)`, and `StorageService.remove(key)` inside `js/app.js`
    - Wrap `JSON.parse` in `try/catch`; on error log to console, call `remove(key)`, return `null`
    - Wrap `localStorage.setItem` in `try/catch`; on `QuotaExceededError` log to console and dispatch `new CustomEvent('storage:quota-exceeded', { detail: { key } })` on `document`
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

  - [ ]* 2.2 Write property test for Task persistence round-trip (Property 1)
    - **Property 1: Task persistence round-trip**
    - **Validates: Requirements 4.10, 4.11, 6.1, 6.3, 6.4**
    - In `tests/app.test.html`: generate arbitrary `Task[]` arrays with `fc.array(arbitraryTask)`, call `StorageService.save` then `StorageService.load`, assert deep equality

  - [ ]* 2.3 Write property test for Link persistence round-trip (Property 2)
    - **Property 2: Link persistence round-trip**
    - **Validates: Requirements 5.7, 5.8, 6.2, 6.3, 6.4**
    - Generate arbitrary `Link[]` arrays; save → load → deep equal

  - [ ]* 2.4 Write property test for corrupted localStorage (Property 10)
    - **Property 10: Corrupted localStorage yields empty state**
    - **Validates: Requirements 4.13, 5.10, 6.5**
    - Generate non-JSON strings via `fc.string().filter(s => { try { JSON.parse(s); return false; } catch { return true; } })`; manually set `localStorage.setItem(key, s)`, call `StorageService.load(key)`, assert result is `null`

- [x] 3. Implement `DateUtils`
  - [x] 3.1 Implement `DateUtils.formatTime(date)`, `DateUtils.formatDate(date)`, `DateUtils.getTimeOfDay(date)`, and `DateUtils.isValidDate(date)` inside `js/app.js`
    - `formatTime` → `"HH:MM"` (24-hour, zero-padded)
    - `formatDate` → `"Weekday, D Month YYYY"` using `Intl.DateTimeFormat` or manual arrays
    - `getTimeOfDay` → `"Morning"` for hours 05–11, `"Afternoon"` for 12–17, `"Evening"` for 18–23 and 00–04
    - `isValidDate` → `!isNaN(date.getTime())`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Write property test for greeting time-of-day mapping (Property 9)
    - **Property 9: Greeting time-of-day mapping is exhaustive and disjoint**
    - **Validates: Requirements 2.3, 2.4, 2.5**
    - `fc.integer({ min: 0, max: 23 })` → construct a `Date` with that hour → assert result is exactly one of `["Morning","Afternoon","Evening"]` and matches the correct hour bracket

- [x] 4. Implement `GreetingWidget`
  - [x] 4.1 Implement `GreetingWidget.init()` and `GreetingWidget.render()` inside `js/app.js`
    - `render()` reads `new Date()`, calls `DateUtils.isValidDate`; if invalid display `"--:--"` / `"Date unavailable"` and omit greeting
    - `init()` calls `render()` immediately then sets a `setInterval` of 60 000 ms that calls `render()`
    - Bind the `storage:quota-exceeded` event to show an inline error when the detail key matches this widget
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement `FocusTimerWidget`
  - [x] 5.1 Implement the in-memory state object `{ remaining: 1500, running: false, intervalId: null }` and `FocusTimerWidget.render()` inside `js/app.js`
    - `render()` formats `remaining` as `MM:SS` and toggles `disabled` attributes on Start/Stop buttons per the running flag
    - _Requirements: 3.1, 3.2, 3.4, 3.8_

  - [x] 5.2 Implement `FocusTimerWidget.tick()`, `FocusTimerWidget.start()`, `FocusTimerWidget.stop()`, and `FocusTimerWidget.reset()`
    - `tick()` decrements `remaining` by 1, calls `render()`, and when `remaining === 0` stops the interval and displays the completion indicator for ≥ 3 seconds
    - `start()` guards against duplicate calls via `running` flag; clears any existing interval before creating a new one
    - `stop()` clears interval, sets `running = false`, calls `render()`
    - `reset()` clears interval, sets state to `{ remaining: 1500, running: false, intervalId: null }`, calls `render()`
    - `init()` calls `render()` and binds click events on Start, Stop, Reset buttons
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 3.11_

  - [ ]* 5.3 Write property test for Focus Timer decrement bounds (Property 11)
    - **Property 11: Focus Timer decrement preserves bounds**
    - **Validates: Requirements 3.3, 3.7**
    - `fc.integer({ min: 1, max: 1500 })` → set `state.remaining` to that value → call `tick()` → assert `remaining === original - 1` and `remaining >= 0`

  - [ ]* 5.4 Write property test for Focus Timer reset idempotency (Property 12)
    - **Property 12: Focus Timer reset is idempotent from any state**
    - **Validates: Requirements 3.6, 3.11**
    - Generate arbitrary timer states with `fc.record({ remaining: fc.integer({min:0,max:1500}), running: fc.boolean() })` → call `reset()` → assert `{ remaining: 1500, running: false, intervalId: null }`

- [x] 6. Checkpoint — storage, utilities, and timer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `TodoListWidget`
  - [x] 7.1 Implement `TodoListWidget.init()`, `TodoListWidget.persist()`, and `TodoListWidget.renderList()` inside `js/app.js`
    - `init()` loads tasks from `StorageService.load("todo-list-dashboard:tasks")`, falls back to `[]` on `null`, calls `renderList()`, binds the Add button and Enter-key event on the input
    - `renderList()` performs a full DOM re-render of the task list; renders an empty state message when the array is empty; applies strikethrough style to completed tasks
    - `persist()` calls `StorageService.save("todo-list-dashboard:tasks", tasks)`
    - Bind the `storage:quota-exceeded` event to render an inline error in the widget
    - _Requirements: 4.1, 4.11, 4.12, 4.13, 6.1, 6.6_

  - [x] 7.2 Implement `TodoListWidget.addTask(title)`, `TodoListWidget.editTask(id, title)`, `TodoListWidget.toggleTask(id)`, and `TodoListWidget.deleteTask(id)`
    - `addTask`: trims input; if blank show `<span role="alert">"Please enter a task title."</span>` and return; otherwise create `{ id: crypto.randomUUID?.() ?? Date.now().toString(), title, completed: false }`, push, persist, renderList, clear input
    - `editTask`: trims input; if blank show `<span role="alert">"Task title cannot be empty."</span>` and leave title unchanged; otherwise update title, persist, renderList
    - `toggleTask`: flips `completed` on matched id, persist, renderList
    - `deleteTask`: splices matched id, persist, renderList
    - Render each task with edit, cancel, confirm, toggle, and delete controls; pre-populate edit field with current title; cancel preserves original title
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 7.3 Write property test for task whitespace-title rejection on add (Property 3)
    - **Property 3: Task whitespace-title rejection**
    - **Validates: Requirements 4.3**
    - `fc.string().filter(s => s.trim() === "")` → call `addTask(s)` → assert task array length unchanged

  - [ ]* 7.4 Write property test for task edit whitespace rejection (Property 4)
    - **Property 4: Task edit whitespace rejection**
    - **Validates: Requirements 4.6**
    - Seed one task, generate whitespace string → call `editTask(id, s)` → assert task title unchanged

  - [ ]* 7.5 Write property test for task completion toggle inverse (Property 5)
    - **Property 5: Task completion toggle is its own inverse**
    - **Validates: Requirements 4.8**
    - Generate arbitrary task with `fc.boolean()` as initial `completed` → `toggleTask` twice → assert `completed === original`

- [x] 8. Implement `QuickLinksWidget`
  - [~] 8.1 Implement `QuickLinksWidget.init()`, `QuickLinksWidget.persist()`, and `QuickLinksWidget.renderLinks()` inside `js/app.js`
    - `init()` loads links from `StorageService.load("todo-list-dashboard:links")`, falls back to `[]` on `null`; on corrupted data (non-null, non-array) shows inline error "The saved links could not be loaded.", calls `renderLinks()`, binds the add-link form controls
    - `renderLinks()` full DOM re-render; each link renders as `<a target="_blank" rel="noopener noreferrer">` button displaying the label; includes a delete control per link
    - `persist()` calls `StorageService.save("todo-list-dashboard:links", links)`
    - Bind `storage:quota-exceeded` event to render inline error
    - _Requirements: 5.5, 5.8, 5.9, 5.10, 6.2, 6.6_

  - [x] 8.2 Implement `QuickLinksWidget.addLink(label, url)` and `QuickLinksWidget.deleteLink(id)`
    - `addLink`: trim both fields; blank label → `<span role="alert">"Please enter a label for this link."</span>`; blank URL → `<span role="alert">"Please enter a URL for this link."</span>`; URL not starting with `http://` or `https://` → `<span role="alert">"URL must start with http:// or https://"</span>`; links.length ≥ 50 → `<span role="alert">"Maximum of 50 links reached."</span>`; otherwise create `{ id, label, url }`, push, persist, renderLinks, clear fields
    - `deleteLink`: splice matched id, persist, renderLinks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 5.11, 5.12_

  - [ ]* 8.3 Write property test for link URL protocol rejection (Property 6)
    - **Property 6: Link URL protocol validation**
    - **Validates: Requirements 5.4**
    - `fc.string().filter(s => !s.startsWith("http://") && !s.startsWith("https://"))` → `addLink("label", s)` → assert link array unchanged

  - [ ]* 8.4 Write property test for link whitespace field rejection (Property 7)
    - **Property 7: Link whitespace field rejection**
    - **Validates: Requirements 5.3**
    - Generate whitespace strings for label or URL (or both) → `addLink(label, url)` → assert link array unchanged

  - [ ]* 8.5 Write property test for link count cap (Property 8)
    - **Property 8: Link count cap enforcement**
    - **Validates: Requirements 5.11**
    - Seed links array with exactly 50 valid entries → `addLink(validLabel, validUrl)` → assert `links.length === 50`

- [x] 9. Checkpoint — TodoListWidget and QuickLinksWidget
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Wire all widgets and polish
  - [~] 10.1 Connect `storage:quota-exceeded` event listeners in each widget to their respective inline error `<span role="alert">` elements
    - Verify each widget renders and clears the quota error correctly
    - _Requirements: 6.6_

  - [x] 10.2 Audit accessibility of all interactive controls
    - Ensure every `<button>` and `<input>` has a visible label, `aria-label`, or `aria-labelledby`
    - Ensure all inline validation messages use `role="alert"`
    - Ensure tab order follows visual reading order
    - _Requirements: 1.6_

  - [x] 10.3 Verify `file://` compatibility and no external network requests
    - Confirm no `fetch`, `XMLHttpRequest`, or CDN calls exist in `index.html` or `js/app.js` (the test file CDN is test-only)
    - Confirm all asset paths are relative
    - _Requirements: 7.3, 7.4_

- [x] 11. Final checkpoint — full application
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional — skip them for a faster MVP build
- `tests/app.test.html` is a test-only file and is never loaded by the main application
- fast-check is loaded from CDN in the test file only; the main app has zero network dependencies
- Each property test is tagged with a comment: `// Feature: todo-list-dashboard, Property N: <description>`
- Checkpoints at tasks 6, 9, and 11 serve as integration gates before moving to the next module group
- All validation messages are rendered as `<span role="alert">` and cleared on the next input event

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4", "7.1", "8.1"] },
    { "id": 6, "tasks": ["7.2", "8.2"] },
    { "id": 7, "tasks": ["7.3", "7.4", "7.5", "8.3", "8.4", "8.5"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3"] }
  ]
}
```
