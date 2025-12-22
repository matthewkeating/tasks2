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
Task ordering is important for prioritizing and maintaining focus. In Tasks, by design, completed and deleted tasks cannot be reordered.

#### Notes
Each task can have associated notes. The editor supports headings; ordered and unordered lists; checklists; as well as bold, italics, underline, and other font decoration.

#### Light and Dark Themes
Tasks has two themes: light and dark.

> [!NOTE]
> There is no setting for manually selecting light and dark modes. Tasks will automatically theme/re-theme based on the user's system's Appearance setting.

### Keyboard Shortcuts
Per the tables below, Tasks provides application-wide keyboard shortcuts.

| Shortcut         | Action               |
|------------------|----------------------|
| ⌘ ⇧ '            | Show/Hide application  |
| ⌘ N              | Add task             |
| ⌘ ⇧ O            | Toggle completed     |
| ⌘ ⇧ F            | Toggle flag          |
| ⌘ ⌫              | Delete task          |
| ⌘ ⇧ ]            | Next task            |
| ⌘ ⇧ [            | Previous task        |

### Mobile Support and Syncing Across Devices
Tasks does ***not*** support mobile or sync data across devices. These features are not a important to me but I may add them in the future as I recognize there importance to some.

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