const BABYLON = require("babylonjs");

class CharacterActor{

    constructor(renderer, kind) {
        this.Epsilon = 1;
        this.kind = kind;

        this.renderer = renderer;
        this.gameEngine = renderer.gameEngine;
        this.camera = renderer.camera;

        this.mesh = BABYLON.MeshBuilder.CreateBox('mesh', {}, renderer.scene);
        this.mesh.isVisible = false;
        this.mesh.position = new BABYLON.Vector3(-13, 1, -13);
        this.mesh.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.mesh.checkCollisions = true;
        this.mesh.collisionsEnabled = true;
        this.mesh.ellipsoid = new BABYLON.Vector3(0.5, 1.0, 0.5);
        this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1.0, 0);



        this.playerModel = this.renderer.loader.assets['viking'][0];
        let player = this.playerModel.createInstance('player');

        player.name ='player';
        player.scaling = this.kind ? new BABYLON.Vector3(0.035, 0.035, 0.035) :  new BABYLON.Vector3(2, 2, 2);
        player.isVisible = true;
        player.position.y = -1;
        player.parent = this.mesh;
        this.playAnimation(this.playerModel, 'viking', 'idle', true, 1);

        // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        //let player = BABYLON.Mesh.CreateSphere('player', 16, 2, renderer.scene);
        //player.position.y=0;
        //player.isVisible = true;
        //player.parent = this.mesh;

        this.scene = renderer.scene;
        this.isMoving = false;
        this.mesh.isPickable = true;
        this.health = document.querySelector('#health');

        // Add move function to the character
        this.mesh.getScene().registerBeforeRender(function () {
            //this.moveCharacter();
            this.moveToDestination();
        }.bind(this));

        //keep a reference to the actor from the mesh
        this.mesh.actor = this;
    }

    renderStep(position) {
        if (Math.round(position.x) !== Math.round(this.mesh.position.x) || Math.round(position.y) != Math.round(this.mesh.position.y) || Math.round(position.z) != Math.round(this.mesh.position.z)) {
           let delta = new BABYLON.Vector3(position.x, this.mesh.position.y, position.z);

           console.log('renderStep object at', delta);

           this.mesh.position = delta;
        }
    }

    moveToDestination() {
        if (this.destination) {
            if (!this.isMoving) {
                this.playAnimation(this.playerModel, 'viking', 'walk', true, 1);
                this.isMoving = true;
            }
            //console.log('moveToDestination', this.mesh.position, this.destination);
            var moveVector = this.destination.subtract(this.mesh.position);
            var distance = moveVector.length();

            //console.log(distance);
            if (distance > this.Epsilon) {
                moveVector = moveVector.normalize();
                moveVector = moveVector.scale(0.3);
                this.mesh.moveWithCollisions(moveVector);
            } else {
                this.destination = null;
                this.playAnimation(this.playerModel, 'viking', 'idle', true, 1);
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
            }, 1000);
        });
    }

    animateShield() {
        if (this.shield) {
            this.shieldInc +=5;
            return;
        }
        console.log('animateShield');
        this.renderer.updateStatus({"status": 'standard', "message":'Using Shield'});
        var cyl = BABYLON.Mesh.CreateSphere("shield", 200, 2, this.scene);
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
        this.shieldInc = 300;

        var i = 0;
        function animate() {
            i++;
            this.shieldInc--;
            cyl.scaling.copyFromFloats(1.5 + 0.05 * Math.sin((i + Math.PI/2)/10), 5+ 0.05 * Math.sin((i + Math.PI)/10), 1.5+ 0.05 * Math.sin(i/10));
            tex.uOffset += 0.01;
            tex.vOffset += 0.01;
            if (this.shieldInc <= 0) {
                clearInterval(this.shieldAnimation);
                this.shield && this.shield.dispose();
                delete this.shield;
                delete this.shieldInc;
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
            this.healingInc+=1;
            return;
        }
        console.log('animateHeal');
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
        context.stroke();
        selectTexture.update(invertY);

        var selectMaterial = new BABYLON.StandardMaterial('selectedBoxMaterial', this.scene);
        selectMaterial.emissiveTexture = selectTexture;
        selectMaterial.diffuseTexture = selectTexture;
        selectMaterial.opacityTexture = selectTexture;

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, this.scene
        var ground = [];
        for (var i = 0; i < 4; i++) {
            var x = BABYLON.Mesh.CreateGround("ground1", 3, 3, 2, this.scene);
            x.material = selectMaterial;
            x.parent = this.mesh;
            ground.push(x);
        }

        this.healing = ground;
        this.healingInc = 100;

        var initialvalue = ground[0].position.y + 1;
        var frame = 0;
        function update() {
            var i = 0;
            for (var g of ground) {
                i++;
                g.position.y = initialvalue + Math.sin((frame + i *252)/15) * 1.8;
                g.visibility = 0.4 + 0.2 * (1 + Math.sin(Math.PI + (frame + i *11)/5));
            }
            //ground.scaling.x = ground.scaling.z = 0.9 + 0.2 * Math.sin(frame/5);
            frame++;
            this.healingInc--;

            if (this.healingInc <=0) {
                clearInterval(this.healAnimation);
                for (var g of ground) {
                    g.dispose()
                };
                delete this.healing;
                delete this.healingInc;
            }
        }

        this.healAnimation = setInterval(update.bind(this), 20);

    }

    animateTeleport(destination) {
        console.log('animateTeleport');

        if(this.teleporting) {
            this.teleportInc +=5;
            return;
        }
        this.teleporting = true;
        this.teleportInc = 100;

        BABYLON.Animation.CreateAndStartAnimation("fadesphere", this.playerModel, 'visibility', 30, 70, 1, 0.1, 0);

        this.healAnimation = setInterval(function() {
            if(this.teleportInc-- <= 0) {

                console.log('stop animateTeleport', destination);
                clearInterval(this.healAnimation);
                this.mesh.position.x = 1;
                //this.mesh.position.y = 0;
                this.mesh.position.z = 1;
                //this.mesh.position.x = destination.x;
                //this.mesh.position.y = destination.y;
                //this.mesh.position.z = destination.z;
                BABYLON.Animation.CreateAndStartAnimation("fadesphere", this.playerModel, 'visibility', 30, 70, 0.1, 1, 0);
                this.teleporting = null;
            }

        }.bind(this), 20);
    }

    /**
     * Play the given animation if skeleton found
     */
    playAnimation(mesh, asset, name, loop, speed) {
        //mesh.beginAnimation(name, loop, speed);
        let animation = this.renderer.loader.animations[asset][name];
        mesh.getScene().beginAnimation(mesh, animation.from, animation.to, loop, speed);
        console.log('playAnimation', animation, mesh, name, loop, speed);
    }

}

module.exports = CharacterActor;
