# Tasks
A task management application that runs from the MacOS menu bar.

This is a lighter weight version of [Tasks](https://github.com/matthewkeating/tasks) focused on providing everything you need and nothing you don't.

## Introduction

### The Problem
The challenge with contemporary task list applications is they are either:

* Bloated with features that aren't necessary, resulting in a cluttered user interface and bad experience, or
* Too minimalistic, leaving the user without useful functionality

### Project Objective
The aim of this project is to create a task list manager that:

* Lives only in the menu bar
* Is callable through a global hot key
* Provides the user only the features they need
* Allows nearly every operation to be executed via keyboard shortcuts
* Provides a minimalist/streamlined user interface

## Features
Unlike [the "bigger" version of Tasks](https://github.com/matthewkeating/tasks), this version only provides the basics.

### Task Management
By design, Tasks supports only one task list. This means users cannot, for example, create lists for Personal, Office, Grocery, etc. Tasks does, however, provide a small set of options for managing your task list.

#### Flagged Tasks
Flagging a task changes the task color, making it more noticeable.
> [!TIP]
> Flags are useful for drawing attention to high priority tasks.

#### Completed Tasks
Completed tasks are, naturally, those tasks marked as complete.

#### Deleted Tasks
Unsurprisingly, manually deleted tasks (included completed tasks) go to Deleted.

#### Task Ordering/Reordering
Task ordering is important for prioritizing and maintaining focus. In Tasks, by design, completed and deleted tasks cannot be reordered. The most recent completed (or deleted) tasks are placed to the top of the completed (or deleted) lists.

#### Notes
Each task can have associated notes. The editor supports headings; ordered and unordered lists; checklists; hyperlinks; as well as bold, italics, underline, and other font decoration.

#### Light and Dark Themes
Tasks has two themes: light and dark.

> [!NOTE]
> There is no setting for manually selecting light and dark modes. Tasks will automatically theme/re-theme based on the user's system's Appearance setting.

### Keyboard Shortcuts
Per the tables below, Tasks provides application-wide keyboard shortcuts.

#### Application Shortcuts

| Shortcut         | Action               |
|------------------|----------------------|
| ⌘ ⇧ '            | Show/Hide application|
| ⌘ ⇧ .            | Show sidebar         |
| ⌘ ⇧ ,            | Hide sidebar         |
| ⌘ ⇧ C            | Show/Hide completed tasks |
| ⌘ ⇧ D            | Show/Hide deleted tasks   |
| ⌘ ⇧ [            | Previous task        |

#### Task Shortcuts

| Shortcut         | Action               |
|------------------|----------------------|
| ⌘ N              | New task             |
| ⌘ ⇧ K            | Toggle completed     |
| ⌘ ⇧ F            | Toggle flag          |
| ⌘ ⌫              | Delete task          |
| ⌘ ⇧ ]            | Next task            |
| ⌘ ⇧ [            | Previous task        |

### Gestures
Tasks allows you to show/hide the sidebar using gestures:

* Using a trackpad, a two finger swipe right or left with show or hide the sidebar, respectively
* Using a mouse, pressing and holding the right button, "swiping" right or left, and releasing will show or hide the sidebar, respectively

## Configuration

Tasks uses Google Firestore for cross-device sync. Before building, you must create a Firebase project and provide its configuration.

### Prerequisites
1. Create a [Firebase project](https://console.firebase.google.com) (free Spark plan is sufficient).
2. In your project, go to **Build → Firestore Database** and create a database. Choose **Start in test mode** for development; switch to production mode and add security rules before sharing the app.
3. Go to **Project settings** (gear icon) → scroll to **Your apps** → click the **</>** (web) icon to register a web app.
4. Copy the `firebaseConfig` object shown.

### Creating `firebase-config.js`
Create `src/firebase-config.js` with the values from the Firebase Console:
```js
module.exports = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```
This file is listed in `.gitignore` and will not be committed to the repository.

## Building

1. Clone the repo.
2. Create `src/firebase-config.js` as described in [Configuration](#configuration).
3. Run `npm run make`.

For more detailed build instructions, see [install-instructions.md](install-instructions.md).

## External Integrations
Tasks stores all task data in a JSON file at:
```
~/Library/Application Support/Tasks/tasks.json
```
This file can be read and written by external tools to modify the task list. For example, the [Tasks — Raycast Extension](https://github.com/matthewkeating/tasks-raycast-extension) is a [Raycast](https://www.raycast.com) extension that can read this file and create, complete, flag, or delete tasks without opening the app.

The file contains a JSON array of task objects with the following structure:
```json
{
  "id": "unique-id",
  "title": "Task title",
  "flagged": false,
  "completed": false,
  "deleted": false,
  "notes": null,
  "updatedAt": 1718000000000
}
```
The `updatedAt` field is a Unix timestamp (milliseconds) added automatically on each save. It is used for conflict resolution when syncing with Firestore.

### Mobile Support and Syncing Across Devices
Tasks syncs task data to [Google Firestore](https://firebase.google.com/docs/firestore) so that changes made on macOS are reflected on Android and vice versa. Sync requires a Firebase project and a `src/firebase-config.js` file — see [Configuration](#configuration) below.

## To Dos
None.

## Known Issues
None.

## Disclaimers
* This software was designed, developed, and tested exclusively on/for macOS.

## Thank you
* [Ariel Diaz](https://github.com/fullmetalbrackets) - For offering a solid HEX to CSS filter [conversion tool](https://cssfiltergenerator.lol/)
* [Tabler](https://tabler.io/) - For offering free and awesome [icons](https://tabler.io/icons)
* [SVGator](https://www.svgator.com/) - For providing a nice tool for editing svg files.
