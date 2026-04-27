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

### External Integrations (e.g. Raycast)
Tasks stores all task data in a JSON file at:
```
~/Library/Application Support/Tasks/tasks.json
```
This file can be read and written by external tools to create, complete, or delete tasks without opening the app. For example, a [Raycast](https://www.raycast.com) extension can read this file to list tasks or append a new task object to create one. The app will reflect any external changes the next time it is launched.

The file contains a JSON array of task objects with the following structure:
```json
{
  "id": "unique-id",
  "title": "Task title",
  "flagged": false,
  "completed": false,
  "deleted": false,
  "notes": null
}
```

### Mobile Support and Syncing Across Devices
Tasks does ***not*** support mobile or sync data across devices. These features are not a important to me but I may add them in the future as I recognize their importance to some.

## To Dos
None.

## Known Issues
None.

## Disclaimers
* This software is beta.
* Tasks was made with Electron using HTML, CSS, and JavaScript only. It was designed, developed, and tested exclusively on MacOS.

## Thank you
* [Ariel Diaz](https://github.com/fullmetalbrackets) - For offering a solid HEX to CSS filter [conversion tool](https://cssfiltergenerator.lol/)
* [Tabler](https://tabler.io/) - For offering free and awesome [icons](https://tabler.io/icons)
* [SVGator](https://www.svgator.com/) - For providing a nice tool for editing svg files.