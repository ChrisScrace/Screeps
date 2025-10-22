const sourceManager = require('sourceManager');

const roleBodies = {
  harvester: (energy) => {
    const body = [];
    let cost = 0;
    while (cost + 200 <= energy && body.length < 9) {
      body.push(WORK, CARRY, MOVE);
      cost += 200;
    }
    return body.length ? body : [WORK, CARRY, MOVE];
  },
  hauler: (energy) => {
    const body = [];
    let cost = 0;
    while (cost + 150 <= energy && body.length < 15) {
      body.push(CARRY, CARRY, MOVE);
      cost += 150;
    }
    return body.length ? body : [CARRY, MOVE];
  },
  upgrader: (energy) => {
    const body = [];
    let cost = 0;
    while (cost + 200 <= energy && body.length < 15) {
      body.push(WORK, CARRY, MOVE);
      cost += 200;
    }
    return body.length ? body : [WORK, CARRY, MOVE];
  },
  builder: (energy) => {
    const body = [];
    let cost = 0;
    while (cost + 200 <= energy && body.length < 15) {
      body.push(WORK, CARRY, MOVE);
      cost += 200;
    }
    return body.length ? body : [WORK, CARRY, MOVE];
  }
};

module.exports = {
  run() {
    const spawn = Game.spawns['Spawn1'];  // ← adjust if spawn has different name
    if (!spawn) {
      console.log('⚠️ Spawn not found');
      return;
    }
    if (spawn.spawning) {
      // Optionally show the role being spawned
      const spawningCreep = Game.creeps[spawn.spawning.name];
      if (spawningCreep) {
        spawn.room.visual.text(
          '🛠️ ' + spawningCreep.memory.role,
          spawn.pos.x + 1,
          spawn.pos.y,
          { align: 'left', opacity: 0.8 }
        );
      }
      return;
    }

    const room = spawn.room;
    const energyAvailable = room.energyAvailable;

    // Ensure source data is initialized
    sourceManager.initRoom(room);
    const sources = Memory.rooms[room.name].sources;
    if (!sources) {
      console.log('⚠️ No source data for room', room.name);
      return;
    }

    const creepsByRole = _.groupBy(Game.creeps, c => c.memory.role);
    const harvesters = creepsByRole['harvester'] || [];
    const haulers = creepsByRole['hauler'] || [];
    const upgraders = creepsByRole['upgrader'] || [];
    const builders = creepsByRole['builder'] || [];

    // 1. HARVESTERS: fill all free source-tiles
    let sourceToSpawn = null;
    let maxFree = -1;
    for (const sId in sources) {
      const tileCount = (sources[sId].tiles || []).length;
      const assignedCount = harvesters.filter(h => h.memory.sourceId === sId).length;
      const freeTiles = tileCount - assignedCount;
      // Debug log
      // console.log(`Source ${sId}: tileCount=${tileCount}, assigned=${assignedCount}, free=${freeTiles}`);
      if (freeTiles > maxFree) {
        maxFree = freeTiles;
        sourceToSpawn = sId;
      }
    }
    if (sourceToSpawn && maxFree > 0) {
      this.spawnCreep(spawn, 'harvester', sourceToSpawn, energyAvailable);
      return;
    }

    // 2. HAULERS: only after harvesters exist. Spawn if dropped energy > existing haulers
    const freeEnergy = room.find(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY });
    if (harvesters.length > 0 && freeEnergy.length > haulers.length) {
      this.spawnCreep(spawn, 'hauler', null, energyAvailable);
      return;
    }

    // 3. UPGRADERS / BUILDERS
    const targetUpgraders = room.controller.level >= 3 ? 3 : 2;
    const targetBuilders = room.find(FIND_CONSTRUCTION_SITES).length > 5 ? 2 : 1;

    if (upgraders.length < targetUpgraders) {
      this.spawnCreep(spawn, 'upgrader', null, energyAvailable);
      return;
    }
    if (builders.length < targetBuilders) {
      this.spawnCreep(spawn, 'builder', null, energyAvailable);
      return;
    }

    // If nothing else, maybe idle or additional logic
    // console.log('✅ All primary roles satisfied');
  },

  spawnCreep(spawn, role, sourceId = null, energy) {
    const body = roleBodies[role](energy);
    const name = `${role}_${Game.time}`;
    const memory = { role: role };
    if (sourceId) {
      memory.sourceId = sourceId;
    }
    const result = spawn.spawnCreep(body, name, { memory: memory });
    if (result === OK) {
      console.log(`Spawning ${role} ${name} with body [${body.join(',')}]`);
    } else {
      console.log(`⚠️ spawnCreep error: ${result} for ${role} ${name}`);
    }
  },

  findIdlePosition(room) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return null;

    // If already cached in memory, reuse it
    if (Memory.rooms[room.name]?.idlePos) {
      const { x, y, roomName } = Memory.rooms[room.name].idlePos;
      return new RoomPosition(x, y, roomName);
    }

    const terrain = room.getTerrain();

    // Search in expanding radius from spawn
    for (let radius = 2; radius <= 6; radius++) {
      const positions = [];
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const x = spawn.pos.x + dx;
          const y = spawn.pos.y + dy;
          if (x < 0 || y < 0 || x > 49 || y > 49) continue;

          // Check terrain
          if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

          const pos = new RoomPosition(x, y, room.name);

          // Skip if near spawn or sources
          if (pos.inRangeTo(spawn, 2)) continue;
          if (pos.findInRange(FIND_SOURCES, 2).length > 0) continue;

          // Skip if there’s a structure there
          const structures = pos.lookFor(LOOK_STRUCTURES);
          if (structures.length > 0) continue;

          positions.push(pos);
        }
      }

      if (positions.length > 0) {
        const idlePos = positions[0]; // could randomize if you like
        Memory.rooms[room.name] = Memory.rooms[room.name] || {};
        Memory.rooms[room.name].idlePos = {
          x: idlePos.x,
          y: idlePos.y,
          roomName: idlePos.roomName
        };
        return idlePos;
      }
    }

    console.log(`⚠️ No safe idle position found in ${room.name}`);
    return null;
  }
};
