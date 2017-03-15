const BABYLON = require("babylonjs");

class  Actor{
    constructor() {    }

    renderStep(position) {
        if (Math.round(position.x) !== Math.round(this.mesh.position.x) || Math.round(position.y) != Math.round(this.mesh.position.y) || Math.round(position.z) != Math.round(this.mesh.position.z)) {

            if (!this.isMoving){
                this.lookAt(new BABYLON.Vector3(position.x, position.y, position.z));
                this.playAnimation(this.animatedObject, this.assetName, 'walk', true, 1);
                this.isMoving = true;
            }
            let delta = new BABYLON.Vector3(position.x, this.mesh.position.y, position.z);

            console.log('renderStep object at', delta);

            this.mesh.position = delta;
        } else {
            if (this.isMoving) {
                this.playAnimation(this.animatedObject, this.assetName, 'idle', true, 1);
                this.isMoving = false;
            }
        }
    }

    moveToDestination() {
        if (this.destination) {
            if (!this.isMoving) {
                this.playAnimation(this.animatedObject, this.assetName, 'walk', true, 1);
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
                this.playAnimation(this.animatedObject, this.assetName, 'idle', true, 1);
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


    /**
     * Play the given animation if skeleton found
     */
    playAnimation(mesh, asset, name, loop, speed) {
        //mesh.beginAnimation(name, loop, speed);
        let animation = this.renderer.loader.animations[asset][name];
        console.log('playAnimation', animation, mesh, name, loop, speed);
        for (let j = 0; j < mesh.length; j++) {
            mesh[j].getScene().beginAnimation(mesh[j], animation.from, animation.to, loop, speed);
        }
    }

}

module.exports = Actor;
