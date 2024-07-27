const fs = require('fs');
const path = require("path")
const { ipcRenderer, shell } = require('electron');

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

// get data from the lib data.json file
fetch("./library_data.json")
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        display_books(data);
        const book_counter = document.getElementById("book_counter");
        book_counter.innerHTML = data.length;

    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });


function display_books(data) {
    const tableHeader = document.getElementById("bookHeader");
    const tableBody = document.getElementById("bookBody");
    
    
    // Clear previous content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (data.length === 0) {
        console.error('No data found');
        return;
    }
    
    // create table header
    const headers = Object.keys(data[0]).filter(header => (header !== 'content') && (header !== 'bookCount'));
    

    // headers.forEach(header => {
    //     const th = document.createElement('th');
    //     th.textContent = header;
    //     tableHeader.appendChild(th);
    // });

    // Create table rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Function to update JSON data with form values
const updateJsonData = (formData) => {
    const filePath = path.join(__dirname, 'data.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        const jsonData = JSON.parse(data);

        const maxId = jsonData.reduce((max, entry) => (entry.id > max ? entry.id : max), 0);
        const newId = maxId + 1;

        const newFormData = {
            id: newId,
            bookName: formData.bookName,
            // Add other form fields here
        };

        jsonData.push(newFormData);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('Data updated successfully!');
        });
    });
};

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