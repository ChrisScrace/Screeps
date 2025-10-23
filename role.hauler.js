const roomCache = require('roomCache');

module.exports = {
    run(creep) {
        // Toggle hauling state
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) creep.memory.hauling = false;
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) creep.memory.hauling = true;

        const room = creep.room;

        if (!creep.memory.hauling) {
            // Pick up nearest dropped energy, tombstone, or container
            const targets = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));

            const target = creep.pos.findClosestByPath(targets);
            if (!target) return;

            if (target.resourceType) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            } else {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            }
            return;
        }

        // Deliver to priority targets: spawn, tower, extension
        const deliverPriority = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION];
        for (const type of deliverPriority) {
            const targets = roomCache.getStructures(room, [type])[type];
            const target = creep.pos.findClosestByPath(targets);
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
                }
                return;
            }
        }

        // Fallback: drop on ground
        creep.drop(RESOURCE_ENERGY);
    }
};
