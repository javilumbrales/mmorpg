const Howler = require('howler'); // eslint-disable-line no-unused-vars
const ClientEngine = require('incheon').ClientEngine;
const MobileControls = require('../client/MobileControls');
const KeyboardControls = require('../client/KeyboardControls');
const MouseControls = require('../client/MouseControls');
const Character = require('../common/Character');
const NPC = require('../common/NPC');
const Utils = require('./../common/Utils');

class MMORPGClientEngine extends ClientEngine {
    constructor(gameEngine, options, Renderer) {
        super(gameEngine, options, Renderer);

        this.renderer.debugMode = options.debug;

        this.serializer.registerClass(require('../common/Character'));
        this.serializer.registerClass(require('../common/NPC'));
        this.serializer.registerClass(require('../common/Mob'));

        this.gameEngine.on('client__preStep', this.preStep.bind(this));
    }

    start() {

        super.start();

        this.gameEngine.on('attacking', (data) => {
            console.log('received attacking');
            this.updateStatus({"status": 'standard', "message": data.msg});
        });
        // handle gui for game condition
        this.gameEngine.on('objectDestroyed', (obj) => {
            if (obj.class == Character && this.isOwnedByPlayer(obj)) {
                document.body.classList.add('lostGame');
                document.querySelector('#tryAgain').disabled = false;
            }
        });

        this.gameEngine.once('renderer.ready', () => {
            // click event for "try again" button
            document.querySelector('#tryAgain').addEventListener('click', () => {
                if (Utils.isTouchDevice()){
                    this.renderer.enableFullScreen();
                }
                this.socket.emit('requestRestart');
            });

            document.querySelector('#joinGame').addEventListener('click', () => {
                if (Utils.isTouchDevice()){
                    this.renderer.enableFullScreen();
                }
                this.socket.emit('requestRestart');
            });

            document.querySelector('#reconnect').addEventListener('click', () => {
                window.location.reload();
            });

            //  Game input
            if (Utils.isTouchDevice()){
                this.controls = new MobileControls(this.renderer);
            } else {
                //this.controls = new KeyboardControls(this.renderer);
                this.controls = new MouseControls(this.renderer);
            }

            this.renderer.on('attack', () => {
                this.sendInput('attack');
            });
            this.renderer.on('shield', () => {
                this.sendInput('shield');
            });
            this.renderer.on('heal', () => {
                this.sendInput('heal');
            });
            this.renderer.on('target', (e) => {
                this.sendInput('target', e);
            });
            this.renderer.on('teleport', (e) => {
                this.sendInput('teleport', e);
            });

        });

        this.networkMonitor.on('RTTUpdate', (e) => {
            this.renderer.updateHUD(e);
        });
    }

    // extend ClientEngine connect to add own events
    connect() {
        return super.connect().then(() => {
            this.socket.on('statusUpdate', (e) => {
                this.renderer.updateStatus(e);
            });
            this.socket.on('connectedPlayers', (e) => {
                this.renderer.setNames(e, 4);
            });

            this.socket.on('disconnect', (e) => {
                console.log('disconnected');
                document.body.classList.add('disconnected');
                document.body.classList.remove('gameActive');
                document.querySelector('#reconnect').disabled = false;
            });

            if ('autostart' in Utils.getUrlVars()) {
                this.socket.emit('requestRestart');
            }
        });
    }

    // our pre-step is to process inputs that are "currently pressed" during the game step
    preStep() {
        if (this.controls) {
            if (this.renderer.playerCharacter && this.controls.destinations.length) {
                let destination = this.controls.destinations.pop();
                this.sendInput('move', { "destination": destination, movement: true });
            }

            //if (this.controls.activeInput.left) {
                //this.sendInput('left', { movement: true });
            //}

            //if (this.controls.activeInput.right) {
                //this.sendInput('right', { movement: true });
            //}
        }
    }

}

module.exports = MMORPGClientEngine;
