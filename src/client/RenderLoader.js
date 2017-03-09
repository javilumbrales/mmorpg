const BABYLON = require("babylonjs");

class RenderLoader{

    constructor(scene) {
        this.scene = scene;
        this.loader = new BABYLON.AssetsManager(this.scene);
        this.loader.useDefaultLoadingScreen = false;
        this.assets = {};
    }

    preloadAssets() {
        this.loadMesh('shirt', 'lady.babylon', this.onLoaded.bind(this));
        this.loadMesh('viking', 'viking.babylon', this.onLoaded.bind(this));
        //var music = new BABYLON.Sound("Music", "assets/audio/music.mp3", this.scene, null, { loop: true, autoplay: true });

        this.loader.load();
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
