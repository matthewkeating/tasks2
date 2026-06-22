# Tasks
A task management application that runs from the macOS menu bar and stores task information in Firestore.

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

### Task Management
By design, Tasks supports two task lists: Work and Personal. Tasks also only provides a small set of options for managing your task list.

#### Flagged Tasks
Flagged tasks change color, making it more noticeable.

#### Completed Tasks
Completed tasks are, naturally, those tasks marked as complete. Completed tasks are organzied under a `Completed` section in the app.

#### Deleted Tasks
Deleted tasks are, naturally, those tasks that have been deleted. Deleted tasks are organzied under a `Deleted` section in the app.

#### Task Ordering/Reordering
Task ordering is important for prioritizing and organizing work. In Tasks, by design, completed and deleted tasks cannot be reordered. The most recent completed (or deleted) tasks are placed to the top of the completed (or deleted) lists.

#### Notes
Each task can have associated plain text notes.

#### Light and Dark Themes
Tasks has two themes: light and dark.

> [!NOTE]
> There is no setting for manually selecting light and dark modes. Tasks will automatically theme/re-theme based on the user's system's Appearance setting.

### Keyboard Shortcuts
Per the tables below, Tasks provides application-wide keyboard shortcuts.

#### Application Shortcuts

| Shortcut         | Action               |
|------------------|----------------------|
| ⌘ ⇧ '            | Show/Hide application         |
| ⌘ 1              | Navigate to the Work list     |
| ⌘ 2              | Navigate to the Personal list |
| ⌘ ⇧ .            | Show/Hide notes sidebar       |
| ⌘ ⇧ C            | Show/Hide completed tasks     |
| ⌘ ⇧ D            | Show/Hide deleted tasks       |

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
