var _tasks = JSON.parse(localStorage.getItem("tasks")) || [];

export function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(_tasks));
};

export function replaceTasks(newTaskArray) {
  _tasks = newTaskArray;
  sortTasks();
  saveTasks();
};

// maintains the order of the task list (active on top, completed on in the middle, deleted on the bottom)
export function sortTasks() {
  let deletedTasks = _tasks.filter(task => task.deleted === true);
  let completedTasks = _tasks.filter(task => task.completed === true && task.deleted === false);
  let activeTasks = _tasks.filter(task => task.deleted === false && task.completed === false);
  _tasks = activeTasks.concat(completedTasks).concat(deletedTasks);
}

export function getTasks(includeCompleted, includeDeleted) {

  if (arguments.length === 0) {
    includeCompleted = true;
    includeDeleted = true; 
  }

  let activeTasks = _tasks.filter(task => task.deleted === false && task.completed === false);  // get the active tasks
  
  let completedTasks = [];
  if (includeCompleted) {
    completedTasks = _tasks.filter(task => task.completed === true && task.deleted === false);
  }

  let deletedTasks = [];
  if (includeDeleted) {
    deletedTasks = _tasks.filter(task => task.deleted === true);
  }

  let retVal = activeTasks.concat(completedTasks).concat(deletedTasks);

  /*
  var retVal;
  if (includeCompleted) {
    retVal = _tasks;
  } else {
    retVal = _tasks.filter((task => task.completed === false));  // get the uncompleted tasks
  }
  */

  return retVal;

}

export function getTaskByIndex(index) {
  if (_tasks.length-1 >= index) {
    return _tasks[index];
  }
  return null;
}

export function getNumTasks(includeCompleted) {
  let retVal = null;
  if (includeCompleted) {
    retVal = _tasks.length;
  } else {
    const array = _tasks.filter(task => task.completed === false);
    retVal = array.length;
  }
  return retVal;
}

export function getNumActiveTasks() {
  let array = _tasks.filter(task => task.deleted === false && task.completed === false);  // get the active tasks
  return array.length;
}

export function getNumCompletedTasks() {
  let array = _tasks.filter(task => task.completed === true);  // get the completed tasks
  return array.length;
}

export function getNumDeletedTasks() {
  let array = _tasks.filter(task => task.deleted === true);  // get the deleted tasks
  return array.length;
}

export function addTask(task, position) {
    if (position === "bottom") {
      _tasks.push(task);     // append to end of list
    } else {
      _tasks.unshift(task);  // add to the start of the list
    }
    sortTasks();
    saveTasks();
}

export function deleteTask(task) {
  task.deleted = true;

  // this is necessary to position a deleted task at the top of the list
   let position = "top";
  _tasks = _tasks.filter(i => i.id !== task.id);
  addTask(task, position);

  saveTasks();
}

export function restoreTask(task) {
  task.deleted = false;

  // this is necessary to position a restored task at the top of the list
   let position = "top";
  _tasks = _tasks.filter(i => i.id !== task.id);
  addTask(task, position);

  saveTasks();
}

export function permanentlyDeleteTask(task) {
  // remove the deleted task from the task list
  _tasks = _tasks.filter(i => i.id !== task.id);
  saveTasks();
}

export function permanentlyDeleteAllDeletedTasks() {
  let deletedTasks = _tasks.filter(task => task.deleted === true);
  deletedTasks.forEach(task => {
    permanentlyDeleteTask(task);
  });
}

export function toggleCompleted(task) {

  task.completed = !task.completed;

  // this is necessary to properly position a task in the task array before the sort operation:
  //  - tasks that have been marked as completed should be positioned at the top of the completed list
  //  - tasks that have been marked as not completed should more to the bottom of the active list
  _tasks = _tasks.filter(i => i.id !== task.id);
  addTask(task, "top");
  
  sortTasks();
  saveTasks();
}

export function toggleFlagged(task) {
  task.flagged = !task.flagged;
  saveTasks();
}

// returns the previous task in the list
// if the task given is null, return null
// if the task given is the first task, return the first task
export function getPreviousTask(task, includeCompleted, includeDeleted) {

  let taskArray = getTasks(includeCompleted, includeDeleted);

  if (task === null) {
    return null;
  }

  let indexOfCurrentTask = taskArray.findIndex(i => i.id === task.id);
  if (indexOfCurrentTask === 0) {
    // task given is the first task
    return task;
  }
  
  return taskArray[indexOfCurrentTask-1];

}

// returns the next task in the list
// if the task given is null, return null
// if the task given is the last task, return the last task
export function getNextTask(task, includeCompleted, includeDeleted) {

  let taskArray = getTasks(includeCompleted, includeDeleted);

  if (task === null) {
      return null;
  }

  let indexOfCurrentTask = taskArray.findIndex(i => i.id === task.id);
  if (indexOfCurrentTask === taskArray.length-1) {
    // task given is the last task
    return task;
  }
  
  return taskArray[indexOfCurrentTask+1];

}