const BABYLON = require("babylonjs");
const Actor = require('./Actor');

class MobActor extends Actor {

    constructor(renderer) {
        super(renderer, 'mob');

        this.assetName = 'mob';

        //TODO: Fix this
        this.name ='Foo';

        //let mob = this.renderer.loader.assets['shirt'][0];
        let id = this.meshName + '-1';
        this.animatedObject = this.assembleMesh(id, this.renderer.loader.assets[this.assetName]);

        //mob.scaling = new BABYLON.Vector3(0.035, 0.035, 0.035);
        //mob.position.y = -1;
        this.animatedObject.parent = this.mesh;
        this.playAnimation(this.animatedObject, this.assetName, 'idle', true, 1);
    }


    assembleMesh(name, meshes) {
        var mob = new BABYLON.Mesh(name, this.scene);

        //var mob = new BABYLON.MeshBuilder.CreateBox(name, {height: 20}, this.scene);
        //var mob = BABYLON.Mesh.CreateSphere("red", 4, 8, this.scene);
        //var mob = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, diameterY: 15}, this.scene);
        mob.size = 10;
        mob.skeletons = [];

        for (var i=0; i<meshes.length; i++ ){

            var newmesh = meshes[i].createInstance(meshes[i].name);
            newmesh.isPickable = false;
            newmesh.scaling = new BABYLON.Vector3(0.35, 0.35, 0.35);

            // Clone animations if any
            if (meshes[i].skeleton) {
                //newmesh.skeleton = meshes[i].skeleton.clone();
                mob.skeletons.push(newmesh.skeleton);
            }
            newmesh.parent = mob;
        }
        mob.isPickable = false;
        return mob;
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
    /**
     * Play the given animation if skeleton found
     */
    playAnimation(mesh, asset, name, loop, speed) {
        speed = 2.2;
        //mesh.beginAnimation(name, loop, speed);
        let animation = this.renderer.loader.animations[asset][name];
        //console.log('Mob::playAnimation', animation, mesh, name, loop, speed);
        //for (let j = 0; j < mesh.length; j++) {
            //mesh[j].getScene().beginAnimation(mesh[j], animation.from, animation.to, loop, speed);
        //}
        for (var i=0; i<mesh.skeletons.length; i++) {
            this.animatable = this.scene.beginAnimation(mesh.skeletons[i], animation.from, animation.to, true, speed);
        }
    }

}

module.exports = MobActor;
