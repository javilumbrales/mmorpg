const BABYLON = require("babylonjs");

class  Actor{
    constructor(renderer, meshName) {
        this.Epsilon = 1;
        this.renderer = renderer;
        this.scene = renderer.scene;
        this.gameEngine = renderer.gameEngine;
        this.camera = renderer.camera;
        this.meshName = meshName;

        this.mesh = BABYLON.MeshBuilder.CreateSphere(meshName, {diameter: 2, diameterY: 15}, this.scene);
        this.mesh.isPickable = true;
        this.mesh.visibility = this.renderer.debugMode ? 1 : 0;
        this.mesh.position = new BABYLON.Vector3(-13, 1, -13);
        this.mesh.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.mesh.checkCollisions = true;
        this.mesh.collisionsEnabled = true;
        this.mesh.ellipsoid = new BABYLON.Vector3(0.5, 1.0, 0.5);
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1.0, 0);
        //keep a reference to the actor from the mesh
        this.mesh.actor = this;

        this.isMoving = false;
        this.health = document.querySelector('#health');
    }

    destroy() {
        return new Promise((resolve) =>{
            setTimeout(()=>{
                this.mesh.dispose();
                this.mesh = null;
                resolve();
            }, 1000);
        });
    }

    renderStep(position) {
        if (Math.round(position.x) !== Math.round(this.mesh.position.x) || Math.round(position.y) != Math.round(this.mesh.position.y) || Math.round(position.z) != Math.round(this.mesh.position.z)) {

            if (!this.isMoving){
                this.lookAt(new BABYLON.Vector3(position.x, position.y, position.z));
                this.playAnimation(this.animatedObject, this.assetName, 'walk', true, 1);
                this.isMoving = true;
            }
            let delta = new BABYLON.Vector3(position.x, this.mesh.position.y, position.z);

            console.log('renderStep object at', delta, ' from ', this.mesh.position);

            this.mesh.position = delta;
        } else {
            console.log('Arrived to destination');
            if (this.isMoving) {
                this.playAnimation(this.animatedObject, this.assetName, 'idle', true, 1);
                this.isMoving = false;
            }
        }
    }

    moveToDestination() {
        if (this.destination) {
            if (!this.isMoving) {
                this.playAnimation(this.animatedObject, this.assetName, 'walk', true, 1);
                this.isMoving = true;
            }
            //console.log('moveToDestination', this.mesh.position, this.destination);
            var moveVector = this.destination.subtract(this.mesh.position);
            var distance = moveVector.length();

            //console.log(distance);
            if (distance > this.Epsilon) {
                moveVector = moveVector.normalize();
                //moveVector = moveVector.scale(0.3);
                let delta = moveVector.scale(this.maxSpeed);
                //console.log(moveVector, this.maxSpeed, delta);
                this.mesh.moveWithCollisions(delta);
            } else {
                this.destination = null;
                this.playAnimation(this.animatedObject, this.assetName, 'idle', true, 1);
                this.isMoving = false;
            }
        }
    }

    /**
     * The character looks at the given position, but rotates only along Y-axis
     * */
    lookAt(value){
        var dv = value.subtract(this.mesh.position);
        var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
        this.mesh.rotation.y = yaw ;
    }


    /**
     * Play the given animation if skeleton found
     */
    playAnimation(mesh, asset, name, loop, speed) {
        let animation = this.renderer.loader.animations[asset][name];
        //console.log('playAnimation', animation, mesh, name, loop, speed);
        for (let j = 0; j < mesh.length; j++) {
            mesh[j].getScene().beginAnimation(mesh[j], animation.from, animation.to, loop, speed);
        }
    }

    setName(name){
        if (this.name) {
            return;
        }
        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 512, this.scene, true);
        dynamicTexture.hasAlpha = true;
        this.name = name;
        var ctx =  dynamicTexture.getContext();
        var font = "bold 52px verdana";
        ctx.font= font;
        var width = ctx.measureText(name).width;
        dynamicTexture.drawText(name, 256 - width/2, 52, font, "lightblue", "red"); //write "" into the last parameter to hide the plate
        dynamicTexture.uScale = 1;
        dynamicTexture.vScale = 0.125;
        dynamicTexture.update(false);

        var result = BABYLON.Mesh.CreatePlane("nameplate", 10, this.scene, false);
        result.position = new BABYLON.Vector3(0, 12.75, 0);
        result.rotation.x = Math.PI;
        result.scaling.y = 0.125;
        result.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        var mat = new BABYLON.StandardMaterial("nameplateMat", this.scene);
        mat.diffuseTexture = dynamicTexture;
        mat.backFaceCulling = false;

        result.material = mat;
        result.parent = this.mesh;
        this.nameText = result;
    }
}

module.exports = Actor;
