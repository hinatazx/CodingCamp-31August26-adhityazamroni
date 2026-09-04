# Requirements Document

## Introduction

The Todo List Dashboard is a standalone client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a clean, minimal personal productivity dashboard that runs entirely in the browser with no backend server. The dashboard combines four key widgets: a time-aware greeting, a Pomodoro-style focus timer, a persistent to-do list, and a quick-launch links panel. All user data is persisted using the browser's Local Storage API.

## Glossary

- **Dashboard**: The single-page web application that contains all four productivity widgets.
- **Greeting_Widget**: The UI component that displays the current date, time, and a contextual greeting.
- **Focus_Timer**: The UI component implementing a 25-minute Pomodoro-style countdown timer.
- **Todo_List**: The UI component for managing tasks (add, edit, complete, delete).
- **Quick_Links**: The UI component for storing and launching user-defined bookmark links.
- **Task**: A single to-do item containing a title and a completion status.
- **Link**: A user-defined entry containing a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Session**: A single continuous 25-minute countdown interval of the Focus_Timer.
- **Time_Of_Day**: The period determined by the current hour — Morning (05:00–11:59), Afternoon (12:00–17:59), Evening (18:00–04:59).

---

## Requirements

### Requirement 1: General Application Structure

**User Story:** As a user, I want a single-page dashboard that loads instantly in any modern browser, so that I can access all productivity tools without any installation or setup.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a single HTML file with exactly one linked CSS file located in `css/` and exactly one linked JavaScript file located in `js/`.
2. THE Dashboard SHALL run without a backend server, build tools, or external framework dependencies.
3. THE Dashboard SHALL be compatible with current stable versions of Chrome, Firefox, Edge, and Safari.
4. WHEN the Dashboard is opened in a browser, THE Dashboard SHALL fully render all four widgets without requiring any user configuration.
5. WHEN the Dashboard is opened in a browser, THE Dashboard SHALL complete initial render and display all four widgets within 3 seconds on a standard desktop connection.
6. THE Dashboard SHALL maintain a minimum contrast ratio of 4.5:1 between heading, label, and body text and their respective backgrounds, as measured against the WCAG 2.1 AA standard.

---

### Requirement 2: Greeting Widget

**User Story:** As a user, I want to see the current date, time, and a greeting based on the time of day, so that I feel welcomed and stay oriented to the current moment.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in 24-hour HH:MM format immediately on load and update the displayed time every 60 seconds thereafter.
2. THE Greeting_Widget SHALL display the current date in a human-readable format including the full weekday name, day, month, and year (e.g., "Monday, 2 June 2025").
3. IF the current hour is between 05 and 11 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
4. IF the current hour is between 12 and 17 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. IF the current hour is between 18 and 23 or between 0 and 4 (inclusive), THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
6. THE Greeting_Widget SHALL derive the current time and date from the browser's native `Date` API without any external time service.
7. IF the browser's native `Date` API returns an invalid or unavailable value, THEN THE Greeting_Widget SHALL display a placeholder indicating the time and date are unavailable and omit the greeting.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can work in focused Pomodoro sessions without distractions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00) each time the Dashboard is loaded.
2. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.
3. WHEN the Start button is activated, THE Focus_Timer SHALL begin decrementing the displayed time by one second every 1000 milliseconds.
4. WHILE a Session is running, THE Focus_Timer SHALL disable the Start button and enable the Stop button.
5. WHEN the Stop button is activated during a running Session, THE Focus_Timer SHALL pause the countdown and retain the current remaining time value.
6. WHEN the Reset button is activated at any time, THE Focus_Timer SHALL stop any running countdown and restore the displayed time to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically, disable the Stop button, enable the Start button, and display a non-dismissible completion indicator visible within the timer area for no less than 3 seconds.
8. WHILE no Session is running, THE Focus_Timer SHALL enable the Start button and disable the Stop button.
9. THE Focus_Timer SHALL use `setInterval` or `setTimeout` for countdown logic and SHALL NOT depend on server-side timing.
10. IF the Start button is activated while a Session is already running, THE Focus_Timer SHALL ignore the activation and retain the current countdown state without resetting or duplicating the interval.
11. WHEN the Reset button is activated, THE Focus_Timer SHALL restore the Start button to enabled state and the Stop button to disabled state.

---

### Requirement 4: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks that persist across browser sessions, so that I can track my work reliably without losing data on page reload.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field and an Add button for creating new Tasks.
2. WHEN the Add button is activated and the input field contains at least one non-whitespace character, THE Todo_List SHALL create a new Task with the trimmed input text and a completion status of false, then clear the input field.
3. IF the Add button is activated and the input field is empty or contains only whitespace characters, THEN THE Todo_List SHALL not create a Task and SHALL display an inline validation message prompting the user to enter a task title.
4. WHEN a Task's edit control is activated, THE Todo_List SHALL render the Task title as an editable field pre-populated with the current title.
5. WHEN the user confirms a Task edit and the edited field contains at least one non-whitespace character, THE Todo_List SHALL update the Task title to the new trimmed value and return the Task to its non-editing display state.
6. IF the user confirms a Task edit and the edited field is empty or contains only whitespace characters, THEN THE Todo_List SHALL not update the Task title and SHALL display an inline validation message prompting the user to enter a task title.
7. IF the user cancels a Task edit, THEN THE Todo_List SHALL discard all changes and return the Task to its non-editing display state with the original title preserved.
8. WHEN the user activates a Task's completion toggle, THE Todo_List SHALL update the Task's completion status to its logical opposite and apply a visual distinction (e.g., strikethrough) to completed Tasks.
9. WHEN a Task's delete control is activated, THE Todo_List SHALL remove that Task from the list permanently.
10. WHEN any Task is created, updated, toggled, or deleted, THE Todo_List SHALL serialise the full Task array to Local_Storage under a consistent key.
11. WHEN the Dashboard is loaded, THE Todo_List SHALL read the Task array from Local_Storage and render all previously saved Tasks in their persisted state.
12. IF no Task data exists in Local_Storage on load, THEN THE Todo_List SHALL render an empty list with no error.
13. IF the data retrieved from Local_Storage on load is not a valid Task array, THEN THE Todo_List SHALL discard the corrupted data and render an empty list.

---

### Requirement 5: Quick Links

**User Story:** As a user, I want to save and launch my favourite websites from the dashboard, so that I can navigate to frequently visited pages with a single click.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide an interface for adding a new Link consisting of a label field accepting up to 100 characters and a URL field accepting up to 2048 characters.
2. WHEN the add-link control is activated and both the label field and the URL field contain at least one non-whitespace character and the URL field contains a value beginning with "http://" or "https://", THE Quick_Links SHALL create a new Link entry and render it as a clickable button displaying the label text.
3. IF the add-link control is activated and the label field or the URL field is empty or contains only whitespace characters, THEN THE Quick_Links SHALL not create a Link and SHALL display an inline validation message identifying the missing field.
4. IF the add-link control is activated and the URL field contains a value that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL not create a Link and SHALL display an inline validation message indicating the URL field requires a valid web address.
5. WHEN a Link button is activated, THE Quick_Links SHALL open the Link's URL in a new browser tab without navigating away from the Dashboard.
6. WHEN a Link's delete control is activated, THE Quick_Links SHALL remove that Link from the panel permanently and update Local_Storage to reflect the removal.
7. WHEN any Link is created or deleted, THE Quick_Links SHALL serialise the full Link array to Local_Storage under a consistent key within 500 milliseconds of the triggering action.
8. WHEN the Dashboard is loaded, THE Quick_Links SHALL read the Link array from Local_Storage and render all previously saved Links as clickable buttons within 500 milliseconds of the load event.
9. IF no Link data exists in Local_Storage on load, THEN THE Quick_Links SHALL render an empty links panel with no error.
10. IF Local_Storage contains data under the Quick_Links key that cannot be parsed as a valid Link array on load, THEN THE Quick_Links SHALL discard the corrupted data, render an empty links panel, and display an inline error message indicating the saved links could not be loaded.
11. THE Quick_Links SHALL support storing a maximum of 50 Links, and IF the add-link control is activated when 50 Links already exist, THEN THE Quick_Links SHALL not create a new Link and SHALL display an inline message indicating the maximum number of links has been reached.
12. THE Quick_Links SHALL store each Link as an object containing a `label` string and a `url` string.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want all my tasks and links to be saved automatically, so that my data is never lost when I close or refresh the browser tab.

#### Acceptance Criteria

1. THE Dashboard SHALL persist all Task data in Local_Storage under the key `"todo-list-dashboard:tasks"`.
2. THE Dashboard SHALL persist all Link data in Local_Storage under the key `"todo-list-dashboard:links"`.
3. WHEN data is written to Local_Storage, THE Dashboard SHALL serialise it as a JSON string using `JSON.stringify`.
4. WHEN the Dashboard initialises, THE Dashboard SHALL deserialise data from Local_Storage using `JSON.parse` for each widget's key.
5. IF `JSON.parse` throws an error during data load, THEN THE Dashboard SHALL log the error to the browser console, remove the corrupted entry from Local_Storage, and initialise the affected widget with an empty list of zero items.
6. IF a call to `localStorage.setItem` throws a `QuotaExceededError` or equivalent storage-full exception, THEN THE Dashboard SHALL catch the exception, log it to the browser console, and display an inline error message within the affected widget indicating that data could not be saved.
7. THE Dashboard SHALL NOT store any sensitive personal information in Local_Storage beyond task titles and link labels and URLs.

---

### Requirement 7: Performance and Responsiveness

**User Story:** As a user, I want the dashboard to load instantly and respond without noticeable lag, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL render all visible content within 2 seconds of the `file://` page load event completing on a standard desktop device (defined as a machine with at least a dual-core CPU at 1.6 GHz and 4 GB RAM).
2. THE Dashboard SHALL respond to any user interaction (button click, text input, toggle) within 200 milliseconds on a standard desktop device, measured from the interaction event to the first visible UI change.
3. THE Dashboard SHALL NOT make any external network requests during normal operation, including on initial load, user interaction, and data persistence operations.
4. THE Dashboard SHALL be fully functional as a standalone `.html` file opened directly from the filesystem via the `file://` protocol, with all styles, scripts, and assets either embedded inline or referenced as relative paths within the same directory.
5. IF the Dashboard fails to render all visible content within 2 seconds of the page load event, THEN THE Dashboard SHALL display a visible loading indicator within 500 milliseconds of the page load event starting.
