const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        const roomName = creep.room.name;

        // -----------------------
        // Assign source if needed
        // -----------------------
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (!source) return;
            creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // -----------------------
        // Assign a valid harvesting tile
        // -----------------------
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, roomName);
            if (!tile) return; // No free tile yet
            creep.memory.tile = tile;
        }

        const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, roomName);

        // Move to assigned tile
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // -----------------------
        // Harvest logic
        // -----------------------
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }

        // -----------------------
        // Deposit logic
        // -----------------------
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Look for container adjacent to the assigned tile
            const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];

            // 1️⃣ If container exists and has space, deposit
            if (container && container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                const transferResult = creep.transfer(container, RESOURCE_ENERGY);
                if (transferResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 2️⃣ Otherwise, drop energy on ground (for haulers to collect)
            if (!container || container.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
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
