module.exports = {
    run(creep) {
        // -------------------------
        // 1️⃣ Toggle building state
        // -------------------------
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
        }

        // -------------------------
        // 2️⃣ Collect energy if not building
        // -------------------------
        if (!creep.memory.building) {
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
        // 3️⃣ Build construction sites
        // -------------------------
        if (!creep.room._buildTargets) {
            creep.room._buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
        }

        const site = creep.pos.findClosestByPath(creep.room._buildTargets);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' }, reusePath: 5 });
            }
            return;
        }

        // -------------------------
        // 4️⃣ Fallback: upgrade controller if nothing to build
        // -------------------------
        const controller = creep.room.controller;
        if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
        }
    }
};
