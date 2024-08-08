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

// if the user not was online show the not connected internet
function updateConnectionStatus() {
    const onlineDiv = document.getElementById('connected-global');
    const offlineDiv = document.getElementById('notConnected-globalId');

    if (navigator.onLine) {
        onlineDiv.style.display = 'block';
        offlineDiv.style.display = 'none';
        // Optionally, you can make a request to a URL here to check connectivity
    } else {
        onlineDiv.style.display = 'none';
        offlineDiv.style.display = 'flex';
    }
}

// Initial check
updateConnectionStatus();

// Event listeners for online and offline events
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

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

// search in the table
function SearchTable() {
    var input, filter, table, tr, td, i, txtValue, SearchFor;
    input = document.getElementById("search_input");
    filter = input.value.toUpperCase();
    table = document.getElementById("table_books");
    tr = table.getElementsByTagName("tr");
    SearchFor = document.getElementById("inputState").value;

    // Determine the index of the selected search criterion
    var searchIndex;
    switch (SearchFor) {
        case "نام کتاب":
            searchIndex = 1; // Assuming the book name is in the first column
            break;
        case "نویسنده":
            searchIndex = 2; // Assuming the author is in the second column
            break;
        case "ناشر":
            searchIndex = 5; // Assuming the publisher is in the third column
            break;
        case "نوع کتاب":
            searchIndex = 4; // Assuming the type is in the fourth column
            break;
        default:
            searchIndex = 1; // Invalid selection
    }

    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[searchIndex];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// search for articles in the table
function SearchArticlesTable() {
    var input, filter, table, tr, td, i, j, txtValue;
    input = document.getElementById("article-search-input");
    filter = input.value.toUpperCase();
    table = document.getElementById("table_articles");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows (except the first one, which is usually the header)
    for (i = 1; i < tr.length; i++) {
        tr[i].style.display = "none"; // Hide the row by default
        td = tr[i].getElementsByTagName("td");
        
        // Loop through all cells in the row
        for (j = 0; j < td.length; j++) {
            if (td[j]) {
                txtValue = td[j].textContent || td[j].innerText;
                // Check if the cell contains the filter text
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = ""; // Show the row if a match is found
                    break; // No need to check other cells in this row
                }
            }
        }
    }
}



//! application database
// Load all books
ipcRenderer.send('show-all-books-dashboard');

// get author count
ipcRenderer.send('get-distinct-authors');
// In your renderer process
ipcRenderer.send('AllArticles');


ipcRenderer.on('show-all-books-reply', (event, response) => {
    if (response.success) {
        const books = response.books;
        const bookBody = document.getElementById('bookBody');

        // Clear existing content
        bookBody.innerHTML = '';

        // Set table headers
        const headers = ['id', 'bookName', 'author', 'translator', 'bookType', 'publishers', 'price', 'actions'];

        // Show the book count in the database
        document.getElementById("book_counter").innerHTML = books.length;

        // Populate table rows
        books.forEach(book => {
            const tr = document.createElement('tr');

            // Add data cells
            headers.forEach(header => {
                if (header !== 'actions') {
                    const td = document.createElement('td');
                    td.textContent = book[header];
                    tr.appendChild(td);
                }
            });

            // Add edit and detail buttons with images and Bootstrap classes
            const td = document.createElement('td');
            td.className = 'd-flex';
            td.style.gap = '5px';

            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm';
            editButton.onclick = () => handleEdit(book);
            const editIcon = document.createElement('img');
            editIcon.src = '../assets/images/iconamoon--edit-duotone.svg';
            editIcon.alt = 'Edit';
            editButton.appendChild(editIcon);

            const detailButton = document.createElement('button');
            detailButton.className = 'btn btn-secondary btn-sm';
            detailButton.onclick = () => handleDetail(book.id);
            const detailIcon = document.createElement('img');
            detailIcon.src = '../assets/images/ri--more-fill.svg';
            detailIcon.alt = 'Details';
            detailButton.appendChild(detailIcon);
            detailButton.setAttribute('data-bs-toggle', 'modal');
            detailButton.setAttribute('data-bs-target', '#bookDetailModal');

            td.appendChild(editButton);
            td.appendChild(detailButton);
            tr.appendChild(td);

            bookBody.appendChild(tr);
        });

    } else {
        console.error('Failed to load books:', response.message);
    }
});

function handleEdit(book) {
    console.log('Edit button clicked for book:', book);
    // Add your logic to handle the edit action here
}

function handleDetail(bookId) {
    ipcRenderer.send('get-book-details', bookId);
}

// create & show books from database into a table
ipcRenderer.on('get-book-details-reply', (event, response) => {
    if (response.success) {
        const book = response.book;
        document.querySelector('#bookDetailModal .modal-body').innerHTML = `
            <div class="row">
                <div class="col-md-5 text-center">
                    <div class="bookImg">
                        <img src=${book.banner ? book.banner : "../assets/images/book-default-cover.jpg"} alt="book image" style="width: 250px; height: 100%;">
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="bookContentDetail">
                        <p>نام کتاب: <span>${book.bookName}</span></p>
                        <p>نویسنده: <span>${book.author}</span></p>
                        <p>مترجم: <span>${book.translator ? book.translator : 'مشخص نیست'}</span></p>
                        <p>نوع کتاب: <span>${book.bookType}</span></p>
                        <p>ناشر: <span>${book.publishers}</span></p>
                        <p>قیمت: <span>${book.price}</span></p>
                        <p>توضیحات: <span>${book.content ? book.content : 'ندارد'}</span></p>
                        <p>تعداد کتاب: <span>${book.bookCount ? bookCount : 1}</span></p>
                        <p>لایک شده: <span>${book.isLike ? 'بله' : 'خیر'}</span></p>
                        <p>ذخیره شده: <span>${book.isSave ? 'بله' : 'خیر'}</span></p>
                    </div>
                </div>
            </div>
        `;
    } else {
        console.error('Failed to load book details:', response.message);
    }
});


// get the authors from database
ipcRenderer.on('get-distinct-authors-reply', (event, response) => {
    if (response.success) {
        const authors = response.authors;
        const authorCount = authors.length;

        // Show the author count in the database
        document.getElementById('author_counter').innerHTML = authorCount;
    } else {
        console.error('Failed to load distinct authors:', response.message);
    }
});

// show data from database (articles table)
ipcRenderer.on('get-all-articles-reply', (event, response) => {
    if (response.success) {
        const articles = response.articles;
        const articleBody = document.getElementById("articleBody");
    
        const headers = ['id', 'name', 'path', "actions"];
    
        articles.forEach(article => {
            const tr = document.createElement('tr');
    
            // Add data cells
            headers.forEach(header => {
                if (header !== 'actions') {
                    const td = document.createElement('td');
                    td.textContent = article[header]; // Corrected to access the current article
                    tr.appendChild(td);
                }
            });
    
            // Add edit and detail buttons with images and Bootstrap classes
            const td = document.createElement('td');
            td.className = 'd-flex';
            td.style.gap = '5px';
    
            const openBtn = document.createElement('button');
            openBtn.className = 'btn btn-secondary btn-sm';
            openBtn.onclick = () => handleOpenArticle(article.path); // Ensure handleDetail is defined
            openBtn.textContent = "باز کردن";

    
            td.appendChild(openBtn);
            tr.appendChild(td);
    
            articleBody.appendChild(tr);
        });    
        document.getElementById("articleCourseId").innerHTML = articles.length
    } else {
        console.error('Failed to load book details:', response.message);
    }
});

function handleOpenArticle(folderPath){
    ipcRenderer.send("openArticleFolder", folderPath)
}