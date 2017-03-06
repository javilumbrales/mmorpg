'use strict';

const ServerEngine = require('incheon').ServerEngine;
const nameGenerator = require('./NameGenerator');

class MMORPGServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.addCustomType({
            "type":"String",
            "writeDataView": function(dataview, value, bufferOffset) {
                console.log('hola');
                var bufView = new Uint16Array(value.length * 2);
                for (var i=0, strLen=value.length; i<strLen; i++) {
                    bufView[i] = value.charCodeAt(i);
                }
                dataview.setUint16(bufferOffset, bufView);
                console.log('done');
            },
            "readDataView": function(dataview, bufferOffset) {
                console.log('hola read');
                return String.fromCharCode.apply(null, new Uint16Array(bufferOffset));
            }
        });
        this.serializer.registerClass(require('../common/Missile'));
        this.serializer.registerClass(require('../common/Character'));
    }

    start() {
        super.start();

        this.gameEngine.on('killed', (e) => {

            console.log(`player killed: ${e.character.toString()}`);
            this.updateStatus({"status":"standard", "message": `RIP: ${e.character.getName()}`});
            this.gameEngine.removeObjectFromWorld(e.character.id);
        });

        this.players = {};
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerCharacter = () => {
            let character = this.gameEngine.makeCharacter(socket.playerId, nameGenerator('general'));
            let name = character.getName();
            this.players[socket.playerId] = name;
            this.updateStatus({"status": 'connected', "message": `Player connected: ${name}`});
        };

        // handle client restart requests
        socket.on('requestRestart', makePlayerCharacter);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);

        // iterate through all objects, delete those that are associated with the player
        for (let objId of Object.keys(this.gameEngine.world.objects)) {
            let obj = this.gameEngine.world.objects[objId];
            if (obj.playerId == playerId) {
                delete this.gameEngine.world.objects[objId];
            }
        }
        if (this.players[playerId]) {
            this.updateStatus({"status": 'disconnected', "message": `Player disconnected: ${this.players[playerId]}`});
            delete this.players[playerId];
        }
    }

    updateStatus(data) {
        // delay so player socket can catch up
        setTimeout(() => {
            this.io.sockets.emit('statusUpdate', data);
        }, 1000);

    }
}

module.exports = MMORPGServerEngine;
