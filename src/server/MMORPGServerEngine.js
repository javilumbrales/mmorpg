'use strict';

const ServerEngine = require('incheon').ServerEngine;

class MMORPGServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.registerClass(require('../common/Character'));
    }

    start() {
        super.start();

        this.gameEngine.on('killed', (e) => {

            console.log(`player killed: ${e.character.toString()}`);
            this.updateStatus({"status":"standard", "message": `RIP: ${e.character.name}`});
            this.gameEngine.removeObjectFromWorld(e.character.id);
        });

        this.players = {};
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerCharacter = () => {
            let names = ["Valanar", "p0w3rf1y", "Rins", "Malaga", "Pepito"];
            let kind = Math.round(Math.random());
            let character = this.gameEngine.makeCharacter(socket.playerId, names[Math.floor(Math.random() * names.length)] + Math.round(Math.random() * 4), kind);
            this.players[socket.playerId] = character.name;
            this.updateStatus({"status": 'connected', "message": `Player connected: ${character.name}`});
            setTimeout(() => {
                this.io.sockets.emit('connectedPlayers', this.players);
            }, 1500);
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
