const BABYLON = require("babylonjs");

class NPCActor{

    constructor(renderer) {

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

        this.name ='Gandalf el Gris';



        let npcModel = this.renderer.loader.assets['shirt'][0];
        let npc = npcModel.createInstance('npc');

        npc.name ='npc';
        npc.scaling = new BABYLON.Vector3(0.035, 0.035, 0.035);
        npc.isVisible = true;
        npc.position.y = -1;
        npc.parent = this.mesh;

        // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        //let player = BABYLON.Mesh.CreateSphere('player', 16, 2, renderer.scene);
        //player.position.y=0;
        //player.isVisible = true;
        //player.parent = this.mesh;

        this.scene = renderer.scene;
        this.isMoving = false;
        this.mesh.isPickable = true;
        this.health = document.querySelector('#health');

        //keep a reference to the actor from the mesh
        this.mesh.actor = this;
    }

    renderStep(position) {

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

    showDialog(playerId) {

        let msg = document.querySelector('#modal-msg');
        msg.innerHTML = '';
        var p = document.createElement('p');
        p.innerHTML = 'Hello little padawan, what can I do for you?';
        msg.appendChild(p);

        var link = document.createElement('div');
        var a = document.createElement('a');
        a.innerHTML = 'I am scared, teleport me somewhere else, please.';
        a.href='#';

        link.appendChild(a);
        link.addEventListener("click", (evt)=> {
            console.log('teleporting!', {"playerId": playerId, "destination": {'x': 1, 'y': 0, 'z': 1}});
            this.renderer.emit('teleport', {"playerId": playerId, "destination": {'x': 1, 'y': 0, 'z': 1}});
        });
        msg.appendChild(link);

        var p = document.createElement('p');
        p.innerHTML = 'Thanks';
        msg.appendChild(p);

        history.pushState("", document.title, window.location.pathname);
        document.location.href += '#openModal'

    }

}

module.exports = NPCActor;
