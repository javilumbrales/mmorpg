const EventEmitter = require('eventemitter3');
const Utils = require('../common/Utils');

/**
 * This class handles touch device controls
 */
class MobileControls{

    constructor(renderer){
        Object.assign(this, EventEmitter.prototype);
        this.renderer = renderer;

        this.touchContainer = document.querySelector('#renderCanvas');
        this.setupListeners();
        this.destinations = [];
    }

    setupListeners(){

        document.addEventListener("touchend", (evt)=> {
            this.touchEnd(evt);
        });
    }
    touchEnd(e) {
        if (e.target.id != 'renderCanvas') {
            return;
        }

        var pickResult = this.renderer.scene.pick(this.renderer.scene.pointerX, this.renderer.scene.pointerY,  function(mesh) {
            return mesh.isPickable && mesh.isEnabled()
        });
        if (this.renderer.playerCharacter && pickResult.pickedPoint) {
            if (pickResult.pickedMesh.name == 'player') {
                this.renderer.setTarget(pickResult.pickedMesh.parent);
            }

            this.destinations.push(pickResult.pickedPoint);
            this.renderer.playerCharacter.actor.destination = pickResult.pickedPoint;

        }
    }
}

module.exports = MobileControls;
