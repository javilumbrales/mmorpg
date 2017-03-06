const BABYLON = require("babylonjs");

class CharacterActor{

    constructor(renderer){
        this.Epsilon = 0.1;

        this.renderer = renderer;
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
        this.health = document.querySelector('#health');

        // We must create a new ActionManager for our building in order to use Actions.
        this.mesh.actionManager = new BABYLON.ActionManager(this.scene);
        var onpickAction = new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function(evt) {
                    if (evt.meshUnderPointer) {
                        // Find the clicked mesh
                        var meshClicked = evt.meshUnderPointer;
                        this.renderer.setTarget(meshClicked);
                    }
                }.bind(this));

        this.mesh.actionManager.registerAction(onpickAction);


        // Add move function to the character
        this.mesh.getScene().registerBeforeRender(function () {
            this.moveCharacter();
        }.bind(this));

        //keep a reference to the actor from the mesh
        this.mesh.actor = this;
    }

    renderStep(position){
        if (Math.round(position.x) !== Math.round(this.mesh.position.x) || Math.round(position.y) != Math.round(this.mesh.position.z)) {
            //console.log("moved, updating position");
            //console.log('current: ' + this.mesh.position.x + ", " + this.mesh.position.y + ", " + this.mesh.position.z);
            ////this.mesh.position.x = position.x;
            ////this.mesh.position.z = position.y;
           let delta = new BABYLON.Vector3(position.x, this.mesh.position.y, position.y); //.scale(this.mesh.getScene().getAnimationRatio());
            console.log('renderStep, delta movewithcollisions:', delta);
           //this.mesh.moveWithCollisions(delta);
           this.mesh.position.x = delta.x;
           this.mesh.position.y = delta.y;
           this.mesh.position.z = delta.z;
            console.log('renderStep after: ' + this.mesh.position.x + ", " + this.mesh.position.y + ", " + this.mesh.position.z);
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
                //console.log('renderer after: ' + this.mesh.position.x + ", " + this.mesh.position.y + ", " + this.mesh.position.z);
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

    setName(name){
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
        document.querySelector('.hp-bar .health-name').innerHTML = this.name;
    }

    destroy(){
        return new Promise((resolve) =>{

            if (this.nameText) {
                this.nameText.dispose();
                this.nameText = null;
            }

            setTimeout(()=>{
                this.mesh.dispose();
                this.mesh = null;
                resolve();
            }, 3000);
        });
    }

    animateShield() {
        if (this.shield) {
            return;
        }
        this.renderer.updateStatus({"status": 'standard', "message":'Using Shield'});
        var cyl = BABYLON.Mesh.CreateSphere("shield", 4, 2, this.scene);
        var mat = new BABYLON.StandardMaterial("shield", this.scene);
        var tex = new BABYLON.Texture("assets/images/alphaCloud.png", this.scene);
        mat.opacityTexture = tex;
        mat.specularColor.copyFromFloats(0, 0, 0);
        mat.diffuseColor.copyFromFloats(0.1, 0.5, 0.7);
        mat.emissiveColor.copyFromFloats(0.1, 0.5, 0.7);
        cyl.material = mat;
        cyl.position.y += 1;
        cyl.visibility = 0.6;
        cyl.parent = this.mesh;
        this.shield = cyl;

        var i = 0;
        function animate() {
            i++;
            cyl.scaling.copyFromFloats(1.5 + 0.05 * Math.sin((i + Math.PI/2)/10), 2+ 0.05 * Math.sin((i + Math.PI)/10), 1.5+ 0.05 * Math.sin(i/10));
            tex.uOffset += 0.01;
            tex.vOffset += 0.01;
            if (i > 500) {
                clearInterval(this.shieldAnimation);
                this.shield && this.shield.dispose();
                this.shield = null;
            }
        }
        this.shieldAnimation = setInterval(animate.bind(this), 16);
    }

    showHeal() {
        var currentHealth = this.mesh.data.health * 100 / this.mesh.data.original_health;
        this.health.style.width = parseFloat(currentHealth) + '%';
    }

    animateHeal() {
        if (this.healing) {
            return;
        }
        this.renderer.updateStatus({"status": 'standard', "message":'Using Heal'});

        var selectTexture = new BABYLON.DynamicTexture("selectTexture", 512, this.scene, true);
        var context = selectTexture._context;
        var invertY = true;
        var size = selectTexture.getSize();

        var posX = 256;
        var posY = 256;
        var radius = 220;
        context.arc(posX, posY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgba(0, 100, 0, 0.5)';
        context.fill();
        context.lineWidth = 30;
        context.strokeStyle = 'rgb(0, 255, 0)';;
        //context.setLineDash([60, 55]);
        context.stroke();
        selectTexture.update(invertY);

        var selectMaterial = new BABYLON.StandardMaterial('selectedBoxMaterial', this.scene);
        selectMaterial.emissiveTexture = selectTexture;
        selectMaterial.diffuseTexture = selectTexture;
        selectMaterial.opacityTexture = selectTexture;

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, this.scene
        var ground = [];
        for (var i = 0; i < 3; i++) {
            var x = BABYLON.Mesh.CreateGround("ground1", 3, 3, 2, this.scene);
            x.material = selectMaterial;
            x.parent = this.mesh;
            ground.push(x);
        }

        this.healing = ground;

        var initialvalue = ground[0].position.y + 1;
        var frame = 0;
        var j = 0;
        function update() {
            var i = 0;
            for (var g of ground) {
                j++;
                i++;
                g.position.y = initialvalue + Math.sin((frame + i *22)/15);
                g.visibility = 0.4 + 0.2 * (1 + Math.sin(Math.PI + (frame + i *11)/5));
            }
            //ground.scaling.x = ground.scaling.z = 0.9 + 0.2 * Math.sin(frame/5);
            frame++;

            if (j > 100) {
                clearInterval(this.healAnimation);
                for (var g of ground) {
                    g.dispose()
                };
                this.healing = null;
            }
        }

        this.healAnimation = setInterval(update.bind(this), 20);

    }

}


module.exports = CharacterActor;
