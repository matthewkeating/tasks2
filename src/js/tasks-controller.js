import * as tasks from './tasks-model.js';
import * as settings from './settings-model.js';
import * as sidebar from './sidebar.js';
import { EditableDivWithPlaceholder } from '../components/editable-div.js';

let _selectedTask = null;
let _editableTaskDetailsTitle = null;
let _taskNotes = null;
const _addTaskInputBox = document.getElementById("addTaskInputBox");

/****************************************************************************
 * Element Binding
 ****************************************************************************/
function bindEvents() {

  sidebar.registerGesturesAndHotKeys();

  // Add Task input box
  _addTaskInputBox.addEventListener("keydown", event => {

    if (event.key === "Enter" && _addTaskInputBox.value.trim()) {
      const newTask = { id: crypto.randomUUID(),
        title: _addTaskInputBox.value,
        flagged: false,
        completed: false,
        deleted: false,
        notes: null
      };

      if (event.shiftKey) {
        tasks.addTask(newTask, "bottom");
      } else {
        tasks.addTask(newTask, "top");
      }
  
      renderTasks();
      selectTask(newTask);
      _addTaskInputBox.value = "";
    }
  });
  _addTaskInputBox.addEventListener("keydown", event => {
    // overwrite the default tab behavior (and do nothing instead)
    if (event.key === "Tab") {
      event.preventDefault();
    }
  });
  _addTaskInputBox.addEventListener('focus', event => {
    deselectTask(_selectedTask);
  });

  // editable task title
  _editableTaskDetailsTitle.getEditableDiv().addEventListener('input', () => {
    const title = _editableTaskDetailsTitle.getText();
    // update the title in the task list
    const titleDiv = document.querySelector(`[data-id="${_selectedTask.id}"]`).getElementsByClassName("task-title")[0];
    titleDiv.textContent = title;
    _selectedTask.title = title;

    if (title.length === 0) {
      setNoTitle(titleDiv, true);
    } else {
      setNoTitle(titleDiv, false);
    }
  });
  _editableTaskDetailsTitle.getEditableDiv().addEventListener('blur', () => {
    tasks.saveTasks();
  });

  // task notes
  _taskNotes.on('text-change', function(delta, oldDelta, source) {
    // note: delta is the formatted contents in Quill
  
    // update the notes indicator in the task list
    const div =  document.querySelector(`[data-id="${_selectedTask.id}"]`);
    const img = div.getElementsByClassName("icon-note")[0];
    const isEmpty = _taskNotes.getContents().ops.length === 1 && _taskNotes.getText().trim() === "";

    if (isEmpty) {
      if (delta.ops.length > 1) {
        // this is the state the editor gets into when the user types something that results in a
        // list (e.g., -, *, or 1.)
        // in this state, we still want to save the contents, but we don't want to reset the editor to ""
        img.setAttribute('src', '');
        _selectedTask.notes = null;
      } else {
        img.setAttribute('src', '');
        _taskNotes.setText("");
        _selectedTask.notes = null;
      }
    } else {
      img.setAttribute('src', '../images/note.svg');
      _selectedTask.notes = _taskNotes.getContents();
    }

    tasks.saveTasks();

  });

}

/****************************************************************************
 * IPC
 ****************************************************************************/
window.electronAPI.newTask(() => {
  _addTaskInputBox.focus();
});
window.electronAPI.toggleShowCompleted(() => {
  toggleShowCompleted(_selectedTask);
});
window.electronAPI.toggleShowDeleted(() => {
  toggleShowDeleted(_selectedTask);
});
window.electronAPI.toggleCompleted(() => {
  toggleCompleted(_selectedTask);
});
window.electronAPI.toggleFlag(() => {
  toggleFlag(_selectedTask);
});
window.electronAPI.selectNextTask(() => {
  selectNextTask(_selectedTask);
});
window.electronAPI.selectPreviousTask(() => {
  selectPreviousTask(_selectedTask);
});
window.electronAPI.deleteTask(() => {
  deleteTaskAndHighlightNextTask(_selectedTask);
});
window.electronAPI.purgeDeletedTasks(() => {
  let result = confirm("Are you sure you want to permanently remove all deleted tasks? This action cannot be undone.");
    if (!result) {
      return;
    }
  tasks.permanentlyDeleteAllDeletedTasks();
  renderTasks();
});
window.electronAPI.purgeCompletedTasks(() => {
  let result = confirm("Are you sure you want to permanently remove all completed tasks? This action cannot be undone.");
  if (!result) {
    return;
  }
  tasks.permanentlyDeleteAllCompletedTasks();
  renderTasks();
});

/****************************************************************************
 * Methods
 ****************************************************************************/

function selectTask(task) {

  if (task === null) {
    // Calling functions can send in a null value. In this case, all we want to do is deselect the current task
    deselectTask(_selectedTask);
    return;
  } else if (task !== _selectedTask) {
    deselectTask(_selectedTask);
  }

  _selectedTask = task;

  // highlight the selected task
  const t = document.querySelector(`[data-id="${task.id}"]`);
  t.classList.add("task-selected");
  
  showQuickAction(_selectedTask.id);
  showTaskDetails(_selectedTask);

}

function showTaskDetails(task) {

  _editableTaskDetailsTitle.setText(task.title);

  if (task.notes !== null) {
    _taskNotes.setContents(task.notes);
  } else {
    _taskNotes.setText("");
  }

  taskDetails.classList.remove("display-none");

  _taskNotes.focus();   // Set focus to the notes box

}

function deselectTask(task) {
  // there are situations where this function could be called with null (so we have to check)
  if (task === null && taskDetails !== null) {
    taskDetails.classList.add("display-none");
    return;
  }

  // remove highlights from any tasks
  const selectedTasks = document.getElementsByClassName("task-selected");
  for (let i = 0; i < selectedTasks.length; i++) {
    selectedTasks[i].classList.remove("task-selected");
  }

  // hide/remove task details (if showing)
  if (taskDetails !== null) {
    taskDetails.classList.add("display-none");
  }

  hideQuickAction(task.id);

  _selectedTask = null;

}

export function toggleShowCompleted(task) {

  if (task === null) {
    task = _selectedTask
  }

  settings.toggleShowCompleted();
  if (!settings.showingCompleted && task !== null && task.completed === true) {
    // the selected task is being hidden
    task = null;
    _addTaskInputBox.focus();
  }
  renderTasks();
  selectTask(task);

  // update Tray menu
  window.electronAPI.updateTrayLabels(settings.showingCompleted, settings.showingDeleted);

}

export function toggleShowDeleted(task) {

  if (task === null) {
    task = _selectedTask
  }

  settings.toggleShowDeleted();
  if (!settings.showingDeleted && task !== null && task.deleted === true) {
    // the selected task is being hidden
    task = null;
    _addTaskInputBox.focus();
  }
  renderTasks();
  selectTask(task);

  // update Tray menu
  window.electronAPI.updateTrayLabels(settings.showingCompleted, settings.showingDeleted);
}

function toggleFlag(task) {

  if (task.deleted || task.completed)
    return;

  tasks.toggleFlagged(task);
  renderTasks();
  selectTask(_selectedTask);
}

function toggleCompleted(task) {

  if (task.deleted)
    return;

  if (task.completed) {
    tasks.toggleCompleted(task);
    renderTasks();
    selectTask(task);
    return;
  }

  let nextTaskToHighlight = null;
  let numActiveTasks = tasks.getNumActiveTasks();

  // get the next task to highlight
  if (numActiveTasks === 1) {
    // ASSERT: task being completed is the only remaining active task
    _addTaskInputBox.focus();
  } else if (task !== _selectedTask) {
    // ASSERT: the task being complete is not currently selected
    nextTaskToHighlight = _selectedTask;  // the next task to highlight is the currently highlighted task
  } else {
    // ASSERT: there are at least two tasks in the active task list (before the complete action)
    // ASSERT: the task being complete is the currently highlighted task
    if (task === tasks.getNextTask(task, true, false, false)) {
      // ASSERT: the task being completed is the last task (i.e., in the last position) in the list
      nextTaskToHighlight = tasks.getPreviousTask(task, true, false, false);  // highlight the previous
    } else {
      nextTaskToHighlight = tasks.getNextTask(task, true, false, false);  // highlight the next task
    }
  }
  
  tasks.toggleCompleted(task);
  renderTasks();
  selectTask(nextTaskToHighlight);

}

function selectPreviousTask(task) {
  let previousTask = null
  if (tasks.getFirstTask(true, settings.showingCompleted, settings.showingDeleted) === _selectedTask) {
    _addTaskInputBox.focus();
  } else {
    previousTask = tasks.getPreviousTask(task, true, settings.showingCompleted, settings.showingDeleted);
  }
  selectTask(previousTask);
}

function selectNextTask(task) {
  let nextTask = null;
  if (document.activeElement === _addTaskInputBox) {
    nextTask = tasks.getFirstTask(true, settings.showingCompleted, settings.showingDeleted);
  } else {
    nextTask = tasks.getNextTask(task, true, settings.showingCompleted, settings.showingDeleted);
  }
  selectTask(nextTask);
}

function deleteTaskAndHighlightNextTask(task) {

  if (task.deleted === true) {
    let result = confirm("This action cannot be undone. Are you sure you want to permanently delete this task?");
    if (!result) {
      return;
    }
  }

  let nextTaskToHighlight = null;

  const includeActive = !task.completed && !task.deleted;
  const includeCompleted = task.completed;
  const includeDeleted = task.deleted;

  let groupCount;
  if (task.deleted) {
    groupCount = tasks.getNumDeletedTasks();
  } else if (task.completed) {
    groupCount = tasks.getNumCompletedTasks();
  } else {
    groupCount = tasks.getNumActiveTasks();
  }

  if (groupCount === 1) {
    _addTaskInputBox.focus();
  } else if (task !== _selectedTask) {
    nextTaskToHighlight = _selectedTask;
  } else {
    if (task === tasks.getNextTask(task, includeActive, includeCompleted, includeDeleted)) {
      nextTaskToHighlight = tasks.getPreviousTask(task, includeActive, includeCompleted, includeDeleted);
    } else {
      nextTaskToHighlight = tasks.getNextTask(task, includeActive, includeCompleted, includeDeleted);
    }
  }

  if (task.deleted === true) {
    tasks.permanentlyDeleteTask(task);
  } else {
    tasks.deleteTask(task);
  }
  renderTasks();
  selectTask(nextTaskToHighlight);

}

function restoreTask(task) {
  tasks.restoreTask(task);
  renderTasks();
  selectTask(task);
}

function getCompleteAction(task) {

  const circle = document.createElement("img");
  circle.classList.add("icon-circle");

  if (task.completed === true) {
    circle.src = "../images/circle_checked.svg";
  } else {
    circle.src = "../images/circle_empty.svg";
  }

  if (task.deleted === false) {
    // only apply hover and add click event if the task is not deleted
    circle.classList.add("icon-circle-hover");
    circle.addEventListener("click", (event) => {
      toggleCompleted(task);
      event.stopPropagation();
    });
  }

  return circle;
}

function getQuickActions(task) {

  // create a element to hold all the quick actions
  const quickActions = document.createElement("div");
  quickActions.id = "qa_" + task.id;
  quickActions.classList.add("quick-actions");

  // restore (only for deleted tasks)
  if (task.deleted === true) {
    const restoreImage = document.createElement("img");
    restoreImage.src = "../images/restore.svg";
    restoreImage.classList.add("icon-restore");
    restoreImage.classList.add("icon-restore-hover");
    restoreImage.onclick = () => { restoreTask(task); }
    quickActions.appendChild(restoreImage);
  }

  // delete
  const deleteImage = document.createElement("img");
  deleteImage.src = "../images/trash.svg";
  deleteImage.classList.add("icon-trash");
  deleteImage.onclick = () => { deleteTaskAndHighlightNextTask(task); }
  quickActions.appendChild(deleteImage);

  // flag
  const flag = document.createElement("img");
  if (task.flagged) {
    flag.src = "../images/flag_filled.svg";
  } else {
    flag.src = "../images/flag_empty.svg";
  }
  flag.classList.add("icon-flag");
  // flag (only for active tasks)
  if (task.completed === false && task.deleted === false) {
    flag.classList.add("icon-flag-hover");
    flag.onclick = () => { toggleFlag(task); }
  }
  quickActions.appendChild(flag);
  
  return quickActions;
}

function getListItem(task){

  const taskDiv = document.createElement("div");
  taskDiv.classList.add("task");
  taskDiv.draggable = true;
  taskDiv.dataset.id = task.id;
  taskDiv.dataset.type = "selectable";

  // set up click behaviors
  taskDiv.addEventListener("mousedown", (event) => {
    if (event.target.classList.contains("task-title-is-editing")) return;
    // need to select the task on mouse down to make the drag and drop functionality work as expected
    let divType = event.target.dataset.type;
    // if statement will allow the event to fire when the taskDiv or titleDiv is selected
    // while preventing it from firing when any of the taskDiv children (e.g., the complete or
    // delete buttons) are clicked
    if (divType === "selectable") {
      selectTask(task);
    };
  });
  taskDiv.addEventListener("click", (event) => {
    if (event.target.classList.contains("task-title-is-editing")) return;
    // b/c the click happens after mousedown, we need to set focus to the taskNotes
    let divType = event.target.dataset.type;
    // if statement will allow the event to fire when the taskDiv or titleDiv is selected
    // while preventing it from firing when any of the taskDiv children (e.g., the complete or
    // delete buttons) are clicked
    if (divType === "selectable") {
      _taskNotes.focus();
    };
  });
  
  taskDiv.addEventListener("dblclick", (event) => {
    // b/c the click happens after mousedown, we need to set focus to the taskNotes

    // if statement will allow the event to fire only when the titleDiv was double clicked
    if (event.target.classList.contains("task-title")) {
      const titleDiv = event.target;
      titleDiv.classList.remove("task-title");
      titleDiv.classList.add("task-title-is-editing");
      titleDiv.setAttribute('contenteditable', 'plaintext-only');
      titleDiv.parentElement.setAttribute('draggable', 'false');
      
      // set focus
      titleDiv.focus();   

      // select the text
      const range = document.createRange();
      range.selectNodeContents(titleDiv);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // remove the "no title" styling and clear the contents of the div
      if (titleDiv.classList.contains("noTitle")) {
        titleDiv.classList.remove("noTitle");
        titleDiv.innerHTML = "";
      }

      const exitEdit = () => {
        titleDiv.classList.add("task-title");
        titleDiv.classList.remove("task-title-is-editing");
        titleDiv.removeAttribute('contenteditable');
        titleDiv.parentElement.setAttribute('draggable', 'true');

        const title = titleDiv.innerText.trim();

        if (title.length === 0) {
          setNoTitle(titleDiv, true);
        } else {
          setNoTitle(titleDiv, false);
        }

        tasks.saveTasks();
        
        titleDiv.removeEventListener('blur', exitEdit);
        titleDiv.removeEventListener('keydown', keyCheck);
        titleDiv.removeEventListener('input', onInput);
      };

      const keyCheck = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          titleDiv.blur();
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          _taskNotes.focus();   // Set focus to the notes box
        }
      };

      const onInput = (event) => {
        // sync with the title div in the side bar
        const title = titleDiv.innerText.trim();
        _editableTaskDetailsTitle.setText(title);
        // save the changes
        _selectedTask.title = title;
      }

      titleDiv.addEventListener('blur', exitEdit);
      titleDiv.addEventListener('keydown', keyCheck);
      titleDiv.addEventListener('input', onInput);
      titleDiv.addEventListener('mousedown', (event) => {
        if (event.button == 2) {  // 2 is a right click
          exitEdit();
        }
      });

    };
  });
  
  const circle = getCompleteAction(task)

  // Create the div for the task title 
  const title = document.createElement("div");
  title.dataset.id = task.id;
  title.dataset.type = "selectable";
  title.classList.add("task-title");

  title.innerText = task.title;
  if (task.title.length === 0) {
    setNoTitle(title, true);
  }

  if (task.completed) {
    title.classList.add("task-title-completed");
  } else if (task.deleted) {
    title.classList.add("task-title-deleted");
  } else if (task.flagged === true) {
    title.classList.add("flagged");
  }

  // Create the img element that will hold the note indicator
  const note = document.createElement("img");
  if (task.notes !== null) {
      note.src = "../images/note.svg";
  }
  note.classList.add("icon-note");
  note.addEventListener("click", (event) => { _selectedTask = task; });

  let quickActions = getQuickActions(task);
  quickActions.classList.add("display-none");

  // Add all of the above task elements to the task div
  taskDiv.appendChild(circle);
  taskDiv.appendChild(title);
  taskDiv.appendChild(quickActions);
  taskDiv.appendChild(note);

  return taskDiv;
}

function getEmptyDropContainer(text) {
  const dragDrop = document.createElement("img");
  dragDrop.classList.add("icon-drag-drop");
  dragDrop.src = "../images/drag_drop.svg";

  const title = document.createElement("div");
  title.classList.add("task-title");
  title.classList.add("task-title-completed");
  title.innerHTML = text;

  const emptyDiv = document.createElement("div");
  emptyDiv.classList.add("task-empty");
  emptyDiv.appendChild(dragDrop);
  emptyDiv.appendChild(title);

  return emptyDiv;
}

function showQuickAction(taskId) {
  let qa = document.getElementById("qa_" + taskId);
  if (qa !== null) {
    qa.classList.remove("display-none");
  }
}

function hideQuickAction(taskId) {
  let qa = document.getElementById("qa_" + taskId);
  if (qa !== null) {
    qa.classList.add("display-none");
  } 
}

function setNoTitle(div, hasNoTitle) {
  if (hasNoTitle) {
    div.innerText = "No Title";
  }
  div.classList.toggle("noTitle", hasNoTitle);
}

function renderTasks() {

  let tasksToRender = null;

  // reset the active tasks container
  activeContainer.innerHTML = "";
  if (tasks.getNumActiveTasks() < 1 &&
      settings.showingCompleted === false &&
      settings.showingDeleted === false) {
    // hide both the header and the list of active tasks if there are no tasks
    // and neither the completed or deleted list is showing
    activeHeading.classList.add("display-none");
    activeContainer.classList.add("display-none");
  } else if (tasks.getNumActiveTasks() > 0 &&
      settings.showingCompleted === false &&
      settings.showingDeleted === false) {
    // hide the header if only the active tasks are showing
    activeHeading.classList.add("display-none");
    activeContainer.classList.remove("display-none");
  } else {
    activeHeading.classList.remove("display-none");
    activeContainer.classList.remove("display-none");
  }

  // reset the completed tasks container
  completedContainer.innerHTML = "";
  if (settings.showingCompleted === true) {
    completedHeading.classList.remove("display-none");
    completedContainer.classList.remove("display-none");
  } else {
    completedHeading.classList.add("display-none");
    completedContainer.classList.add("display-none"); 
  }

  // reset the deleted tasks container
  deletedContainer.innerHTML = "";
  if (settings.showingDeleted === true) {
    deletedHeading.classList.remove("display-none");
    deletedContainer.classList.remove("display-none");
  } else {
    deletedHeading.classList.add("display-none");
    deletedContainer.classList.add("display-none"); 
  }
  
  tasksToRender = tasks.getTasks();
  tasksToRender.forEach(task => {

    // Create the div that will hold all the elements of the task
    const taskDiv = getListItem(task);
     
    // Add the task div to the task container
    if (task.deleted === true) {
      deletedContainer.appendChild(taskDiv); 
    } else if (task.completed === true) {
      completedContainer.appendChild(taskDiv);
    } else {
      activeContainer.appendChild(taskDiv); 
    }

  });

  // handle an empty active list
  if (tasks.getNumActiveTasks() == 0) {
    const emptyDropContainer = getEmptyDropContainer("Drop active tasks here.");
    activeContainer.appendChild(emptyDropContainer);
  }

  // handle an empty completed list
  if (tasks.getNumCompletedTasks() == 0 && settings.showingCompleted) {
    const emptyDropContainer = getEmptyDropContainer("Drop completed tasks here.");
    completedContainer.appendChild(emptyDropContainer);
  }

  // handle an empty deleted list
  if (tasks.getNumDeletedTasks() == 0 && settings.showingDeleted) {
    const emptyDropContainer = getEmptyDropContainer("Drop deleted tasks here.");
    deletedContainer.appendChild(emptyDropContainer);
  }

}

/****************************************************************************
 * Drag and Drop
 ****************************************************************************/
const draggableContainers = document.querySelectorAll(".draggable-container");
draggableContainers.forEach(container => {

  container.addEventListener("dragstart", event => {
    event.target.classList.add("dragging");
  });
  
  container.addEventListener("dragend", event => {
    event.target.classList.remove("dragging");
  });

  container.addEventListener("dragover", event => {

    event.preventDefault();

    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(container, event.clientY);

    // Completed and Deleted lists cannot be re-ordered
    if (container.id == "completedContainer" || container.id == "deletedContainer") {
      container.classList.add("dragover-completed");  
      return;
    }

    if (afterElement == null) {
      container.appendChild(dragging);
    } else {
      container.insertBefore(dragging, afterElement);
    }
  });

  container.addEventListener('dragleave', (event) => {
    if (container.id == "completedContainer" || container.id == "deletedContainer") {
      container.classList.remove("dragover-completed");
    }
  });

  container.addEventListener("drop", event => {  

    if (container.id == "activeContainer") {
      _selectedTask.completed = false;
      _selectedTask.deleted = false;
    }
    if (container.id == "completedContainer") {
      _selectedTask.completed = true;
      _selectedTask.deleted = false;
      container.classList.remove("dragover-completed");   // reset the look of the container
    }
    if (container.id == "deletedContainer") {
      _selectedTask.deleted = true;
      container.classList.remove("dragover-completed");   // reset the look of the container
    }

    const children = document.getElementById(container.id).children;
    const updatedOrder = Array.from(children).map(div => div.dataset.id);
    let taskArray = tasks.getTasks();
    taskArray.sort((a, b) => updatedOrder.indexOf(a.id) - updatedOrder.indexOf(b.id));
    tasks.replaceTasks(taskArray);
    renderTasks();
    selectTask(_selectedTask);

  });
    
  // Add drag events to each task
  const t = container.querySelectorAll(".task");
  t.forEach(task => {
    task.addEventListener("dragstart", event => {
      event.target.classList.add("dragging");
    });
    task.addEventListener("dragend", event => {
      event.target.classList.remove("dragging");
    });
  });
});
const getDragAfterElement = (container, y) => {
  const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

/****************************************************************************
 * Page Initialization
 ****************************************************************************/
document.addEventListener("DOMContentLoaded", async () => {

  // Due to importing this file into other js files, this event listener gets fired when the tasks page is not
  // loaded. This is a check (probably a hack) to prevent this from happening.
  if (!document.URL.endsWith("tasks.html")) return;

  _editableTaskDetailsTitle = new EditableDivWithPlaceholder('taskDetailsTitle', false);

  // TODO: Consider installing Quill via npm (rather than directly using it's .js and .css files)
  const toolbarOptions = [
    [{ 'header': 1 }, { 'header': 2 }, { 'header': 3 }],
    ['blockquote'],
    ['link']
  ];
  _taskNotes = new Quill('#notesTextArea', {
    modules: {
      toolbar: toolbarOptions
    },
    theme: "bubble",
    placeholder: "Add notes here...",
  });
  _taskNotes.root.setAttribute('spellcheck', false);

  document.getElementById('notesTextArea').addEventListener('click', function (e) {
    // Check if the clicked element is a link
    if (e.target.tagName === 'A') {
      e.preventDefault(); // Prevent default browser action (like navigating)
      window.electronAPI.openLinkExternal(e.target.href);
    }
  });

  await tasks.init();
  renderTasks();
  bindEvents();

  // update Tray menu
  window.electronAPI.updateTrayLabels(settings.showingCompleted, settings.showingDeleted);

});