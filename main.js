const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

const {
    app,
    BrowserWindow,
    Notification,
    ipcMain,
    dialog
} = electron;
let db = new sqlite3.Database('database.db');

// process.env.NODE_ENV = 'production';

let mainWindow;

// main window
app.on('ready', () => {
    // app config
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        title: "کتابخانه مهر",
        show: false,
        icon: path.join(__dirname, 'assets/icon', 'icon.ico')
    });

    // mainWindow.webContents.on('did-finish-load', () => {
    //     db.all("SELECT id, author FROM books", (err, rows) => {
    //         if (err) {
    //             console.error(err.message);
    //             return;
    //         }
    //         mainWindow.webContents.send('people-data', rows);
    //     });
    // });
    // max the width and height
    mainWindow.maximize();
    // show the page after getting maximoze
    mainWindow.show();
    // show the main page html file
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "/templates/mainWindow.html"),
        protocol: "file",
        slashes: true
    }));

    // close app
    mainWindow.on("closed", () => {
        app.quit();
    });

    // main menu template
    const mainMenu = electron.Menu.buildFromTemplate(mainMenuTemplate);
    electron.Menu.setApplicationMenu(mainMenu);




})

// create top menu
const mainMenuTemplate = [{
        label: "File",
        submenu: [{
                label: "Add Book",
                accelerator: "F1",
                click() {
                    console.log('====================================');
                    console.log("add book");
                    console.log('====================================');
                }
            },
            {
                label: "Exit",
                accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: "view",
        submenu: [{
                label: "Full Screen",
                accelerator: "F11",
                click() {
                    mainWindow.maximize();
                }
            },
            {
                role: 'reload'
            }
        ]
    },
    {
        label: "Help",
        submenu: [{
                label: "Help",
                click() {

                }
            },
            {
                label: "Contact Us",
                click() {
                    notif = new Notification({
                        title: "تماس با ما",
                        body: "برای ارتباط با ما، با شماره همراه 09224850196 تماس حاصل کنید"
                    });
                    notif.show();
                }
            },
            {
                label: "Developer",
                click() {
                    notif = new Notification({
                        title: "توسعه دهنده",
                        body: "برای ارتباط با توسعه دهنده این اپلیکیشن با شماره 09224850196 تماس بگیرید. علیرضا مهربان"
                    });
                    notif.show();
                }
            }
        ]
    }
]

// Listen for the close-app event
ipcMain.on('close-app', () => {
    app.quit();
});


// Listen for 'form-data' event from the renderer process
ipcMain.on('form-data', (event, formData) => {
    // Call the updateJsonData function with the received form data
    updateJsonData(formData);
});

// save ntoe
ipcMain.on('save-text-file', (event, textToSave) => {
    const defaultDirectory = 'C:\\lib_mehr';
    const defaultFileName = 'noteFile.mehr';

    // Ensure the directory exists, if not create it
    fs.mkdir(defaultDirectory, {
        recursive: true
    }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return;
        }

        // Show save dialog with the default path set to the specified directory
        dialog.showSaveDialog({
            title: 'ذخیره کردن نوشته',
            defaultPath: path.join(defaultDirectory, defaultFileName),
            buttonLabel: 'save',
            filters: [{
                name: 'Text Files',
                extensions: ['mehr']
            }]
        }).then(result => {
            if (!result.canceled) {
                const filePath = result.filePath;
                // Write the file
                fs.writeFile(filePath, textToSave, 'utf-8', (err) => {
                    if (err) {
                        console.error('Error saving file:', err);
                    } else {
                        console.log('File saved successfully!');
                    }
                });
            }
        }).catch(err => {
            console.error('Error showing save dialog:', err);
        });
    });
});

// open file
ipcMain.on('open-text-file', (event) => {
    const defaultDirectory = 'C:\\lib_mehr';

    // Ensure the directory exists, if not create it
    fs.mkdir(defaultDirectory, {
        recursive: true
    }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return;
        }

        // Show open dialog with the default path set to the specified directory
        dialog.showOpenDialog({
            title: 'باز کردن نوشته',
            defaultPath: defaultDirectory,
            buttonLabel: 'Open',
            filters: [{
                name: 'Text Files',
                extensions: ['mehr']
            }],
            properties: ['openFile']
        }).then(result => {
            if (!result.canceled) {
                const filePath = result.filePaths[0];
                // Read the file
                fs.readFile(filePath, 'utf-8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                    } else {
                        event.reply('file-content', data);
                    }
                });
            }
        }).catch(err => {
            console.error('Error showing open dialog:', err);
        });
    });
});

// see the count of the *.mehr file in the dir
const defaultDirectory = 'C:\\lib_mehr';

ipcMain.on('count-mehr-files', (event) => {
    // Ensure the directory exists
    fs.mkdir(defaultDirectory, {
        recursive: true
    }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return;
        }

        // Read the directory
        fs.readdir(defaultDirectory, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }

            // Count the .mehr files
            const mehrFileCount = files.filter(file => path.extname(file) === '.mehr').length;

            // Send the count back to the renderer process
            event.reply('mehr-file-count', mehrFileCount);
        });
    });
});


//? database Part
function showAllBooks(event) {
    const query = 'SELECT * FROM books';
    db.all(query, [], (err, rows) => {
        if (err) {
            event.reply('show-all-books-reply', {
                success: false,
                message: err.message
            });
        } else {
            event.reply('show-all-books-reply', {
                success: true,
                books: rows
            });
        }
    });
}

function addBook(event, bookData) {
    const query = `
        INSERT INTO books (bookName, bookCount, author, translator, bookType, publishers, publishCount, publishYear, price, content, colsbanner)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        bookData.bookName, bookData.bookCount, bookData.author, bookData.translator, bookData.bookType,
        bookData.publishers, bookData.publishCount, bookData.publishYear, bookData.price, bookData.content, bookData.colsbanner
    ];
    db.run(query, params, function (err) {
        if (err) {
            event.reply('add-book-reply', {
                success: false,
                message: err.message
            });
        } else {
            event.reply('add-book-reply', {
                success: true,
                bookId: this.lastID
            });
        }
    });
}

// Event listeners for the renderer process
ipcMain.on('show-all-books', (event) => showAllBooks(event));
ipcMain.on('add-book', (event, bookData) => addBook(event, bookData));

// close database before exit
app.on('before-quit', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err.message);
        }
    });
});


// Add developer tools item if not in production
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [{
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
}