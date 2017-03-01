'use strict';

const BABYLON = require('babylonjs');
const Renderer = require('incheon').render.Renderer;
const Utils= require('./../common/Utils');

const Missile = require('../common/Missile');
const Character = require('../common/Character');
const CharacterActor = require('./CharacterActor');

/**
 * Renderer for the MMORPG (Babylon.js)
 */
class MMORPGRenderer extends Renderer {

    get ASSETPATHS(){
        return {
            ship: 'assets/ship1.png',
            missile: 'assets/shot.png',
            bg1: 'assets/space3.png',
            bg2: 'assets/space2.png',
            bg3: 'assets/clouds2.png',
            bg4: 'assets/clouds1.png',
            smokeParticle: 'assets/smokeparticle.png'
        };
    }

    // TODO: document
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.sprites = {};
        this.isReady = false;

        // asset prefix
        this.assetPathPrefix = this.gameEngine.options.assetPathPrefix?this.gameEngine.options.assetPathPrefix:'';

        // these define how many gameWorlds the player ship has "scrolled" through
        this.bgPhaseX = 0;
        this.bgPhaseY = 0;
    }

    init() {

        //if (document.readyState === 'complete' || document.readyState === 'loaded' || document.readyState === 'interactive') {
            //this.onDOMLoaded();
        //} else {
            document.addEventListener('DOMContentLoaded', ()=>{
                this.onDOMLoaded();
            });
        //}

        return new Promise((resolve, reject)=>{
            //PIXI.loader.add(Object.keys(this.ASSETPATHS).map((x)=>{
                //return{
                    //name: x,
                    //url: this.assetPathPrefix + this.ASSETPATHS[x]
                //};
            //}))
            //.load(() => {
                //this.isReady = true;
                //this.initScene();
                //
            setTimeout(function(){
                this.gameEngine.emit('renderer.ready');

                if (Utils.isTouchDevice()){
                  document.body.classList.add('touch');
                } else if (isMacintosh()) {
                  document.body.classList.add('mac');
                } else if (isWindows()) {
                  document.body.classList.add('pc');
                }

                resolve();
            }.bind(this), 500);
            //});
        });
    }

    onDOMLoaded(){
        if (BABYLON.Engine.isSupported()) {
            this.initScene();
        }
    }

    initScene() {
        // Get canvas
        this.canvas = document.querySelector('#renderCanvas');
console.log(this.canvas);
        // Create babylon engine
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.engine.enableOfflineSupport = false;

        // Create scene
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.collisionsEnabled = true;


        // Create the camera
        //let camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0,4,-10), this.scene);
        //camera.setTarget(new BABYLON.Vector3(0,0,10));
        let camera = new BABYLON.ArcRotateCamera("CameraRotate", -Math.PI/2, Math.PI/2.2, 12, new BABYLON.Vector3(0, 4.8, 0), this.scene);
        camera.wheelPrecision = 15;
        camera.attachControl(this.canvas);

        this.camera = camera;

        // Create light
        let light = new BABYLON.PointLight("light", new BABYLON.Vector3(0,5,-5), this.scene);

        let ground = BABYLON.Mesh.CreateGround('ground1', this.gameEngine.worldSettings.width, this.gameEngine.worldSettings.height, 2, this.scene);
        var groundMaterial = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);
        ground.material = groundMaterial;
        ground.checkCollisions = true;


        this.isReady = true;
        //initGame();

    }

    draw() {
        super.draw();
        if (!this.isReady) return; // assets might not have been loaded yet


        //this.engine.runRenderLoop(function () {
            this.scene.render();
        //}.bind(this));
        //
        if (this.playerCharacter) {
            //meshPlayer.rotation.y = 4.69 - cameraArcRotative[0].alpha;
            this.camera.target.x = parseFloat(this.playerCharacter.position.x);
            this.camera.target.z = parseFloat(this.playerCharacter.position.z);
        }

        for (let objId of Object.keys(this.sprites)) {
            let objData = this.gameEngine.world.objects[objId];
            let sprite = this.sprites[objId];

            if (objData) {

                // if the object requests a "showThrust" then invoke it in the actor
                if ((sprite !== this.playerCharacter) && sprite.actor) {
                    //sprite.actor.thrustEmitter.emit = !!objData.showThrust;
                }

                if (objData.class == Character && sprite != this.playerCharacter) {
                    this.updateOffscreenIndicator(objData);
                }

                sprite.x = objData.x;
                sprite.y = objData.y;


                //// make the wraparound seamless for objects other than the player ship
                //if (sprite != this.playerCharacter && viewportSeesLeftBound && objData.x > this.viewportWidth - this.camera.x) {
                    //sprite.x = objData.x - worldWidth;
                //}
                //if (sprite != this.playerCharacter && viewportSeesRightBound && objData.x < -this.camera.x) {
                    //sprite.x = objData.x + worldWidth;
                //}
                //if (sprite != this.playerCharacter && viewportSeesTopBound && objData.y > this.viewportHeight - this.camera.y) {
                    //sprite.y = objData.y - worldHeight;
                //}
                //if (sprite != this.playerCharacter && viewportSeesBottomBound && objData.y < -this.camera.y) {
                    //sprite.y = objData.y + worldHeight;
                //}
            }

            if (sprite) {
                if (sprite.actor && sprite.actor.renderStep) {
                    sprite.actor.renderStep({"x":sprite.x, "y": sprite.y});
                }
            }

            // this.emit("postDraw");
        }

    }

    addObject(objData, options) {
        let mesh;

        if (objData.class == Character) {
            let characterActor = new CharacterActor(this);
            mesh = characterActor.mesh;
            this.sprites[objData.id] = mesh;
            mesh.id = objData.id;

            if (this.clientEngine.isOwnedByPlayer(objData)) {
                this.playerCharacter = mesh; // save reference to the player ship
                document.body.classList.remove('lostGame');
                if (!document.body.classList.contains('tutorialDone')){
                    document.body.classList.add('tutorial');
                }
                document.body.classList.remove('lostGame');
                document.body.classList.add('gameActive');
                document.querySelector('#tryAgain').disabled = true;
                document.querySelector('#joinGame').disabled = true;
                document.querySelector('#joinGame').style.opacity = 0;

                this.gameStarted = true; // todo state shouldn't be saved in the renderer

                // remove the tutorial if required after a timeout
                setTimeout(() => {
                    document.body.classList.remove('tutorial');
                }, 10000);
            } else {
                this.addOffscreenIndicator(objData);
            }

        } else if (objData.class == Missile) {
            sprite = new PIXI.Sprite(PIXI.loader.resources.missile.texture);
            this.sprites[objData.id] = sprite;

            sprite.width = 81 * 0.5;
            sprite.height = 46 * 0.5;

            sprite.anchor.set(0.5, 0.5);
        }

        mesh.position.x = objData.x;
        //mesh.position.y = objData.y;
        mesh.position.z = objData.y;

        Object.assign(mesh, options);

        return mesh;
    }

    removeObject(obj) {
        if (this.playerCharacter && obj.id == this.playerCharacter.id) {
            this.playerCharacter = null;
        }

        if (obj.class == Character && this.playerCharacter && obj.id != this.playerCharacter.id) {
            this.removeOffscreenIndicator(obj);

        }

        let sprite = this.sprites[obj.id];
        if (sprite.actor) {
            // removal "takes time"
            sprite.actor.destroy().then(()=>{
                console.log('deleted sprite');
                delete this.sprites[obj.id];
            });
        } else{
            this.sprites[obj.id].destroy();
            delete this.sprites[obj.id];
        }
    }

    /**
     * Centers the viewport on a coordinate in the gameworld
     * @param {Number} targetX
     * @param {Number} targetY
     */
    centerCamera(targetX, targetY) {
        if (isNaN(targetX) || isNaN(targetY)) return;
        if (!this.lastCameraPosition){
            this.lastCameraPosition = {};
        }

        this.lastCameraPosition.x = this.camera.x;
        this.lastCameraPosition.y = this.camera.y;

        this.camera.x = this.viewportWidth / 2 - targetX;
        this.camera.y = this.viewportHeight / 2 - targetY;
        this.lookingAt.x = targetX;
        this.lookingAt.y = targetY;
    }

    addOffscreenIndicator(objData) {
        let container = document.querySelector('#offscreenIndicatorContainer');
        let indicatorEl = document.createElement('div');
        indicatorEl.setAttribute('id', 'offscreenIndicator' + objData.id);
        indicatorEl.classList.add('offscreenIndicator');
        container.appendChild(indicatorEl);
    }

    updateOffscreenIndicator(objData){
        // player ship might have been destroyed
        if (!this.playerCharacter) return;

        let indicatorEl = document.querySelector('#offscreenIndicator' + objData.id);
        if (!indicatorEl) {
            console.error(`No indicatorEl found with id ${objData.id}`);
            return;
        }
        let playerCharacterObj = this.gameEngine.world.objects[this.playerCharacter.id];
        let slope = (objData.y - playerCharacterObj.y) / (objData.x - playerCharacterObj.x);
        let b = this.viewportHeight/ 2;

        // this.debug.clear();
        // this.debug.lineStyle(1, 0xFF0000 ,1);
        // this.debug.moveTo(this.viewportWidth/2,this.viewportHeight/2);
        // this.debug.lineTo(this.viewportWidth/2 + b/-slope, 0);
        // this.debug.endFill();

        let padding = 30;
        let indicatorPos = { x: 0, y: 0 };

        if (objData.y < playerCharacterObj.y - this.viewportHeight/2) {
            indicatorPos.x = this.viewportWidth/2 + (padding - b)/slope;
            indicatorPos.y = padding;
        } else if (objData.y > playerCharacterObj.y + this.viewportHeight/2) {
            indicatorPos.x = this.viewportWidth/2 + (this.viewportHeight - padding - b)/slope;
            indicatorPos.y = this.viewportHeight - padding;
        }

        if (objData.x < playerCharacterObj.x - this.viewportWidth/2) {
            indicatorPos.x = padding;
            indicatorPos.y = slope * (-this.viewportWidth/2 + padding) + b;
        } else if (objData.x > playerCharacterObj.x + this.viewportWidth/2) {
            indicatorPos.x = this.viewportWidth - padding;
            indicatorPos.y = slope * (this.viewportWidth/2 - padding) + b;
        }

        if (indicatorPos.x == 0 && indicatorPos.y == 0){
            indicatorEl.style.opacity = 0;
        } else {
            indicatorEl.style.opacity = 1;
            let rotation = Math.atan2(objData.y - playerCharacterObj.y, objData.x - playerCharacterObj.x);
            rotation = rotation * 180/Math.PI; // rad2deg
            indicatorEl.style.transform = `translateX(${indicatorPos.x}px) translateY(${indicatorPos.y}px) rotate(${rotation}deg) `;
        }
    }

    removeOffscreenIndicator(objData) {
        let indicatorEl = document.querySelector('#offscreenIndicator'+objData.id);
        indicatorEl.parentNode.removeChild(indicatorEl);
    }

    updateHUD(data){
        if (data.RTT){ qs('.latencyData').innerHTML = data.RTT;}
        if (data.RTTAverage){ qs('.averageLatencyData').innerHTML = truncateDecimals(data.RTTAverage, 2);}
    }

    updateScore(data){
        let scoreContainer = qs('.score');
        let scoreArray = [];

        // remove score lines with objects that don't exist anymore
        let scoreEls = scoreContainer.querySelectorAll('.line');
        for (let x=0; x < scoreEls.length; x++){
            if (data[scoreEls[x].dataset.objId] == null){
                scoreEls[x].parentNode.removeChild(scoreEls[x]);
            }
        }

        for (let id of Object.keys(data)){
            let scoreEl = scoreContainer.querySelector(`[data-obj-id='${id}']`);
            // create score line if it doesn't exist
            if (scoreEl == null){
                scoreEl = document.createElement('div');
                scoreEl.classList.add('line');
                if (this.playerShip && this.playerShip.id == parseInt(id)) scoreEl.classList.add('you');
                scoreEl.dataset.objId = id;
                scoreContainer.appendChild(scoreEl);
            }

            // stupid string/number conversion
            if (this.sprites[parseInt(id)])
                this.sprites[parseInt(id)].actor.changeName(data[id].name);

            scoreEl.innerHTML = `${data[id].name}: ${data[id].kills}`;

            scoreArray.push({
                el: scoreEl,
                data: data[id]
            });
        }

        scoreArray.sort((a, b) => {return a.data.kills < b.data.kills;});

        for (let x=0; x < scoreArray.length; x++){
            scoreArray[x].el.style.transform = `translateY(${x}rem)`;
        }

    }

    onKeyChange(e){
        if (this.playerCharacter) {
            if (e.keyName === 'up') {
                this.playerCharacter.actor.move(e.isDown);
            }
        }
    }

    enableFullScreen(){
        let isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
            (document.mozFullScreen || document.webkitIsFullScreen);

        let docElm = document.documentElement;
        if (!isInFullScreen) {

            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            } else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            } else if (docElm.webkitRequestFullScreen) {
                docElm.webkitRequestFullScreen();
            }
        }
    }

    /*
     * Takes in game coordinates and translates them into screen coordinates
     * @param obj an object with x and y properties
     */
    gameCoordsToScreen(obj){
        // console.log(obj.x , this.viewportWidth / 2 , this.camera.x)
        return {
            x: obj.x + this.camera.x,
            y: obj.y + this.camera.y
        };
    }

}

function getCentroid(objects) {
    let maxDistance = 500; // max distance to add to the centroid
    let shipCount = 0;
    let centroid = { x: 0, y: 0 };
    let selectedShip = null;

    for (let id of Object.keys(objects)){
        let obj = objects[id];
        if (obj.class == Ship) {
            if (selectedShip == null)
                selectedShip = obj;

            let objDistance = Math.sqrt( Math.pow((selectedShip.x-obj.y), 2) + Math.pow((selectedShip.y-obj.y), 2));
            if (selectedShip == obj || objDistance < maxDistance) {
                centroid.x += obj.x;
                centroid.y += obj.y;
                shipCount++;
            }
        }
    }

    centroid.x /= shipCount;
    centroid.y /= shipCount;


    return centroid;
}

// convenience function
function qs(selector) { return document.querySelector(selector);}

function truncateDecimals(number, digits) {
    let multiplier = Math.pow(10, digits);
    let adjustedNum = number * multiplier;
    let truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
};

function isMacintosh() {
    return navigator.platform.indexOf('Mac') > -1;
}

function isWindows() {
    return navigator.platform.indexOf('Win') > -1;
}

module.exports = MMORPGRenderer;
