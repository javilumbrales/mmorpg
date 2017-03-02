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

    centerCamera() {
        this.camera.target.x = parseFloat(this.mesh.position.x);
        this.camera.target.z = parseFloat(this.mesh.position.z);
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
                    this.centerCamera();
                }
                else {
                    this.moveToNextDestination();
                }
            }
            else {
                this._lastDistance = distance;
                // Add direction to the position
                var delta = this._direction.scale(this.mesh.getScene().getAnimationRatio() * this.speed);
                //this.mesh.position.addInPlace(delta);

                //let  velocityAndGravity = this._direction.add(new BABYLON.Vector3(0, -9, 0));

                //console.log(velocityAndGravity);
                //this.mesh.moveWithCollisions(velocityAndGravity);
                this.mesh.moveWithCollisions(delta);
            }
        }
    }
    move(key) {
        /*
            let posX = Math.sin(parseFloat(this.mesh.rotation.y));
            let posZ = Math.cos(parseFloat(this.mesh.rotation.y));
            console.log("Before ", this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
            console.log("Moving to:", posX, posZ);
            let velocity = new BABYLON.Vector3(parseFloat(posX) / 1, 0, parseFloat(posZ) / 1);
            this.mesh.moveWithCollisions(velocity);

            let  velocityAndGravity = velocity.add(new BABYLON.Vector3(0, -9, 0));

            console.log(velocityAndGravity);
            this.mesh.moveWithCollisions(velocityAndGravity);
            console.log("After ", this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
            console.log(key);
            */
    }

    moveToNextDestination() {
        this.isMoving = true;
        this._lastDistance = Number.POSITIVE_INFINITY;
        //this.destination = destination;
        this._destination = this.destinations.shift();

        // Compute direction
        this._direction = this._destination.position.subtract(this.mesh.position);
        this._direction.normalize();
        /*
            console.log("Before ", this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);

            this.direction = destination.subtract(this.mesh.position);
            this.direction.normalize();
            console.log('direction');
            console.log(this.direction);

            //let velocity = this.direction * 1 ; // 1 = speed
            let velocityAndGravity = this.direction.add(new BABYLON.Vector3(0, -9, 0));

            console.log(velocityAndGravity);
            this.mesh.moveWithCollisions(velocityAndGravity);
            console.log("After ", this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
            */
    }

    changeName(name){
        if (this.nameText != null){
            this.nameText.dispose();
        }

        var planeMaterial, plan, planeTexture, textureContext, size, textSize;
        plan = BABYLON.Mesh.CreatePlane("Etiquetes", 1.0, this.scene);
        plan.scaling.y = 0.8;
        plan.scaling.x = 3;
        plan.position = new BABYLON.Vector3(0, 2.75, 0);
        planeMaterial = new BABYLON.StandardMaterial("plane material", this.scene);
        planeTexture = new BABYLON.DynamicTexture("dynamic texture", 128, this.scene, true);
        planeTexture.hasAlpha = true;
        textureContext = planeTexture.getContext();
        textureContext.font = "bold 40px Calibri";
        size = planeTexture.getSize();
        textureContext.save();
        textureContext.fillStyle = "red";
        textureContext.fillRect(0, 0, size.width, size.height);
        textSize = textureContext.measureText(name);
        textureContext.fillStyle = "white";
        textureContext.fillText(name, (size.width - textSize.width) / 2, (size.height + 20) / 2);
        textureContext.restore();
        planeTexture.update();
        planeMaterial.diffuseTexture = planeTexture;
        plan.material = planeMaterial;
        plan.parent = this.mesh;
        this.nameText = plan;
        //this.nameText = new PIXI.Text(name, {fontFamily:"arial", fontSize: "12px", fill:"white"});
        //this.nameText.anchor.set(0.5, 0.5);
        //this.nameText.y = -40;
        //this.nameText.alpha = 0.3;
        //this.sprite.addChild(this.nameText);
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
