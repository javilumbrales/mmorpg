const BABYLON = require("babylonjs");

class RenderLoader {

    constructor(engine, scene, onFinish) {
        let music = new BABYLON.Sound("Loading", "assets/audio/intro.ogg", scene, null, { loop: false, autoplay: true });
        engine.displayLoadingUI();
        engine.loadingUIText = "From the creators of the epic Lineage 2 C2 - BloodRage Server...";

        setTimeout(function() {
            engine.loadingUIText = "Alberto aka 'Valanar', the game master...";
        }.bind(this), 1500);

        setTimeout(function() {
            engine.loadingUIText = "Javier aka 'p0w3rf1y', the bsoe's master...";
        }.bind(this), 3200);

        setTimeout(function() {
            engine.loadingUIText = "An innovative creation, defying the laws of nature...";
        }.bind(this), 4800);

        setTimeout(function() {
            engine.loadingUIText = "Get ready for an unforeseen gaming experience...";
        }.bind(this), 6000);

        this.scene = scene;
        this.loader = new BABYLON.AssetsManager(this.scene);
        //this.loader.useDefaultLoadingScreen = false;
        this.loader.onFinish = onFinish;
        this.assets = {};
        this.animations = {};
    }

    preloadAssets() {
        this.loadMesh('shirt', 'lady.babylon', this.onLoaded.bind(this));
        this.loadMesh('mob', 'ninja.babylon', this.onMobLoaded.bind(this));
        this.loadMesh('viking', 'viking.babylon', this.onVikingLoaded.bind(this));
        //var music = new BABYLON.Sound("Music", "assets/audio/music.mp3", this.scene, null, { loop: true, autoplay: true });

        setTimeout(function() {
            this.loader.load();
        }.bind(this), 1000);
    }

    onMobLoaded(task) {

        this.assets[task.name] = [];
        console.group();
        for (var i=0; i<task.loadedMeshes.length; i++ ){
            var mesh = task.loadedMeshes[i];
            mesh.rotationQuaternion = null;
            mesh.rotation.x = -Math.PI/2;
            mesh.isPickable = false;
            mesh.setEnabled(false);
            this.scene.stopAnimation(mesh);
            this.assets[task.name].push(mesh);
            console.log(`%c Loaded : ${mesh.name}`, 'background: #333; color: #bada55');
        }
        this.addAnimation('mob', 'idle', 0, 39);
        this.addAnimation('mob', 'walk', 45, 85);
        console.log(`%c Finished : ${task.name}`, 'background: #333; color: #bada55');
    }

    onVikingLoaded(t) {
        this.onLoaded(t);
        this.addAnimation('viking', 'idle', 0, 320);
        this.addAnimation('viking', 'walk', 323, 364);
        this.addAnimation('viking', 'dance', 367, 738);
    }

    /**
     * Add an animation to this character
     */
    addAnimation(mesh, name, from, to) {
        this.animations[mesh] = this.animations[mesh] || {};
        this.animations[mesh][name] = {from:from, to:to};
        console.log('addAnimation', this.animations, name, from, to);
    }

    onLoaded (t) {
        this.assets[t.name] = [];
        console.group();
        for (let m of t.loadedMeshes) {
            m.setEnabled(false);
            m.isPickable = true;
            this.assets[t.name].push(m);
            console.log(`%c Loaded : ${m.name}`, 'background: #333; color: #bada55');
        }
        console.log(`%c Finished : ${t.name}`, 'background: #333; color: #bada55');

        console.groupEnd();

    }

    loadMesh(name, file, callback) {
        var mesh = this.loader.addMeshTask(name, "", "assets/meshes/", file);
        mesh.onSuccess = callback;

    }
}

module.exports = RenderLoader;
