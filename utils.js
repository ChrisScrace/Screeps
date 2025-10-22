module.exports = {

findIdlePosition(room) {
    const spawns = room.find(FIND_MY_SPAWNS);
    if (!spawns || spawns.length === 0) return null;
    const spawn = spawns[0];

    // reuse cached value if present
    if (Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].idlePos) {
      const p = Memory.rooms[room.name].idlePos;
      return new RoomPosition(p.x, p.y, p.roomName);
    }

    const terrain = room.getTerrain();

    // search for a safe tile
    for (let radius = 2; radius <= 6; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const x = spawn.pos.x + dx;
          const y = spawn.pos.y + dy;
          if (x < 0 || y < 0 || x > 49 || y > 49) continue;
          if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

          const pos = new RoomPosition(x, y, room.name);

          // skip tiles near spawn or sources
          if (pos.inRangeTo(spawn, 2)) continue;
          if (pos.findInRange(FIND_SOURCES, 2).length > 0) continue;

          // skip tiles with structures
          if (pos.lookFor(LOOK_STRUCTURES).length > 0) continue;

          // found one — cache and return
          Memory.rooms = Memory.rooms || {};
          Memory.rooms[room.name] = Memory.rooms[room.name] || {};
          Memory.rooms[room.name].idlePos = { x: pos.x, y: pos.y, roomName: pos.roomName };
          return pos;
        }
      }
    }

    // nothing found
    return null;
  },

};
