module.exports = {
    run() {
        const spawn = Game.spawns['Spawn1']; // adjust if multiple spawns
        if (!spawn) return;

        // === Show spawning status ===
        if (spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️ ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 }
            );
            return; // only spawn one creep at a time
        }

        const room = spawn.room;
        const energyAvailable = room.energyAvailable;

        // === Count creeps by role ===
        const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);
        const numHarvesters = (creepsByRole['harvester'] || []).length;
        const numHaulers = (creepsByRole['hauler'] || []).length;
        const numUpgraders = (creepsByRole['upgrader'] || []).length;
        const numBuilders = (creepsByRole['builder'] || []).length;

        const constructionSites = room.find(FIND_CONSTRUCTION_SITES).length;

        // === Target numbers (dynamic scaling) ===
        let targetHarvesters = 2;
        let targetHaulers = 1;
        let targetUpgraders = 2;
        let targetBuilders = 1;

        if (energyAvailable < 300) targetHarvesters++;          // low energy → more harvesters
        if (constructionSites > 5) targetBuilders++;           // more construction → more builders
        if (room.controller.level >= 3) {                      // scale with RCL
            targetHarvesters++;
            targetUpgraders++;
            targetBuilders++;
            targetHaulers++;                                    // more haulers for bigger rooms
        }

        // === Determine role to spawn ===
        let roleToSpawn = null;
        if (numHarvesters < targetHarvesters) roleToSpawn = 'harvester';
        else if (numHaulers < targetHaulers) roleToSpawn = 'hauler';
        else if (numUpgraders < targetUpgraders) roleToSpawn = 'upgrader';
        else if (numBuilders < targetBuilders) roleToSpawn = 'builder';

        if (!roleToSpawn) return;

        // === Dynamic body based on role and energy ===
        const body = this.getBodyForRole(roleToSpawn, energyAvailable);

        const newName = `${roleToSpawn}${Game.time}`;
        const result = spawn.spawnCreep(body, newName, { memory: { role: roleToSpawn } });

        if (result === OK) {
            console.log(`Spawning new ${roleToSpawn}: ${newName} (${body.length} parts)`);
        }
    },

    /**
     * Return dynamic body based on role and available energy
     */
    getBodyForRole(role, energy) {
        switch (role) {
            case 'harvester':
                if (energy >= 550) return [WORK, WORK, CARRY, MOVE, MOVE];
                if (energy >= 350) return [WORK, CARRY, MOVE, MOVE];
                return [WORK, CARRY, MOVE];

            case 'hauler':
                if (energy >= 550) return [CARRY, CARRY, MOVE, MOVE, MOVE];
                if (energy >= 350) return [CARRY, CARRY, MOVE, MOVE];
                return [CARRY, MOVE, MOVE];

            case 'upgrader':
                if (energy >= 550) return [WORK, WORK, CARRY, MOVE, MOVE];
                if (energy >= 350) return [WORK, CARRY, MOVE, MOVE];
                return [WORK, CARRY, MOVE];

            case 'builder':
                if (energy >= 550) return [WORK, WORK, CARRY, MOVE, MOVE];
                if (energy >= 350) return [WORK, CARRY, MOVE, MOVE];
                return [WORK, CARRY, MOVE];

            default:
                return [WORK, CARRY, MOVE];
        }
    }
};
