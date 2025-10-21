import { MAP_WIDTH, MAP_HEIGHT } from './constants';

type Room = { x: number, y: number, width: number, height: number, id: number, connections: Set<number> };
type Graph = Map<number, Room>;

// Generate level layout using rooms and corridors
const generateBaseLayout = () => {
    const grid = Array(MAP_WIDTH).fill(null).map(() => Array(MAP_HEIGHT).fill(0)); // 0 = wall, 1 = floor
    const rooms: Room[] = [];
    const maxRooms = 20;
    const minRoomSize = 4;
    const maxRoomSize = 8;

    for (let i = 0; i < maxRooms; i++) {
        const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

        const newRoom = { x, y, width: w, height: h, id: i, connections: new Set<number>() };
        let failed = false;
        for (const otherRoom of rooms) {
            // Add padding to prevent rooms from touching
            if (
                newRoom.x < otherRoom.x + otherRoom.width + 1 &&
                newRoom.x + newRoom.width + 1 > otherRoom.x &&
                newRoom.y < otherRoom.y + otherRoom.height + 1 &&
                newRoom.y + newRoom.height + 1 > otherRoom.y
            ) {
                failed = true;
                break;
            }
        }

        if (!failed) {
            for (let ry = newRoom.y; ry < newRoom.y + newRoom.height; ry++) {
                for (let rx = newRoom.x; rx < newRoom.x + newRoom.width; rx++) {
                    grid[rx][ry] = 1;
                }
            }
            rooms.push(newRoom);
        }
    }
    
    // Give rooms their proper IDs
    rooms.forEach((room, i) => room.id = i);

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const center1 = { x: Math.floor(rooms[i].x + rooms[i].width / 2), y: Math.floor(rooms[i].y + rooms[i].height / 2) };
        const center2 = { x: Math.floor(rooms[i+1].x + rooms[i+1].width / 2), y: Math.floor(rooms[i+1].y + rooms[i+1].height / 2) };
        
        rooms[i].connections.add(i + 1);
        rooms[i+1].connections.add(i);

        if (Math.random() > 0.5) { // Horizontal then vertical
            for (let x = Math.min(center1.x, center2.x); x <= Math.max(center1.x, center2.x); x++) grid[x][center1.y] = 1;
            for (let y = Math.min(center1.y, center2.y); y <= Math.max(center1.y, center2.y); y++) grid[center2.x][y] = 1;
        } else { // Vertical then horizontal
            for (let y = Math.min(center1.y, center2.y); y <= Math.max(center1.y, center2.y); y++) grid[center1.x][y] = 1;
            for (let x = Math.min(center1.x, center2.x); x <= Math.max(center1.x, center2.x); x++) grid[x][center2.y] = 1;
        }
    }
    
    return { grid, rooms };
};

const findLongestPath = (graph: Graph, startNodeId: number) => {
    let longestPath: number[] = [];
    
    const bfs = (startId: number): {dist: Map<number, number>, prev: Map<number, number | null>} => {
        const dist = new Map<number, number>();
        const prev = new Map<number, number | null>();
        const queue = [startId];
        
        for (const id of graph.keys()) {
            dist.set(id, Infinity);
            prev.set(id, null);
        }
        dist.set(startId, 0);

        while(queue.length > 0) {
            const u = queue.shift()!;
            const uNode = graph.get(u)!;
            for (const v of uNode.connections) {
                if (dist.get(v) === Infinity) {
                    dist.set(v, dist.get(u)! + 1);
                    prev.set(v, u);
                    queue.push(v);
                }
            }
        }
        return { dist, prev };
    };

    // Find the furthest node from the start node
    const { dist: distFromStart } = bfs(startNodeId);
    let furthestNodeId = startNodeId;
    let maxDist = 0;
    for (const [id, d] of distFromStart.entries()) {
        if (d > maxDist) {
            maxDist = d;
            furthestNodeId = id;
        }
    }
    
    // Find the path from the start node to the furthest node
    const { prev } = bfs(startNodeId);
    const path: number[] = [];
    let current = furthestNodeId;
    while(current !== null) {
        path.unshift(current);
        current = prev.get(current)!;
    }
    
    return path;
};


export const generateLevel = () => {
    const { grid, rooms } = generateBaseLayout();
    const graph: Graph = new Map(rooms.map(r => [r.id, r]));

    const spawnRoom = rooms[0];
    const criticalPath = findLongestPath(graph, spawnRoom.id);
    const exitRoom = rooms[criticalPath[criticalPath.length-1]];

    const colors = ['red', 'green', 'blue', 'yellow'];
    const numKeys = Math.min(Math.floor(Math.random() * 3) + 1, criticalPath.length - 1, colors.length);
    const colorSequence = colors.sort(() => 0.5 - Math.random()).slice(0, numKeys);

    const placedDoors: { x: number, y: number, orientation: 'horizontal' | 'vertical', color: string }[] = [];
    const placedKeys: { x: number, y: number, color: string }[] = [];
    const placedExit = { x: 0, y: 0 };

    let keyPlacementZones: Room[] = [spawnRoom];
    
    // Place doors and keys along the critical path
    for(let i=0; i < colorSequence.length; i++) {
        const color = colorSequence[i];
        const roomBeforeDoor = rooms[criticalPath[i]];
        const roomAfterDoor = rooms[criticalPath[i+1]];
        
        // Find a corridor tile between these two rooms to place the door
        const center1 = { x: Math.floor(roomBeforeDoor.x + roomBeforeDoor.width / 2), y: Math.floor(roomBeforeDoor.y + roomBeforeDoor.height / 2) };
        const center2 = { x: Math.floor(roomAfterDoor.x + roomAfterDoor.width / 2), y: Math.floor(roomAfterDoor.y + roomAfterDoor.height / 2) };
        
        // Heuristic to find a good door location on the corridor
        const midX = Math.floor((center1.x + center2.x) / 2);
        const midY = Math.floor((center1.y + center2.y) / 2);
        
        let doorLoc = { x: midX, y: midY };
        if (grid[midX][center1.y] === 1 && grid[midX][center1.y+1] === 0) doorLoc = {x: midX, y: center1.y};
        else if(grid[center1.x][midY] === 1 && grid[center1.x+1][midY] === 0) doorLoc = {x: center1.x, y: midY};

        const isVerticalPassage = grid[doorLoc.x - 1][doorLoc.y] === 0 && grid[doorLoc.x + 1][doorLoc.y] === 0;
        placedDoors.push({ ...doorLoc, orientation: isVerticalPassage ? 'vertical' : 'horizontal', color });
        
        // Place key in a random room from the current accessible zone
        const keyRoom = keyPlacementZones[Math.floor(Math.random() * keyPlacementZones.length)];
        const keyLoc = {
            x: keyRoom.x + Math.floor(Math.random() * keyRoom.width),
            y: keyRoom.y + Math.floor(Math.random() * keyRoom.height)
        };
        placedKeys.push({ ...keyLoc, color });

        // The next key can be placed in any room up to this new door
        keyPlacementZones.push(roomAfterDoor);
    }
    
    // Place Exit
    placedExit.x = exitRoom.x + Math.floor(exitRoom.width / 2);
    placedExit.y = exitRoom.y + Math.floor(exitRoom.height / 2);

    return { 
        grid, 
        rooms, 
        doors: placedDoors, 
        keys: placedKeys,
        exit: placedExit,
        spawn: { x: spawnRoom.x + Math.floor(spawnRoom.width / 2), y: spawnRoom.y + Math.floor(spawnRoom.height/2) },
        keyColors: colorSequence,
    };
};