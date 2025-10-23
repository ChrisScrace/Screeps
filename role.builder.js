const energyManager = require('energyManager');

module.exports = {
    run(creep) {
        // -------------------------
        // 1. Toggle building state
        // -------------------------
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
        }

        // -------------------------
        // 2. Collect energy if not building
        // -------------------------
        if (!creep.memory.building) {
            energyManager.fetchEnergy(creep);
            return;
        }

        // -------------------------
        // 3. Build construction sites (smart + crowd-aware)
        // -------------------------
        const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (sites.length > 0) {
            const weightCompletion = 50; // how much completion ratio affects score
            const weightCreeps = 5;      // how much nearby creeps affect score

            const scoredSites = sites.map(site => {
                const distance = creep.pos.getRangeTo(site.pos); // straight line distance
                const completionRatio = site.progress / site.progressTotal;

                // Count creeps within 2 tiles of this site
                const nearbyCreeps = site.pos.findInRange(FIND_MY_CREEPS, 2).length;

                const score = distance - weightCompletion * completionRatio + weightCreeps * nearbyCreeps;
                return { site, score };
            });

            // Pick site with lowest score
            scoredSites.sort((a, b) => a.score - b.score);
            const targetSite = scoredSites[0].site;

            if (creep.build(targetSite) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSite, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // -------------------------
        // 4. Upgrade controller if nothing to build
        // -------------------------
        if (creep.room.controller) {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller.pos, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        }
    }
};
