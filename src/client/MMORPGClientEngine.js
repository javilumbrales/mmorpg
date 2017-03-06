const Howler = require('howler'); // eslint-disable-line no-unused-vars
const ClientEngine = require('incheon').ClientEngine;
const MMORPGRenderer = require('../client/MMORPGRenderer');
const MobileControls = require('../client/MobileControls');
const KeyboardControls = require('../client/KeyboardControls');
const MouseControls = require('../client/MouseControls');
const Character = require('../common/Character');
const Utils = require('./../common/Utils');

class MMORPGClientEngine extends ClientEngine {
    constructor(gameEngine, options) {
        super(gameEngine, options);

        // initialize renderer
        this.renderer = new MMORPGRenderer(gameEngine, this);

        this.serializer.registerClass(require('../common/Character'));
        this.serializer.registerClass(require('../common/Missile'));

        this.gameEngine.on('client__preStep', this.preStep.bind(this));
    }

    start() {

        super.start();

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

        });

        // allow a custom path for sounds
        let assetPathPrefix = this.options.assetPathPrefix ? this.options.assetPathPrefix : '';

        // handle sounds
        this.sounds = {
            missileHit: new Howl({ src: [assetPathPrefix + 'assets/audio/193429__unfa__projectile-hit.mp3'] }),
            fireMissile: new Howl({ src: [assetPathPrefix + 'assets/audio/248293__chocobaggy__weird-laser-gun.mp3'] })
        };

        this.gameEngine.on('fireMissile', () => { this.sounds.fireMissile.play(); });
        this.gameEngine.on('missileHit', () => {
            // don't play explosion sound if the player is not in game
            if (this.renderer.playerCharacter) {
                this.sounds.missileHit.play();
            }
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
