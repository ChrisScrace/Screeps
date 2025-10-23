const roomCache = require('roomCache');
const sourceManager = require('sourceManager');

module.exports = {
    run(creep) {
        // Full? Deliver
        if (creep.store.getFreeCapacity() === 0) {
            // Try container nearby
            const containers = roomCache.getContainers(creep.room);
            const container = creep.pos.findClosestByRange(containers);
            if (container) {
                if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
                }
            } else {
                creep.drop(RESOURCE_ENERGY);
            }
            return;
        }

        // Assign source if not set
        if (!creep.memory.sourceId) {
            const sources = roomCache.getSources(creep.room);
            const source = creep.pos.findClosestByPath(sources);
            if (source) creep.memory.sourceId = source.id;
        }
        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) return;

        // Assign harvest tile
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (tile) creep.memory.tile = tile;
        }

        // Move to tile
        if (creep.memory.tile) {
            const pos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);
            if (!creep.pos.isEqualTo(pos)) {
                creep.moveTo(pos, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                return;
            }
        }

        // Harvest
        creep.harvest(source);
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
