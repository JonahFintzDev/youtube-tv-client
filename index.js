const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            
        }
    });
    // pressing alt can bring up the menu bar even when its hidden. This accounts for that and disables it entirely
    win.setMenu(null);

    win.loadURL('https://youtube.com/tv', {
        userAgent: 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1'
    });

    // Hide mouse cursor after page loads
    win.webContents.on('did-finish-load', () => {
        win.webContents.insertCSS('body, html { cursor: none !important; }');
    });


}

app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport');
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let isInit = false;
const KeyMapping= {
    0: 'Enter',
    1: 'Escape',
    12: 'Up',
    13: 'Down',
    14: 'Left',
    15: 'Right',
}
app.on('web-contents-created',async  (event, contents) => {
    try {
          if(isInit) return;

    isInit = true;
    const pressedKeys = new Set();
        // Listen  forgamepad inputs in the renderer process
        setInterval(async () => {
            const newPressedKeys = await getNewGamepadKeyDown();

            // Check for newly pressed keys
            newPressedKeys.forEach(key => {
                if (!pressedKeys.has(key)) {
                    console.log('New key pressed:', key);
                    // Handle the new key press (e.g., simulate a key event)

                    if(KeyMapping[key]){
                        console.log('Mapped key pressed:', KeyMapping[key]);
                        contents.sendInputEvent({ type: 'keyDown', keyCode: KeyMapping[key] });
                        contents.sendInputEvent({ type: 'keyUp', keyCode: KeyMapping[key] });
                    }

                    pressedKeys.add(key);
                }
            });

            // Remove keys that are no longer pressed
            pressedKeys.forEach(key => {
                if (!newPressedKeys.includes(key)) {
                    pressedKeys.delete(key);
                }
            });
        }, 16);
        
        const getNewGamepadKeyDown =async  () => {
            return contents.executeJavaScript(`
                {
                    const getKeyDown = () => {
                        const gamepads = navigator.getGamepads();
                        let pressedKeys = [];
                        for (let i = 0; i < gamepads.length; i++) {
                            const gamepad = gamepads[i];
                            if (gamepad) {
                                for (let j = 0; j < gamepad.buttons.length; j++) {
                                    if (gamepad.buttons[j].pressed) {
                                        pressedKeys.push(j);
                                    }
                                }
                            }
                        }
                        return pressedKeys;
                    }

                    getKeyDown();
                }

            `);
        }
    } catch (error) {
        console.error('Error setting up gamepad listener:', error);
    }
  
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
