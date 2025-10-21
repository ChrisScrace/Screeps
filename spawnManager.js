const sourceManager = require('sourceManager');

module.exports = {
    run() {
        const spawn = Game.spawns['Spawn1'];
        if (!spawn) return;
        const room = spawn.room;

        // Initialize source memory
        sourceManager.initRoom(room);

        if (spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️ ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 }
            );
            return;
        }

        const energyAvailable = room.energyAvailable;

        const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);
        const numHarvesters = (creepsByRole['harvester'] || []).length;
        const numHaulers = (creepsByRole['hauler'] || []).length;
        const numUpgraders = (creepsByRole['upgrader'] || []).length;
        const numBuilders = (creepsByRole['builder'] || []).length;

        // Dynamic target numbers
        const freeTileCount = Object.values(Memory.rooms[room.name].sources)
                                   .reduce((sum, s) => sum + s.tiles.length, 0);

        let targetHarvesters = freeTileCount;
        let targetHaulers = freeTileCount; // 1 hauler per source tile
        let targetUpgraders = 2;
        let targetBuilders = room.find(FIND_CONSTRUCTION_SITES).length > 5 ? 2 : 1;

        // Prioritize spawning
        let roleToSpawn = null;
        if (numHarvesters < targetHarvesters) roleToSpawn = 'harvester';
        else if (numHaulers < targetHaulers) roleToSpawn = 'hauler';
        else if (numUpgraders < targetUpgraders) roleToSpawn = 'upgrader';
        else if (numBuilders < targetBuilders) roleToSpawn = 'builder';

        if (!roleToSpawn) return;

        const body = this.getBodyForRole(roleToSpawn, energyAvailable);
        const newName = `${roleToSpawn}${Game.time}`;
        const result = spawn.spawnCreep(body, newName, { memory: { role: roleToSpawn } });
        if (result === OK) console.log(`Spawning new ${roleToSpawn}: ${newName} (${body.length} parts)`);
    },

    getBodyForRole(role, energy) {
        switch (role) {
            case 'harvester': return energy >= 550 ? [WORK, WORK, CARRY, MOVE, MOVE] :
                                         energy >= 350 ? [WORK, CARRY, MOVE, MOVE] : [WORK, CARRY, MOVE];
            case 'hauler': return energy >= 550 ? [CARRY, CARRY, MOVE, MOVE, MOVE] :
                                  energy >= 350 ? [CARRY, CARRY, MOVE, MOVE] : [CARRY, MOVE, MOVE];
            case 'upgrader': return energy >= 550 ? [WORK, WORK, CARRY, MOVE, MOVE] :
                                    energy >= 350 ? [WORK, CARRY, MOVE, MOVE] : [WORK, CARRY, MOVE];
            case 'builder': return energy >= 550 ? [WORK, WORK, CARRY, MOVE, MOVE] :
                                   energy >= 350 ? [WORK, CARRY, MOVE, MOVE] : [WORK, CARRY, MOVE];
            default: return [WORK, CARRY, MOVE];
        }
    }
};
