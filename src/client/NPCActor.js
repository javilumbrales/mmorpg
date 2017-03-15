const BABYLON = require("babylonjs");
const Actor = require('./Actor');

class NPCActor extends Actor {

    constructor(renderer) {
        super(renderer, 'npc');

        this.assetName = 'shirt';

        // TODO: Fix this
        this.name ='Gandalf el Gris';


        let npcModel = this.renderer.loader.assets[this.assetName][0];
        let id = this.meshName + '-id';
        let npc = npcModel.createInstance(id);

        npc.scaling = new BABYLON.Vector3(0.035, 0.035, 0.035);
        npc.isPickable = false;
        npc.isVisible = true;
        npc.position.y = -1;
        npc.parent = this.mesh;
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

    renderStep(position) {

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
