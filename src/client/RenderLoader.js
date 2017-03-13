const BABYLON = require("babylonjs");

class RenderLoader {

    constructor(scene, onFinish) {
        this.scene = scene;
        this.loader = new BABYLON.AssetsManager(this.scene);
        this.loader.useDefaultLoadingScreen = false;
        this.loader.onFinish = onFinish;
        this.assets = {};
        this.animations = {};
    }

    preloadAssets() {
        this.loadMesh('shirt', 'lady.babylon', this.onLoaded.bind(this));
        this.loadMesh('viking', 'viking.babylon', this.onVikingLoaded.bind(this));
        //var music = new BABYLON.Sound("Music", "assets/audio/music.mp3", this.scene, null, { loop: true, autoplay: true });

        this.loader.load();
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
