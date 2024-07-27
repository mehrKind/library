const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');

const {app, BrowserWindow, Notification, ipcMain, dialog} = electron;

// process.env.NODE_ENV = 'production';

let mainWindow;

// main window
app.on('ready', ()=>{
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
    mainWindow.on("closed", ()=>{
        app.quit();
    });

    // main menu template
    const mainMenu = electron.Menu.buildFromTemplate(mainMenuTemplate);
    electron.Menu.setApplicationMenu(mainMenu);

})

// create top menu
const mainMenuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label: "Add Book",
                accelerator: "F1",
                click(){
                    console.log('====================================');
                    console.log("add book");
                    console.log('====================================');
                }
            },
            {
                label: "Exit",
                accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
                click(){
                    app.quit();
                }
            }
        ]
    },
    {
        label : "view",
        submenu : [
            {
                label : "Full Screen",
                accelerator: "F11",
                click(){
                    mainWindow.maximize();
                }
            },
            {
                role: 'reload'
            }
        ]
    },
    {
        label : "Help",
        submenu : [
            {
                label : "Help",
                click(){

                }
            },
            {
                label : "Contact Us",
                click(){
                    notif = new Notification({
                        title: "تماس با ما",
                        body: "برای ارتباط با ما، با شماره همراه 09224850196 تماس حاصل کنید"
                    });
                    notif.show();
                }
            },
            {
                label: "Developer",
                click(){
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
    dialog.showSaveDialog({
        title: 'ذخیره کردن نوشته',
        defaultPath: 'noteFile.mehr',
        buttonLabel: 'save',
        filters: [{ name: 'Text Files', extensions: ['mehr'] }]
    }).then(result => {
        if (!result.canceled) {
            fs.writeFile(result.filePath, textToSave, 'utf-8', (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    }).catch(err => {
        console.error(err);
    });
});


// open notFile
ipcMain.on('open-text-file', (event) => {
    dialog.showOpenDialog({
        title: 'باز کردن نوشته',
        buttonLabel: 'Open',
        filters: [{ name: 'Text Files', extensions: ['mehr'] }],
        properties: ['openFile']
    }).then(result => {
        if (!result.canceled) {
            const filePath = result.filePaths[0];
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    event.reply('file-content', data);
                }
            });
        }
    }).catch(err => {
        console.error(err);
    });
});

// Add developer tools item if not in production
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
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