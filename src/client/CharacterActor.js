const BABYLON = require("babylonjs");
const ThrusterEmitterConfig = require("./ThrusterEmitter.json");
const ExplosionEmitterConfig = require("./ExplosionEmitter.json");

class CharacterActor{

    constructor(renderer){
        this.Epsilon = 0.1;


        this.gameEngine = renderer.gameEngine;
        this.camera = renderer.camera;
        // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        this.mesh = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, renderer.scene);
        this.mesh.position.y=0;
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new BABYLON.Vector3(0.1, 0.1, 0.1);

        //this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);

        this.scene = renderer.scene;
        this.destinations = [];
        this.isMoving = false;
        this._destination = false;
        this.speed = 4;

        // Add move function to the character
        this.mesh.getScene().registerBeforeRender(function () {
            this.moveCharacter();
        }.bind(this));

        //keep a reference to the actor from the mesh
        this.mesh.actor = this;
    }

    renderStep(position){
        if (Math.round(position.x) !== Math.round(this.mesh.position.x) || Math.round(position.y) != Math.round(this.mesh.position.z)) {
            console.log("moved, updating position");
            console.log(position);
            console.log('current: ' + this.mesh.position.x + ", " + this.mesh.position.y + ", " + this.mesh.position.z);
            this.mesh.position.x = position.x;
            this.mesh.position.z = position.y;
            console.log('now: ' + this.mesh.position.x + ", " + this.mesh.position.y + ", " + this.mesh.position.z);
        }
    }

    addDestination(value, data) {
        // Add this destination to the set of destination
        this.destinations.push({ position: value, data: data });
    };
    moveCharacter() {
        // If a destination has been set and the character has not been stopped
        if (this.isMoving && this._destination) {
            // Compute distance to destination
            var distance = BABYLON.Vector3.Distance(this.mesh.position, this._destination.position);
            // Change destination if th distance is increasing (should not)
            if (distance < this.Epsilon || distance > this._lastDistance) {
                // Set the minion position to the curent destination
                this.mesh.position.copyFrom(this._destination.position);

                // Destination has been reached
                this.isMoving = false;
                if (this.destinations.length == 0) {
                    // Animate the character in idle animation
                    // Call function when final destination is reached
                }
                else {
                    this.moveToNextDestination();
                }
            }
            else {
                this._lastDistance = distance;
                // Add direction to the position
                let delta = this._direction.scale(this.mesh.getScene().getAnimationRatio() * this.speed);
                //this.mesh.position.addInPlace(delta);

                //let velocityAndGravity = delta.add(new BABYLON.Vector3(0, -9, 0));

                //console.log(velocityAndGravity);
                //this.mesh.moveWithCollisions(velocityAndGravity);
                this.mesh.moveWithCollisions(delta);
            }
        }
    }

    moveToNextDestination() {
        this.isMoving = true;
        this._lastDistance = Number.POSITIVE_INFINITY;
        //this.destination = destination;
        this._destination = this.destinations.shift();

        // Compute direction
        this._direction = this._destination.position.subtract(this.mesh.position);
        this._direction.normalize();

        // Rotate
        this.lookAt(this._destination.position);
    }

    /**
     * The character looks at the given position, but rotates only along Y-axis
     * */
    lookAt(value){
        var dv = value.subtract(this.mesh.position);
        var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
        this.mesh.rotation.y = yaw ;
    }

    changeName(name){
        if (this.nameText != null){
            this.nameText.dispose();
        }

        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 512, this.scene, true);
        dynamicTexture.hasAlpha = true;
        var name = name;
        var ctx =  dynamicTexture.getContext();
        var font = "bold 52px verdana";
        ctx.font= font;
        var width = ctx.measureText(name).width;
        dynamicTexture.drawText(name, 256 - width/2, 52, font, "lightblue", "red"); //write "" into the last parameter to hide the plate
        dynamicTexture.uScale = 1;
        dynamicTexture.vScale = 0.125;
        dynamicTexture.update(false);

        var result = BABYLON.Mesh.CreatePlane("nameplate", 10, this.scene, false);
        result.position = new BABYLON.Vector3(0, 2.75, 0);
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

    destroy(){
        return new Promise((resolve) =>{
            this.explosionEmitter.emit = true;

            if (this.nameText)
                this.nameText.destroy();
            this.thrustEmitter.destroy();
            this.thrustEmitter = null;
            this.shipSprite.destroy();

            setTimeout(()=>{
                this.shipContainerSprite.destroy();
                this.explosionEmitter.destroy();
                resolve();
            },3000);
        });
    }

}


module.exports = CharacterActor;
