const spawnManager = require('spawnManager');
const constructionManager = require('constructionManager');
const sourceManager = require('sourceManager');
const towerManager = require('towerManager');
const checkpointManager = require('checkpointManager');

const roles = {
    harvester: require('role.harvester'),
    hauler: require('role.hauler'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder')
};

module.exports.loop = function () {
    // --- CLEANUP DEAD CREEPS ---
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            const creepMemory = Memory.creeps[name];
            // Release source tile if assigned
            if (creepMemory.sourceId && creepMemory.tile) {
                sourceManager.releaseTile(creepMemory.sourceId, name, creepMemory.roomName);
            }
            delete Memory.creeps[name];
        }
    }

    // --- RUN ROOM LOGIC ---
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room.controller || !room.controller.my) continue;

        //plan defensive structures
        checkpointManager.planCheckpoints(room);

        // Initialize source memory
        sourceManager.initRoom(room);

        // Manage spawns
        spawnManager.run(room);

        // Manage construction
        constructionManager.run(room);

        // Manage towers
        towerManager.run(room);
    }

    // --- RUN CREEPS ---
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const role = creep.memory.role;
        if (roles[role]) {
            roles[role].run(creep);
        }
    }
};
