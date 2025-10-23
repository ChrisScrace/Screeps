module.exports = {
    run(creep) {
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
        // 2️⃣ Collect energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            // Use cached targets for pickup
            if (!creep.room._pickupTargets) {
                creep.room._pickupTargets = creep.room.find(FIND_DROPPED_RESOURCES)
                    .concat(creep.room.find(FIND_TOMBSTONES, { filter: t => t.store[RESOURCE_ENERGY] > 0 }))
                    .concat(creep.room.find(FIND_STRUCTURES, { 
                        filter: s => 
                            (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
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
        // 3️⃣ Deliver energy (cached)
        // -------------------------
        if (!creep.room._deliveryTargets) {
            const structures = creep.room.find(FIND_STRUCTURES, {
                filter: s => 
                    (s.structureType === STRUCTURE_SPAWN ||
                     s.structureType === STRUCTURE_TOWER ||
                     s.structureType === STRUCTURE_EXTENSION) &&
                     s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            // Sort by priority: spawn > tower > extension
            const priority = { [STRUCTURE_SPAWN]: 1, [STRUCTURE_TOWER]: 2, [STRUCTURE_EXTENSION]: 3 };
            structures.sort((a, b) => priority[a.structureType] - priority[b.structureType]);

            creep.room._deliveryTargets = structures;
        }

        // Pick first available
        let target = creep.room._deliveryTargets[0];

        // Fallback: builders
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: c => c.memory.role === 'builder' && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
        }

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
            }
            return;
        }

        // -------------------------
        // 4️⃣ Drop energy if nowhere else
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
