'use strict';

const BABYLON = require('babylonjs');
const Renderer = require('incheon').render.Renderer;
const Utils= require('./../common/Utils');

const Character = require('../common/Character');
const CharacterActor = require('./CharacterActor');
const NPC = require('../common/NPC');
const NPCActor = require('./NPCActor');
const Mob = require('../common/Mob');
const MobActor = require('./MobActor');
//const TreeGenerator = require('./TreeGenerator');
const randomColor = require('./randomColor');
const RenderLoader = require('./RenderLoader');

/**
 * Renderer for the MMORPG (Babylon.js)
 */
class MMORPGRenderer extends Renderer {

    // TODO: document
    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        this.meshes = {};
        this.isReady = false;

        // these define how many gameWorlds the player ship has "scrolled" through
        this.bgPhaseX = 0;
        this.bgPhaseY = 0;
    }

    init() {

        return new Promise((resolve, reject)=>{
            document.addEventListener('DOMContentLoaded', ()=>{

                if (Utils.isTouchDevice()){
                  document.body.classList.add('touch');
                } else if (isMacintosh()) {
                  document.body.classList.add('mac');
                } else if (isWindows()) {
                  document.body.classList.add('pc');
                }

                this.onDOMLoaded(
                        function() {
                            this.gameEngine.emit('renderer.ready');
                            document.body.classList.add('gameLoaded');
                            this.initScene();
                            resolve();
                        }.bind(this)
                );
            });
        });
    }

    onDOMLoaded(readyCallback){
        if (BABYLON.Engine.isSupported()) {
            // Get canvas
            this.canvas = document.querySelector('#renderCanvas');
            // Create babylon engine
            this.engine = new BABYLON.Engine(this.canvas, true);
            this.engine.enableOfflineSupport = false;

            // Create scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.collisionsEnabled = true;

            this.loader = new RenderLoader(this.engine, this.scene, readyCallback);
            this.loader.preloadAssets(readyCallback);
            this.setupListeners();
        }
    }

    setupListeners() {

        let skills = document.querySelectorAll('.skill');

        for (let i = 0; i < skills.length; i++) {
            skills[i].addEventListener('mousedown', (e) => {
                let action = e.currentTarget.attributes['class'].value.replace('skill', '').trim();
                this.emit(action);
                e.preventDefault();
            });
        }
        document.querySelector('#cancel-target').addEventListener('click', (e) => {
            this.playerCharacter.target = null;
            document.querySelector('.target-hp-bar').style.opacity = 0;
        });

        document.querySelector('.hp-bar').addEventListener('click', (e) => {
            this.setTarget(this.playerCharacter);
        });

    }

    initScene() {

        // Create the camera
        //let camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0,4,-10), this.scene);
        //camera.setTarget(new BABYLON.Vector3(0,0,10));
        let camera = new BABYLON.ArcRotateCamera('', 1.11, 1.18, 800, new BABYLON.Vector3(0, 0, 0), this.scene);
        camera.attachControl(this.engine.getRenderingCanvas());
        camera.wheelPrecision *= 10;

        this.camera = camera;

        // helper object to show current position of cursor in 3d space
        this.cursor = BABYLON.Mesh.CreateBox('cursor', 0.3, this.scene);

        // Create light
        //let light = new BABYLON.PointLight("light", new BABYLON.Vector3(0,5,-5), this.scene);
        var light0 = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 1, 0), this.scene);
        light0.diffuse = new BABYLON.Color3(1, 1, 1);
        light0.specular = new BABYLON.Color3(1, 1, 1);
        light0.groundColor = new BABYLON.Color3(0, 0, 0);

        //Terrain texture
        var extraGround = BABYLON.Mesh.CreateGround("extraGround", this.gameEngine.worldSettings.width, this.gameEngine.worldSettings.height, 1, this.scene, false);
        var extraGroundMaterial = new BABYLON.StandardMaterial("extraGround", this.scene);
        extraGroundMaterial.diffuseTexture = new BABYLON.Texture("assets/images/ground.jpg", this.scene);
        extraGroundMaterial.diffuseTexture.uScale = 60;
        extraGroundMaterial.diffuseTexture.vScale = 60;
        extraGround.position.y = -1;
        extraGround.material = extraGroundMaterial;
        extraGround.checkCollisions = true;
        extraGround.receiveShadows = true;

        //Ground
        //var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", 'assets/images/heightMap.png', 100, 100, 40, 0, 10, this.scene, false, null );
        var groundMaterial = new BABYLON.StandardMaterial("ground", this.scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("assets/images/ground.jpg", this.scene);
        groundMaterial.diffuseTexture.uScale = 6;
        groundMaterial.diffuseTexture.vScale = 6;
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        //ground.position.y = -1.0;
        //ground.material = groundMaterial;
        groundMaterial.checkCollisions = true;
        //ground.checkCollisions = true;

        // Fog
        //this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        //this.scene.fogDensity = 0.003;
        //this.scene.fogColor = new BABYLON.Color3(0.8,0.83,0.8);

        // The trunk color

        /*
        var trunkColor = randomColor({hue: 'orange',luminosity: 'dark', format: 'rgbArray'});
        let trunkMaterial = new BABYLON.StandardMaterial("trunk", this.scene);
        trunkMaterial.diffuseColor = BABYLON.Color3.FromInts(trunkColor[0],trunkColor[1],trunkColor[2]);
        trunkMaterial.specularColor = BABYLON.Color3.Black();
        for (var i = 0; i < 50; i++) {
            // The color of the foliage
            var branchColor = randomColor({hue: 'green', luminosity: 'darl', format: 'rgbArray'});
            let leafMaterial = new BABYLON.StandardMaterial("mat", this.scene);
            leafMaterial.diffuseColor = BABYLON.Color3.FromInts(branchColor[0],branchColor[1],branchColor[2]);
            leafMaterial.specularColor = BABYLON.Color3.Black();
            var tree =  TreeGenerator(this.getRand(6, 12), this.getRand(60, 80), trunkMaterial, leafMaterial, this.scene);
            tree.position.x = this.getRand(-this.gameEngine.worldSettings.width / 2, this.gameEngine.worldSettings.width / 2);
            tree.position.z = this.getRand(-this.gameEngine.worldSettings.height / 2, this.gameEngine.worldSettings.height / 2);
            tree.position.y = 15;
            tree.checkCollisions = true;
        }*/


        // Animate the camera at start
        var easing = new BABYLON.QuinticEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        var time = 60 * 3;
        BABYLON.Animation.CreateAndStartAnimation('camera.alpha', this.scene.activeCamera, 'alpha', 60, time, 1.11 * 2, -1, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);
        BABYLON.Animation.CreateAndStartAnimation('camera.beta', this.scene.activeCamera, 'beta', 60, time, 1.18 * 2, 1.20, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);
        BABYLON.Animation.CreateAndStartAnimation('camera.radius', this.scene.activeCamera, 'radius', 60, time, 800, 50, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);


        this.isReady = true;
        //initGame();

    }

    getRand(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    centerCamera(position) {
        this.camera.target.x = parseFloat(position.x);
        this.camera.target.z = parseFloat(position.z);
    }

    draw() {
        super.draw();

        if (!this.isReady) return; // assets might not have been loaded yet


        this.scene.render();
        // Center camera
        if (this.playerCharacter) {
            this.centerCamera(this.playerCharacter.position);
            if (this.playerCharacter.target) {
                let playerTarget = this.gameEngine.world.objects[this.playerCharacter.target];
                this.showTargetHeal(playerTarget);

                if (playerTarget && playerTarget.health == 0 && !this.clearingTarget) {
                    this.clearingTarget = true;
                    setTimeout(()=> {
                        this.playerCharacter.target = null;
                        document.querySelector('.target-hp-bar').style.opacity = 0;
                        this.clearingTarget = false;
                    }, 1000);
                }
            }
            this.playerCharacter.actor.showHeal();
        }

        for (let objId of Object.keys(this.meshes)) {
            let objData = this.gameEngine.world.objects[objId];
            let sprite = this.meshes[objId];

            if (objData) {

                sprite.x = objData.x;
                sprite.y = objData.height;
                sprite.z = objData.y;
            }

            if (sprite) {
                if (sprite.actor && sprite.actor.renderStep) {
                    // TODO: FIX THIS
                    if (objData && !this.clientEngine.isOwnedByPlayer(objData)) {
                        sprite.actor.renderStep({"x":sprite.x, "y": sprite.y, "z": sprite.z});
                    } else if (objData) {
                        this.debugCharacter && this.debugCharacter.actor.renderStep({"x":sprite.x, "y": sprite.y, "z": sprite.z});
                        let a;
                        while(a = objData.skills.shift()) {
                            if (a == 2) {
                                this.playerCharacter.actor.animateHeal();
                            } else if (a == 3) {
                                this.playerCharacter.actor.animateShield();
                            } else if (a == 4) {
                                console.log(objData.position, objData);
                                this.playerCharacter.actor.animateTeleport({"x":sprite.x, "y": sprite.y, "z": sprite.z});
                            }
                        }
                    }
                }
            }

            // this.emit("postDraw");
        }

    }

    showDialog(obj) {
        var dist = this.playerCharacter.position.subtract(obj.position);
        var distance = Math.abs(dist.length());
        console.log(distance);
        if (distance < 10) {
            obj.actor.showDialog(this.playerCharacter.data.playerId);
        }
    }

    setTarget(obj) {
        document.querySelector('.target-hp-bar').style.opacity = 0.7;
        var health = document.querySelector('#target-health');
        document.querySelector('.target-hp-bar .health-name').innerHTML = obj.actor.name;
        this.playerCharacter.target = obj.id;
        this.playerCharacter.lookAt(obj.position);
        this.emit('target', {"id": obj.id});
    }
    showTargetHeal(target) {
        var health = document.querySelector('#target-health');
        if (target) {
            var currentHealth = target.health * 100 / target.original_health;
            health.style.width = parseFloat(currentHealth) + '%';
        } else {
            health.style.width = '0%';
            this.playerCharacter.target = null;
            console.log('target not found, probably killed');
        }
    }

    setNames(data, retries) {
        console.log('Setting names for', data);
        for (let id in data) {
            if (data.hasOwnProperty(id)) {
                let player = this.gameEngine.getPlayerCharacter(id);
                let mesh = player ? this.meshes[player.id] : null;
                if (mesh && mesh.actor) {
                    mesh.actor.setName(data[id]);
                    delete data[id];
                }
            }
        }

        if (Object.keys(data).length && retries >= 0) {
            setTimeout(function(){
                this.setNames(data, --retries);
            }.bind(this), 500);
        }
    }

    createDebugObject(objData) {
            let characterActor = new CharacterActor(this, objData.kind);
            characterActor.maxSpeed = objData.maxSpeed;
            let mesh = characterActor.mesh;
            mesh.id = objData.id;
            mesh.data = objData;
            this.debugCharacter = mesh;

    }
    addObject(objData, options) {
        let mesh;

        if (objData.class == Character) {
            if (this.debugMode && this.clientEngine.isOwnedByPlayer(objData)) {
                this.createDebugObject(objData);
            }
            let characterActor = new CharacterActor(this, objData.kind);
            characterActor.maxSpeed = objData.maxSpeed;
            mesh = characterActor.mesh;
            this.meshes[objData.id] = mesh;
            mesh.id = objData.id;
            mesh.data = objData;

            if (this.clientEngine.isOwnedByPlayer(objData)) {
                this.playerCharacter = mesh; // save reference to the player character
                // Center camera
                this.camera.target.x = parseFloat(objData.position.x);
                this.camera.target.z = parseFloat(objData.position.y);

                document.body.classList.remove('lostGame');
                document.body.classList.add('gameActive');
                document.querySelector('#tryAgain').disabled = true;
                document.querySelector('#joinGame').disabled = true;
                document.querySelector('#joinGame').style.opacity = 0;

                this.gameStarted = true; // todo state shouldn't be saved in the renderer

            } else {
                this.addOffscreenIndicator(objData);
            }

        } else if (objData.class == Mob) {

            let mobActor = new MobActor(this);
            mobActor.setAggressive(objData.aggressive);
            mesh = mobActor.mesh;
            this.meshes[objData.id] = mesh;
            mesh.id = objData.id;
            mesh.data = objData;
        } else if (objData.class == NPC) {

            let npcActor = new NPCActor(this);
            mesh = npcActor.mesh;
            this.meshes[objData.id] = mesh;
            mesh.id = objData.id;
            mesh.data = objData;
        }
        mesh.position = new BABYLON.Vector3(objData.x,objData.height, objData.y);
        console.log('object added on', mesh.position);

        Object.assign(mesh, options);

        return mesh;
    }

    removeObject(obj) {
        if (this.playerCharacter && obj.id == this.playerCharacter.id) {
            this.playerCharacter = null;
        }

        let sprite = this.meshes[obj.id];
        if (sprite.actor) {
            // removal "takes time"
            sprite.actor.destroy().then(()=>{
                delete this.meshes[obj.id];
            });
        } else{
            this.meshes[obj.id].destroy();
            delete this.meshes[obj.id];
        }
    }


    addOffscreenIndicator(objData) {
        let container = document.querySelector('#offscreenIndicatorContainer');
        let indicatorEl = document.createElement('div');
        indicatorEl.setAttribute('id', 'offscreenIndicator' + objData.id);
        indicatorEl.classList.add('offscreenIndicator');
        container.appendChild(indicatorEl);
    }


    updateHUD(data){
        if (data.RTT){ qs('.latencyData').innerHTML = data.RTT;}
        if (data.RTTAverage){ qs('.averageLatencyData').innerHTML = truncateDecimals(data.RTTAverage, 2);}
    }

    updateStatus(data){
        let statusContainer = qs('.status .updates');
        let statusEl = document.createElement('div');
        statusEl.classList.add('line');
        statusEl.classList.add('line-' + data['status']);
        statusEl.innerHTML = data['message'];
        statusContainer.appendChild(statusEl);
        statusContainer.scrollTop = statusContainer.scrollHeight;
    }

    onMouseClick(destination){
        if (this.playerCharacter) {
            this.playerCharacter.actor.addDestination(destination);
            this.playerCharacter.actor.moveToNextDestination();
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
