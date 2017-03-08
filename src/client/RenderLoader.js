const BABYLON = require("babylonjs");

class RenderLoader{

    constructor(scene) {
        this.scene = scene;
        this.loader = new BABYLON.AssetsManager(this.scene);
    }

    loadMesh(name, file, callback) {
        var mesh = this.loader.addMeshTask(name, "", "assets/meshes/", file);
        mesh.onSuccess = callback;


        this.loader.load();
    }
}

module.exports = RenderLoader;
