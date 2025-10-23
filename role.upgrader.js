module.exports = {
    run(creep) {
        // -------------------------
        // 1️⃣ Toggle upgrading state
        // -------------------------
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
        }

        // -------------------------
        // 2️⃣ Collect energy if not upgrading
        // -------------------------
        if (!creep.memory.upgrading) {
            if (!creep.room._pickupTargets) {
                creep.room._pickupTargets = creep.room.find(FIND_DROPPED_RESOURCES)
                    .concat(creep.room.find(FIND_TOMBSTONES, { filter: t => t.store[RESOURCE_ENERGY] > 0 }))
                    .concat(creep.room.find(FIND_STRUCTURES, {
                        filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                            s.store[RESOURCE_ENERGY] > 0
                    }));
            }

            const target = creep.pos.findClosestByPath(creep.room._pickupTargets);
            if (target) {
                if (target.resourceType) {
                    if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                    }
                } else {
                    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 5 });
                    }
                }
            }
            return;
        }

        // -------------------------
        // 3️⃣ Upgrade controller
        // -------------------------
        const controller = creep.room.controller;
        if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 5 });
        }
    }
};
