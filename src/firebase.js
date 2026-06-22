const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, onSnapshot } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config.js');

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Tracks Firestore doc IDs so syncTasks knows which docs to delete when a task is permanently removed.
const knownTaskIds = new Set();

// Batch-writes the full task list to Firestore and deletes docs for any permanently removed tasks.
// updatedAt is a client-side timestamp used for last-write-wins conflict resolution.
// _deviceId identifies the writing device so watchTasks can ignore server-acknowledgement events
// for our own writes (which arrive with hasPendingWrites: false and are otherwise indistinguishable
// from genuine remote changes).
async function syncTasks(userId, tasks, deviceId) {
  const ref = collection(db, 'users', userId, 'tasks');
  const batch = writeBatch(db);
  const currentIds = new Set(tasks.map(t => String(t.id)));

  for (const task of tasks) {
    batch.set(doc(ref, String(task.id)), { ...task, updatedAt: Date.now(), _deviceId: deviceId });
  }
  for (const id of knownTaskIds) {
    if (!currentIds.has(id)) batch.delete(doc(ref, id));
  }

  await batch.commit();
}

// Registers a Firestore listener and calls onChange(snapshot, remoteChanges) only when
// changes originated from another device (e.g. the Android app).
// Uses both hasPendingWrites and _deviceId to filter out our own writes at both stages:
//   - hasPendingWrites: true  → local write, not yet sent to server (skip)
//   - hasPendingWrites: false, _deviceId === ours → server ack of our own write (skip)
//   - hasPendingWrites: false, _deviceId !== ours → genuine remote change (process)
function watchTasks(userId, deviceId, onChange) {
  return onSnapshot(collection(db, 'users', userId, 'tasks'), (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'removed') knownTaskIds.delete(change.doc.id);
      else knownTaskIds.add(change.doc.id);
    });

    const remoteChanges = snapshot.docChanges().filter(
      change => !change.doc.metadata.hasPendingWrites && change.doc.data()._deviceId !== deviceId
    );
    if (remoteChanges.length === 0) return;
    onChange(snapshot, remoteChanges);
  });
}

module.exports = { syncTasks, watchTasks };
