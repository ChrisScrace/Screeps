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

        // === ASSIGN TILE ===
        if (!creep.memory.tile) {
            const tile = sourceManager.assignTile(source.id, creep.name, creep.room.name);
            if (tile) creep.memory.tile = tile;
        }

        // === MOVE TO TILE ===
        if (creep.memory.tile) {
            const targetPos = new RoomPosition(creep.memory.tile.x, creep.memory.tile.y, creep.room.name);
            if (!creep.pos.isEqualTo(targetPos)) {
                creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            }
        }

        // === HARVEST OR DELIVER ===
        if (creep.store.getFreeCapacity() > 0) {
            creep.harvest(source);
            return;
        }

        // === FULL: HANDLE DELIVERY ===
        this.deliverEnergy(creep);
    },

    deliverEnergy(creep) {
        const haulersExist = _.some(Game.creeps, c => c.memory.role === 'hauler' && c.room.name === creep.room.name);

        // 1️⃣ No haulers: deliver to nearest extension/spawn
        if (!haulersExist) {
            const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s =>
                    (s.structureType === STRUCTURE_EXTENSION ||
                     s.structureType === STRUCTURE_SPAWN) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
        }

        // 2️⃣ Haulers exist: if on or next to a container with space, transfer
        const nearbyContainer = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s =>
                s.structureType === STRUCTURE_CONTAINER &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })[0];

        if (nearbyContainer) {
            const result = creep.transfer(nearbyContainer, RESOURCE_ENERGY);
            if (result === OK || result === ERR_FULL) return;
        }

        // 3️⃣ Fallback: drop on ground
        creep.drop(RESOURCE_ENERGY);
    },

    onDeath(creep) {
        if (creep.memory.tile) {
            sourceManager.releaseTile(creep.memory.sourceId, creep.name, creep.room.name, creep.memory.tile);
        }
    }
};
