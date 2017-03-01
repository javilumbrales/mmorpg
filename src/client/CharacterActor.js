const BABYLON = require("babylonjs");
const ThrusterEmitterConfig = require("./ThrusterEmitter.json");
const ExplosionEmitterConfig = require("./ExplosionEmitter.json");

class CharacterActor{

    constructor(renderer){
        this.gameEngine = renderer.gameEngine;
        this.backLayer = renderer.layer1;
        // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        this.mesh = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, renderer.scene);
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new BABYLON.Vector3(0.1, 3, 0.1);

        this.scene = renderer.scene;

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
        //console.log('renderStep', delta);
        if (this.explosionEmitter){
            this.explosionEmitter.update(delta * 0.001);
        }

    }

    move(key) {
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
    }

    moveTo(destination) {
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
