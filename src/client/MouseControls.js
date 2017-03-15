const EventEmitter = require('eventemitter3');
const Utils = require('../common/Utils');



/**
 * This class handles mouse device controls
 */
class MouseControls{

    constructor(renderer){
        Object.assign(this, EventEmitter.prototype);
        this.renderer = renderer;

        this.setupListeners();

        this.destinations = [];

    }

    setupListeners() {

        document.addEventListener("click", (evt)=> {
            this.mouseClick(evt);
        });

        document.addEventListener("mousemove", ()=> {
            this.mouseMove();
        });
    }

    mouseMove() {
        // LookAt character if mouse over ground
        var pickResult = this.renderer.scene.pick(this.renderer.scene.pointerX, this.renderer.scene.pointerY, function (mesh) {
            //console.log(mesh);
            return mesh.name == 'extraGround';
        });
        if (this.renderer.playerCharacter && pickResult.hit) {
            var targetPoint = pickResult.pickedPoint.clone();
            this.renderer.cursor.position = targetPoint.clone();
            targetPoint.y = this.renderer.playerCharacter.position.y;
            this.renderer.playerCharacter.lookAt(targetPoint);
        }

        var pickResult = this.renderer.scene.pick(this.renderer.scene.pointerX, this.renderer.scene.pointerY, function (mesh) {
            return mesh.isPickable && mesh.isEnabled() && (mesh.name == 'player' || mesh.name =='npc' || mesh.name == 'mob');
        });

            if (pickResult.hit) {
                document.body.style.cursor = "pointer";
            } else {
                document.body.style.cursor = "default";
            }
    }

    mouseClick(e) {
        if (e.target.id != 'renderCanvas') {
            return;
        }

        var pickResult = this.renderer.scene.pick(this.renderer.scene.pointerX, this.renderer.scene.pointerY,  function(mesh) {
            return mesh.isPickable && mesh.isEnabled()
        });
        if (this.renderer.playerCharacter && pickResult.pickedPoint) {
            if (pickResult.pickedMesh.name == 'player' || pickResult.pickedMesh.name == 'mob') {
                this.renderer.setTarget(pickResult.pickedMesh);
            } else if (pickResult.pickedMesh.name =='npc') {
                this.renderer.showDialog(pickResult.pickedMesh);
                this.renderer.setTarget(pickResult.pickedMesh);
            }

            // TODO: Fix this to be able to take stairs and so on
            pickResult.pickedPoint.y = 0;

            this.destinations.push(pickResult.pickedPoint);
            this.renderer.playerCharacter.actor.destination = pickResult.pickedPoint;

        }
    }
}

module.exports = MouseControls;
