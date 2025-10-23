const roomCache = require('roomCache');

module.exports = {
    run(creep) {
        if (creep.memory.repairing && creep.store[RESOURCE_ENERGY] === 0) creep.memory.repairing = false;
        if (!creep.memory.repairing && creep.store.getFreeCapacity() === 0) creep.memory.repairing = true;

        const room = creep.room;

        if (!creep.memory.repairing) {
            // Collect energy
            const sources = roomCache.getDropped(room)
                .concat(roomCache.getTombstones(room))
                .concat(roomCache.getContainers(room));
            
            const target = creep.pos.findClosestByPath(sources);
            if (!target) return;

            if (target.resourceType) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            } else {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
            }
            return;
        }

        // Repair structures
        const repairTargets = roomCache.getRepairTargets(room);
        const target = creep.pos.findClosestByPath(repairTargets);
        if (!target) return;

        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ff9900' }, reusePath: 5 });
        }
    }
};
