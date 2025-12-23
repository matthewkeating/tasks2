import * as tasks from './tasks-model.js';
import * as settings from './settings-model.js';
import { EditableDivWithPlaceholder } from '../components/editable-div.js';

var _selectedTask = null;
var _editableTaskDetailsTitle = null;
var _taskNotes = null;

/****************************************************************************
 * Element Binding
 ****************************************************************************/
function bindEvents() {

  window.addEventListener("keydown", event => {
    if (event.key === 'Escape') {
      // Check if the user is currently typing in an editable area
      const isTyping = event.target.isContentEditable;

      if (isTyping) {
        event.target.blur(); // Just exit the input
      } else {
        window.electronAPI.hideWindow();
      }
    }
  });

  // Add Task input box
  addTaskInputBox.addEventListener("keypress", event => {
    if (event.key === "Enter" && addTaskInputBox.value.trim()) {
      const newTask = { id: Date.now().toString(),
        title: addTaskInputBox.value,
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
      addTaskInputBox.value = "";
    }
  });
  addTaskInputBox.addEventListener("keydown", event => {
    if (event.key === "Tab" && tasks.getNumTasks(settings.showingCompleted) > 0) {
      event.preventDefault();
      const firstTask = tasks.getTaskByIndex(0);
      selectTask(firstTask);
    }
  });
  addTaskInputBox.addEventListener('focus', event => {
    deselectTask(_selectedTask);
  });

  // editable task title
  _editableTaskDetailsTitle.getEditableDiv().addEventListener('input', () => {
    const title = _editableTaskDetailsTitle.getText();
    // update the title in the task list
    const titleDiv = document.querySelector(`[data-id="${_selectedTask.id}"]`).getElementsByClassName("task-title")[0];
    titleDiv.innerHTML = title;
    _selectedTask.title = title;
    //tasks.saveTasks();

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
  addTaskInputBox.focus();
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
  var result = confirm("Are you sure you want to permanently remove all deleted tasks? This action cannot be undone.");
    if (!result) {
      return;
    }
  tasks.permanentlyDeleteAllDeletedTasks();
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

  window.electronAPI.enableTaskMenu();

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

  window.electronAPI.disableTaskMenu();
}

export function toggleShowCompleted(task) {

  if (task === null) {
    task = _selectedTask
  }

  settings.toggleShowCompleted();
  if (!settings.showingCompleted && task !== null && task.completed === true) {
    // the selected task is being hidden
    task = null;
    addTaskInputBox.focus();
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
    addTaskInputBox.focus();
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
  
  tasks.toggleCompleted(task);
  renderTasks();

  if (_selectedTask === task && settings.showingCompleted) {
    // the task being toggled is the currently selected task and the UI is showing completed tasks
    selectTask(task);
  } else if (_selectedTask === task && !settings.showingCompleted) {
    // the task being toggled is the currently selected task but the UI is not showing completed tasks
    getNextTaskToHighlight(task);
  } else if (_selectedTask !== task) {
    // the task being toggled is not the current selected task
    selectTask(_selectedTask);
  } else {
    throw "Unexpected condition."
  }

}

function selectPreviousTask(task) {
  let previousTask = tasks.getPreviousTask(task, settings.showingCompleted, settings.showingDeleted);
  selectTask(previousTask);
}

function selectNextTask(task) {
  let nextTask = tasks.getNextTask(task, settings.showingCompleted, settings.showingDeleted);
  selectTask(nextTask);
}

function getNextTaskToHighlight(task) {
  
  let indexOfTask = null;
  let taskArray = tasks.getTasks();
  indexOfTask = taskArray.findIndex(i => i.id === task.id);  // get the position in the array the task passed into this function

  // these are the easy cases :)
  if (taskArray.length === 1) {
    // after deleting, there will be no tasks left in the list
    return null;
  } else if (indexOfTask === 0) {
    // you are deleting the first task in the list, so return the second task
    return taskArray[1];
  } else if (indexOfTask === taskArray.length-1) {
    // you are deleting the last task in the list, so return the second to last task
    return taskArray[taskArray.length - 2];
  }

  // now deal with the harder cases :(
  var retVal = null;

  var previousTask = taskArray[indexOfTask - 1];
  var nextTask = taskArray[indexOfTask + 1];

  //if (nextTask.pinned === _selectedTask.pinned && nextTask.completed === _selectedTask.completed) {
  if (nextTask.completed === _selectedTask.completed && nextTask.deleted === _selectedTask.deleted) {
    return nextTask;
  } else {
    return previousTask;
  }

  return null;

}

function deleteTaskAndHighlightNextTask(task) {

  if (task.deleted === true) {
    // the task is already in the deleted list, so confirm permanent deletion before proceeding
    var result = confirm("This action cannot be undone. Are you sure you want to permanently delete this task?");
    if (!result) {
      return;
    }
  }

  if (_selectedTask === task) {
    // if the user is deleting the selected task, we want to automatically select the
    // next "most logical" task to in the list
    var nextTaskToHighlight = getNextTaskToHighlight(task);
    if (nextTaskToHighlight !== null) {
      _selectedTask = nextTaskToHighlight;
    } else {
      // there are no tasks left in the list
      _selectedTask = null;
    }
  }

  if (task.deleted === true) {
    tasks.permanentlyDeleteTask(task);
  } else {
    tasks.deleteTask(task);
  }
  renderTasks();
  selectTask(_selectedTask);

}

function restoreTask(task) {
  tasks.restoreTask(task);
  renderTasks();
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
  
  if (task.completed === false && task.deleted === false) {
    taskDiv.addEventListener("dblclick", (event) => {
      // b/c the click happens after mousedown, we need to set focus to the taskNotes
      //let divType = event.target.dataset.type;
      // if statement will allow the event to fire only when the titleDiv is selected
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

        const keyCheck = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            titleDiv.blur();
          }
          if (e.key === 'Tab') {
            e.preventDefault();
            _taskNotes.focus();   // Set focus to the notes box
          }
        };

        const onInput = (e) => {
          // sync with the title div in the side bar
          const title = titleDiv.innerText.trim();
          _editableTaskDetailsTitle.setText(title);
          // save the changes
          _selectedTask.title = title;
        }

        titleDiv.addEventListener('blur', exitEdit);
        titleDiv.addEventListener('keydown', keyCheck);
        titleDiv.addEventListener('input', onInput);

      };
    });
  }
  
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

  let quickActions = null;
  if (settings.quickActionsVisibility === "never") {
    quickActions = document.createElement("div");
  } else {
    quickActions = getQuickActions(task);
    quickActions.classList.add("display-none");
  }

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

  var tasksToRender = null;

  // reset the active tasks container
  activeContainer.innerHTML = "";
  if (tasks.getNumActiveTasks() < 1 &&
      settings.showingCompleted === false &&
      settings.showingDeleted === false) {
    activeHeading.classList.add("display-none");
    activeContainer.classList.add("display-none");
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
document.addEventListener("DOMContentLoaded", () => {

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

  renderTasks();
  bindEvents();

  // update Tray menu
  window.electronAPI.updateTrayLabels(settings.showingCompleted, settings.showingDeleted);

});