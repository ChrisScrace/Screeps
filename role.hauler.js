module.exports = {
    run(creep) {
        // If empty, pick up energy
        if (creep.store.getFreeCapacity() > 0) {
            // 1️⃣ Pick up dropped energy first
            const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY
            });
            if (dropped.length > 0) {
                const target = creep.pos.findClosestByPath(dropped);
                if (target) {
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }

            // 2️⃣ Withdraw from containers
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });
            if (containers.length > 0) {
                const container = creep.pos.findClosestByPath(containers);
                if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
        }

        // If full, deliver energy
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Priority: Spawn > Extensions > Towers > Storage
            const targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => 
                    (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_TOWER)
                    && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (targets.length > 0) {
                const target = creep.pos.findClosestByPath(targets);
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }

            // Otherwise deposit in storage if available
            const storage = creep.room.storage;
            if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
        }
    }
};
