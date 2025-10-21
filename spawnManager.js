module.exports = {
    run() {
        const spawn = Game.spawns['Spawn1']; // rename if needed
        if (spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️ ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 }
            );
            return; // Don’t spawn multiple at once
        }

        const room = spawn.room;
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;

        // Count creeps by role
        const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);
        const numHarvesters = (creepsByRole['harvester'] || []).length;
        const numUpgraders = (creepsByRole['upgrader'] || []).length;
        const numBuilders = (creepsByRole['builder'] || []).length;

        // Get construction sites to decide if builders are needed
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES).length;

        // === Dynamic target counts ===
        let targetHarvesters = 2;
        let targetUpgraders = 2;
        let targetBuilders = 1;

        // More harvesters if low on energy
        if (energyAvailable < 300) {
            targetHarvesters = 3;
        }

        // More builders if there are many construction sites
        if (constructionSites > 5) {
            targetBuilders = 2;
        }

        // Scale up with room level
        if (room.controller.level >= 3) {
            targetHarvesters++;
            targetUpgraders++;
            targetBuilders++;
        }

        // === Decide which role to spawn ===
        let roleToSpawn = null;
        if (numHarvesters < targetHarvesters) roleToSpawn = 'harvester';
        else if (numUpgraders < targetUpgraders) roleToSpawn = 'upgrader';
        else if (numBuilders < targetBuilders) roleToSpawn = 'builder';

        if (roleToSpawn) {
            // === Dynamic body composition ===
            const body = this.getDynamicBody(energyAvailable);

            const newName = `${roleToSpawn}${Game.time}`;
            const result = spawn.spawnCreep(body, newName, { memory: { role: roleToSpawn } });

            if (result === OK) {
                console.log(`Spawning new ${roleToSpawn}: ${newName} (${body.length} parts)`);
            }
        }
    },

    /**
     * Creates the best creep body we can afford given current energy
     */
    getDynamicBody(energy) {
        const basicPart = [WORK, CARRY, MOVE];
        const body = [];

        // Repeat pattern until we run out of energy
        let cost = 0;
        while (cost + 200 <= energy && body.length < 15) { // cap to avoid huge creeps
            body.push(WORK, CARRY, MOVE);
            cost += 200;
        }

        // Always ensure at least a basic body
        return body.length > 0 ? body : basicPart;
    }
};
