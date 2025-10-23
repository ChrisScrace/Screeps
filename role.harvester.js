const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // 1️⃣ Full → deliver energy
        if (creep.store.getFreeCapacity() === 0) {
            this.deliverEnergy(creep);
            return;
        }

        // 2️⃣ Assign source if none
        if (!creep.memory.sourceId) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (source) creep.memory.sourceId = source.id;
        }

        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // 3️⃣ Assign harvest tile if none
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (tile) creep.memory.tile = tile;
        }

        // 4️⃣ Move to tile
        const tile = creep.memory.tile;
        if (tile) {
            const targetPos = new RoomPosition(tile.x, tile.y, creep.room.name);
            if (!creep.pos.isEqualTo(targetPos)) {
                creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }
        }

        // 5️⃣ Harvest
        creep.harvest(source);
    },

    deliverEnergy(creep) {
        // Try to transfer to nearby container first (range 1)
        const nearbyContainer = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })[0];

        if (nearbyContainer) {
            const result = creep.transfer(nearbyContainer, RESOURCE_ENERGY);
            if (result === OK || result === ERR_FULL) return;
        }

        // If no container, drop energy on floor
        creep.drop(RESOURCE_ENERGY);
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
