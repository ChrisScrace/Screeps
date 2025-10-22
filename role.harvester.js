const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // --- ASSIGN SOURCE ---
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // --- ASSIGN TILE ---
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (!tile) return; // no free tile
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);

        // --- MOVE TO TILE ---
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // --- HARVEST SOURCE ---
        if (creep.store.getFreeCapacity() > 0) {
            const result = creep.harvest(source);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return; // don't try to deposit while still harvesting
        }

        // --- DEPOSIT ENERGY ---
        if (creep.store[RESOURCE_ENERGY] > 0) {
            const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];

            if (container) {
                const transferResult = creep.transfer(container, RESOURCE_ENERGY);

                if (transferResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (transferResult !== OK && transferResult !== ERR_FULL) {
                    // fallback if container is blocked or full
                    creep.drop(RESOURCE_ENERGY);
                }
            } else {
                // drop if no container exists yet
                creep.drop(RESOURCE_ENERGY);
            }
        }
    },

    // --- CLEANUP ON DEATH ---
    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
