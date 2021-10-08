const indexedDB =
window.indexedDB ||
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

// stores connected database object until connection is complete
let db;
//establishes a connection to IndexDB's database called 'budget' and sets it to version 1
//request variable acts as an event listener for the database
//indexDB.open opens connection to the database and creates event listener
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = (event) => {
let database = event.target.result;
database.createObjectStore('pending', {
    autoIncrement: true,
});
};

request.onerror = (err) => {
console.log(err.target.errorCode);
};

request.onsuccess = (event) => {
db = event.target.result;

if (navigator.onLine) {
    checkDatabase();
}
};

// This function is called in index.js when the user creates a transaction while offline.
function saveRecord(record) {
const transaction = db.transaction(['pending'], 'readwrite');
const store = transaction.objectStore('pending');
store.add(record);
}

// checkDatabase() is called when user goes online to send transactions(in database) to server
function checkDatabase() {
const transaction = db.transaction(['pending'], 'readwrite');
const store = transaction.objectStore('pending');
const getAll = store.getAll();

getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then(() => {
                const transaction = db.transaction(['pending'], 'readwrite');
                const store = transaction.objectStore('pending');
                store.clear();
            });
    }
};
}

// listens for app coming back online
window.addEventListener('online', checkDatabase);