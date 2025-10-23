module.exports = {
    run(creep) {
        // -------------------------
        // 1. Toggle hauling state
        // -------------------------
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.hauling = false; // out of energy, go collect
        }
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) {
            creep.memory.hauling = true; // full, deliver
        }

        // -------------------------
        // 2. Collect energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            let target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES) ||
                         creep.pos.findClosestByPath(FIND_STRUCTURES, {
                             filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 100
                         });

            if (target) {
                if (target.resourceType) {
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else {
                    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
            return;
        }

        // -------------------------
        // 3. Deliver energy
        // -------------------------
        let deliverTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (deliverTarget) {
            if (creep.transfer(deliverTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(deliverTarget, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // -------------------------
        // 4. No delivery target? Switch to builder/upgrader
        // -------------------------
        const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else if (creep.room.controller) {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller.pos, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        }
    }
};
