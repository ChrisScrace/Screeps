module.exports = {
    planChokepoints: function(room) {
        if (!room) return;
        const visual = new RoomVisual(room.name);
        const terrain = room.getTerrain();

        function isWalkable(x, y) {
            return terrain.get(x, y) !== TERRAIN_MASK_WALL;
        }

        // --- Step 1: find edge entrances ---
        const edgeTiles = [];
        for (let i = 0; i < 50; i++) {
            if (isWalkable(i, 0)) edgeTiles.push({x:i, y:0});
            if (isWalkable(i, 49)) edgeTiles.push({x:i, y:49});
            if (isWalkable(0, i)) edgeTiles.push({x:0, y:i});
            if (isWalkable(49, i)) edgeTiles.push({x:49, y:i});
        }

        const visited = {};
        const entrances = [];
        function key(t){return t.x+','+t.y;}

        function bfs(start){
            const q=[start], cluster=[];
            while(q.length){
                const t=q.shift();
                const k=key(t);
                if(visited[k])continue;
                visited[k]=true;
                cluster.push(t);
                const dirs=[
                    {x:t.x+1,y:t.y},{x:t.x-1,y:t.y},
                    {x:t.x,y:t.y+1},{x:t.x,y:t.y-1}
                ];
                for(const n of dirs){
                    if(!visited[key(n)] && edgeTiles.some(e=>e.x===n.x&&e.y===n.y))
                        q.push(n);
                }
            }
            return cluster;
        }

        for(const e of edgeTiles){
            if(!visited[key(e)]) entrances.push(bfs(e));
        }

        // --- Step 2: plan horseshoe with full rampart border ---
        for (const cluster of entrances) {
            if (cluster.length === 0) continue;

            const horizontal = cluster.every(t => t.y === cluster[0].y);
            const sorted = cluster.slice().sort((a,b)=> horizontal ? a.x-b.x : a.y-b.y);

            // move inwards two tiles
            const shift = 2;
            const shifted = sorted.map(t=>{
                return horizontal
                    ? {x:t.x, y:(t.y < 25 ? t.y+shift : t.y-shift)}
                    : {x:(t.x < 25 ? t.x+shift : t.x-shift), y:t.y};
            });

            // extend one tile past edges
            const extended = [];
            if (horizontal) {
                extended.push({x:shifted[0].x-1, y:shifted[0].y});
                extended.push(...shifted);
                extended.push({x:shifted[shifted.length-1].x+1, y:shifted[shifted.length-1].y});
            } else {
                extended.push({x:shifted[0].x, y:shifted[0].y-1});
                extended.push(...shifted);
                extended.push({x:shifted[shifted.length-1].x, y:shifted[shifted.length-1].y+1});
            }

            const rampartStart = Math.floor((extended.length - 3) / 2);
            const rampartEnd = rampartStart + 2;

            // build a set of all checkpoint tiles (walls + ramp gap + caps)
            const checkpointTiles = [];

            // draw walls and ramparts
            extended.forEach((t,i)=>{
                const isRampart = (i >= rampartStart && i <= rampartEnd);
                visual.text(isRampart ? 'R' : 'W', t.x, t.y, {
                    color: isRampart ? '#00ff00' : '#ff0000',
                    font: 0.6, align:'center'
                });
                checkpointTiles.push({x:t.x, y:t.y});
            });

            // add the caps (horseshoe ends)
            const first = extended[0];
            const last = extended[extended.length - 1];
            if (horizontal) {
                const dy = (cluster[0].y < 25) ? -1 : 1;
                checkpointTiles.push({x:first.x, y:first.y + dy});
                checkpointTiles.push({x:last.x, y:last.y + dy});
                visual.text('W', first.x, first.y + dy, {color:'#ff0000', font:0.6, align:'center'});
                visual.text('W', last.x, last.y + dy, {color:'#ff0000', font:0.6, align:'center'});
            } else {
                const dx = (cluster[0].x < 25) ? -1 : 1;
                checkpointTiles.push({x:first.x + dx, y:first.y});
                checkpointTiles.push({x:last.x + dx, y:last.y});
                visual.text('W', first.x + dx, first.y, {color:'#ff0000', font:0.6, align:'center'});
                visual.text('W', last.x + dx, last.y, {color:'#ff0000', font:0.6, align:'center'});
            }

            // --- Step 3: draw a full border of ramparts around all checkpoint tiles ---
            const dirs = [
                {x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},
                {x:-1,y:0},             {x:1,y:0},
                {x:-1,y:1}, {x:0,y:1}, {x:1,y:1}
            ];

            const rampartBorder = new Set();
            const checkpointSet = new Set(checkpointTiles.map(t=>key(t)));

            for (const t of checkpointTiles) {
                for (const d of dirs) {
                    const nx = t.x + d.x, ny = t.y + d.y;
                    const k = nx + ',' + ny;
                    if (!checkpointSet.has(k)) rampartBorder.add(k);
                }
            }

            for (const k of rampartBorder) {
                const [x,y] = k.split(',').map(Number);
                if (x >= 0 && y >= 0 && x < 50 && y < 50) {
                    visual.text('R', x, y, {color:'#00ff00', font:0.6, align:'center'});
                }
            }
        }
    }
};
