const qsOptions = require('query-string').parse(location.search);
const MMORPGClientEngine = require('../client/MMORPGClientEngine');
const MMORPGGameEngine = require('../common/MMORPGGameEngine');
const SimplePhysicsEngine = require('incheon').physics.SimplePhysicsEngine;
require('../../assets/sass/main.scss');

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
    traceLevel: 1000,
    delayInputCount: 3,
    clientIDSpace: 1000000,
    syncOptions: {
        sync: qsOptions.sync || 'interpolate',
        localObjBending: 0.6,
        remoteObjBending: 0.6
    }
};
let options = Object.assign(defaults, qsOptions);

// create a client engine and a game engine
const physicsEngine = new SimplePhysicsEngine({ collisionOptions: { COLLISION_DISTANCE: 25 } } );
const gameOptions = Object.assign({ physicsEngine }, options);
const gameEngine = new MMORPGGameEngine(gameOptions);
const clientEngine = new MMORPGClientEngine(gameEngine, options);

clientEngine.start();
