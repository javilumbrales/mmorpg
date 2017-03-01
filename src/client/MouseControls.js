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

    setupListeners(){
        this.renderer.scene.onPointerDown = (evt, pr) => {
            evt.preventDefault();
            this.onMouseClick(evt, pr);
        };
    }

    onMouseClick(e, pr) {
        if (pr.hit) {
            let destination = pr.pickedPoint.clone();
            destination.y = 0;
            this.destinations.push(destination);
            this.renderer.onMouseClick(destination);
        }

    }
}

module.exports = MouseControls;
