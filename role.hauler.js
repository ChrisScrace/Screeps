const roomCache = require('roomCache');

module.exports = {
    run(creep) {
        const room = creep.room;

        // -------------------------
        // 1️⃣ Toggle hauling state
        // -------------------------
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.hauling = false;
        }
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) {
            creep.memory.hauling = true;
        }

        // -------------------------
        // 2️⃣ Pickup energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            const targets = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));

            const target = creep.pos.findClosestByPath(targets);
            if (!target) return;

            if (target.resourceType) {
                // Dropped resource
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                }
            } else {
                // Container or tombstone
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                }
            }
            return;
        }

        // -------------------------
        // 3️⃣ Deliver energy
        // -------------------------
        const deliveryPriority = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION];
        for (const type of deliveryPriority) {
            const targets = roomCache.getEnergyStructures(room).filter(s => s.structureType === type);
            const target = creep.pos.findClosestByPath(targets);
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
                }
                break; // stop after first successful target
            }
        }

    }
};
