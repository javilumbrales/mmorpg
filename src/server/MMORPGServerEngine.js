'use strict';

const ServerEngine = require('incheon').ServerEngine;
const nameGenerator = require('./NameGenerator');

class MMORPGServerEngine extends ServerEngine {
    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.serializer.registerClass(require('../common/Missile'));
        this.serializer.registerClass(require('../common/Character'));
    }

    start() {
        super.start();

        this.gameEngine.on('killed', (e) => {

            console.log(`player killed: ${e.character.toString()}`);
            this.gameEngine.removeObjectFromWorld(e.character.id);
        });

        this.players = {};
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        let makePlayerCharacter = () => {
            let character = this.gameEngine.makeCharacter(socket.playerId);
            character.name = nameGenerator('general');
            let data = {"status": 'connected', "message": `Player connected: ${character.name}`, "data": {"id": character.id, "name":character.name}};
            this.players[socket.playerId] = character.name;
            this.updateStatus(data);
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
        let name = '';
        if (this.players[playerId]) {
            name = this.players[playerId];
            delete this.players[playerId];
        }

        let data = {"status": 'disconnected', "message": `Player disconnected: ${name}`};
        this.updateStatus(data);
    }

    updateStatus(data) {
        // delay so player socket can catch up
        setTimeout(() => {
            this.io.sockets.emit('statusUpdate', data);
        }, 1000);

    }
}

module.exports = MMORPGServerEngine;
