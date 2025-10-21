module.exports = {
    run(room) {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });

        for (const tower of towers) {
            // 1️⃣ Attack hostile creeps first
            const hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (hostile) {
                tower.attack(hostile);
                continue; // Prioritize combat over repairs/heals
            }

            // 2️⃣ Heal friendly creeps
            const injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: c => c.hits < c.hitsMax
            });
            if (injured) {
                tower.heal(injured);
                continue;
            }

            // 3️⃣ Repair structures (avoid wasting energy on walls/ramparts too early)
            const repairTarget = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: s =>
                    s.hits < s.hitsMax * 0.5 &&
                    s.structureType !== STRUCTURE_WALL &&
                    s.structureType !== STRUCTURE_RAMPART
            });

            if (repairTarget && tower.store[RESOURCE_ENERGY] > 400) {
                tower.repair(repairTarget);
            }
        }
    }
};