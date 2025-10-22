const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // === ASSIGN SOURCE ===
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // === ASSIGN TILE FROM SOURCE MANAGER ===
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (!tile) return; // no free tile available
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);

        // === MOVE TO ASSIGNED TILE ===
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // === HARVEST ===
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }

        // === DEPOSIT ENERGY ===
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Find the closest container within 1 tile of the source
            const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];

            if (container) {
                // ✅ If in range (1 tile away), transfer directly
                if (creep.pos.inRangeTo(container, 1)) {
                    creep.transfer(container, RESOURCE_ENERGY);
                } else {
                    // Move closer if not yet in range
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                // ❌ No container nearby — drop energy on ground
                creep.drop(RESOURCE_ENERGY);
            }
        }
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(
                creep.memory.sourceId,
                creep.name,
                creep.room.name,
                creep.memory.tile
            );
        }
    }
};
