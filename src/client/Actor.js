const BABYLON = require("babylonjs");

class  Actor{
    constructor(renderer, meshName) {
        this.Epsilon = 4; // 3 diff on Y-AXIS + 1 margin
        this.renderer = renderer;
        this.scene = renderer.scene;
        this.gameEngine = renderer.gameEngine;
        this.camera = renderer.camera;
        this.meshName = meshName;

        //this.mesh = BABYLON.MeshBuilder.CreateSphere(meshName, {diameter: 4, diameterY: 7}, this.scene);
        this.mesh = BABYLON.MeshBuilder.CreateBox(meshName, {depth: 3, width: 3, height: 7}, this.scene);
        this.mesh.isPickable = true;
        this.mesh.visibility = this.renderer.debugMode ? 1 : 0;

        //this.mesh.position = new BABYLON.Vector3(-13, -1, -13);
        this.mesh.checkCollisions = true;



        // TODO: Understand this better, params are the radius should be half of diameter of parent
        this.mesh.ellipsoid = new BABYLON.Vector3(1, 1.5, 1);
        //this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, -1.0, 0);

        //keep a reference to the actor from the mesh
        this.mesh.actor = this;

        this.isMoving = false;
        this.health = document.querySelector('#health');
    }

    destroy() {
        return new Promise((resolve) =>{
            this.mesh && this.mesh.selectionCircle && this.mesh.selectionCircle.dispose();
            this.mesh && this.mesh.dispose();
            this.mesh = null;
            resolve();
        });
    }

    renderStep(position) {
        var moveVector = new BABYLON.Vector3(position.x, position.y, position.z).subtract(this.mesh.position);
        var distance = moveVector.length();

        if (distance > this.Epsilon) {
            console.log('renderStep', distance);

            if (!this.isMoving){
                this.playAnimation(this.animatedObject, this.assetName, 'walk', true, 1);
                this.isMoving = true;
            }
            let velocityAndGravity = moveVector.add(new BABYLON.Vector3(0, -9.81, 0));
            velocityAndGravity.normalize();

            let delta = velocityAndGravity.scale(this.maxSpeed);
            this.lookTo(new BABYLON.Vector3(position.x, position.y, position.z));

            this.mesh.moveWithCollisions(delta);
        } else {
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
                let velocityAndGravity = moveVector.add(new BABYLON.Vector3(0, -9.81, 0));
                let delta = velocityAndGravity.scale(this.maxSpeed);


                //console.log(moveVector, this.maxSpeed, delta, velocityAndGravity);
                this.mesh.moveWithCollisions(delta);
                console.log('moveToDestination', this.mesh.position, this.destination, distance, delta);
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
    lookTo(value){
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
