module.exports = {
    run() {
        const spawn = Game.spawns['Spawn1']; // rename if needed

        const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester');
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader');
        const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder');

        if (harvesters.length < 2) {
            const newName = 'Harvester' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'harvester' } });
        } else if (upgraders.length < 2) {
            const newName = 'Upgrader' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'upgrader' } });
        } else if (builders.length < 2) {
            const newName = 'Builder' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'builder' } });
        }

        if (spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️ ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 }
            );
        }
    }
};
