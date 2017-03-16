const BABYLON = require("babylonjs");
const Actor = require('./Actor');

class CharacterActor extends Actor {

    constructor(renderer, kind) {
        super(renderer, 'player');

        this.assetName = 'viking';
        this.kind = kind;

        this.animatedObject = this.renderer.loader.assets[this.assetName];

        let id = this.meshName + '-1';
        let player = this.animatedObject[0].createInstance(id);

        player.scaling = this.kind ? new BABYLON.Vector3(0.035, 0.035, 0.035) :  new BABYLON.Vector3(2, 2, 2);
        player.isVisible = true;
        player.isPickable = false;
        //player.position.y = -1;
        player.parent = this.mesh;

        this.playAnimation(this.animatedObject, this.assetName, 'idle', true, 1);

        // Add move function to the character
        this.mesh.getScene().registerBeforeRender(function () {
            //this.moveCharacter();
            this.moveToDestination();
        }.bind(this));

    }



    destroy() {
        super.destroy();

        if (this.nameText) {
            this.nameText.dispose();
            this.nameText = null;
        }
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

        BABYLON.Animation.CreateAndStartAnimation("fadesphere", this.animatedObject[0], 'visibility', 30, 70, 1, 0.1, 0);

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
                BABYLON.Animation.CreateAndStartAnimation("fadesphere", this.animatedObject[0], 'visibility', 30, 70, 0.1, 1, 0);
                this.teleporting = null;
            }

        }.bind(this), 20);
    }
    setName(name) {
        super.setName(name);
        document.querySelector('.hp-bar .health-name').innerHTML = this.name;
    }
}

module.exports = CharacterActor;
