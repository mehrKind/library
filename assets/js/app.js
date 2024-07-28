const fs = require('fs');
const path = require("path")
const {
    ipcRenderer,
    shell
} = require('electron');

// open tabs in the main page
function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Set the default active tab
document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".tablinks").click();
});

const todayDashboard = document.getElementById("todayDashboard");

let options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
};
let today = new Date().toLocaleDateString('fa-IR', options);
todayDashboard.innerHTML = today

const myModal = new bootstrap.Modal(
    document.getElementById("modalId"),
    options,
);


// save books data to the json file
document.getElementById('saveBookButton').addEventListener('click', function () {
    // Get form data here and call the updateJsonData function
    const formData = {
        bookName: document.getElementById('bookName').value,
        author: document.getElementById('author').value,
        bookType: document.getElementById('bookType').value,
        publishers: document.getElementById('publishers').value,
        publishCount: document.getElementById('publishCount').value,
        publishYear: document.getElementById('publishYear').value,
        price: document.getElementById('price').value,
        content: document.getElementById('content').value
    };

    // Call the updateJsonData function with the form data
    updateJsonData(formData);
});

// write the note text
document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const textToSave = document.getElementById('noteArea').value;
    ipcRenderer.send('save-text-file', textToSave);
});

// open the note text
document.getElementById('openNoteBtn').addEventListener('click', () => {
    ipcRenderer.send('open-text-file');
});

ipcRenderer.on('file-content', (event, data) => {
    document.getElementById('noteArea').value = data;
});

// clear the textarea
const clearBtn = document.getElementById('cleareNoteBtn');
const textAreaInput = document.getElementById('noteArea');

clearBtn.addEventListener('click', () => {
    textAreaInput.value = ''; // Set the value of the textarea to an empty string
});

// share text to telegram
document.getElementById('shareNoteBtn').addEventListener('click', () => {
    const textToShare = document.getElementById('noteArea').value;
    const telegramBaseUrl = 'https://t.me/share/url';
    const encodedText = encodeURIComponent(textToShare);
    const telegramShareUrl = `${telegramBaseUrl}?text=${encodedText}`;

    shell.openExternal(telegramShareUrl);
});

// see the count of the text mehr file
function updateMehrFileCount() {
    ipcRenderer.send('count-mehr-files');
}

ipcRenderer.on('mehr-file-count', (event, count) => {
    document.getElementById('noteCount').textContent = count;
});

document.getElementById('dashboardID').addEventListener('click', updateMehrFileCount);

// Initial count on page load
updateMehrFileCount();


//! application database
// Load all books
ipcRenderer.send('show-all-books');

ipcRenderer.on('show-all-books-reply', (event, response) => {
    if (response.success) {
        const books = response.books;
        const bookHeader = document.getElementById('bookHeader');
        const bookBody = document.getElementById('bookBody');

        // Clear existing content
        bookHeader.innerHTML = '';
        bookBody.innerHTML = '';

        // Set table headers
        const headers = Object.keys(books[0]);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            bookHeader.appendChild(th);
        });

        // Populate table rows
        books.forEach(book => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = book[header];
                tr.appendChild(td);
            });
            bookBody.appendChild(tr);
        });
    } else {
        console.error('Failed to load books:', response.message);
    }
});