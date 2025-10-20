
import { MAP_WIDTH, MAP_HEIGHT } from './constants';

// Generate level layout using rooms and corridors
export const generateLevel = () => {
    const grid = Array(MAP_WIDTH).fill(null).map(() => Array(MAP_HEIGHT).fill(0)); // 0 = wall, 1 = floor
    const rooms: { x: number, y: number, width: number, height: number, wallTheme?: string, floorTheme?: string }[] = [];
    const maxRooms = 15;
    const minRoomSize = 4;
    const maxRoomSize = 8;

    for (let i = 0; i < maxRooms; i++) {
        const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
        const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

        const newRoom = { x, y, width: w, height: h };
        let failed = false;
        for (const otherRoom of rooms) {
            if (
                newRoom.x < otherRoom.x + otherRoom.width &&
                newRoom.x + newRoom.width > otherRoom.x &&
                newRoom.y < otherRoom.y + otherRoom.height &&
                newRoom.y + newRoom.height > otherRoom.y
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

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const center1 = { x: Math.floor(rooms[i].x + rooms[i].width / 2), y: Math.floor(rooms[i].y + rooms[i].height / 2) };
        const center2 = { x: Math.floor(rooms[i+1].x + rooms[i+1].width / 2), y: Math.floor(rooms[i+1].y + rooms[i+1].height / 2) };

        if (Math.random() > 0.5) { // Horizontal then vertical
            for (let x = Math.min(center1.x, center2.x); x <= Math.max(center1.x, center2.x); x++) grid[x][center1.y] = 1;
            for (let y = Math.min(center1.y, center2.y); y <= Math.max(center1.y, center2.y); y++) grid[center2.x][y] = 1;
        } else { // Vertical then horizontal
            for (let y = Math.min(center1.y, center2.y); y <= Math.max(center1.y, center2.y); y++) grid[center1.x][y] = 1;
            for (let x = Math.min(center1.x, center2.x); x <= Math.max(center1.x, center2.x); x++) grid[x][center2.y] = 1;
        }
    }
    
    // Find door locations
    const doorLocations: { x: number, y: number, orientation: 'horizontal' | 'vertical' }[] = [];
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
            if (grid[x][y] !== 1) continue;

            // Check for vertical passage (walls left/right, floor top/bottom)
            const isVerticalPassage = grid[x - 1][y] === 0 && grid[x + 1][y] === 0 && grid[x][y - 1] === 1 && grid[x][y + 1] === 1;
            // Check for horizontal passage (walls top/bottom, floor left/right)
            const isHorizontalPassage = grid[x][y - 1] === 0 && grid[x][y + 1] === 0 && grid[x - 1][y] === 1 && grid[x + 1][y] === 1;

            if (isVerticalPassage || isHorizontalPassage) {
                // Avoid placing doors right next to each other
                const tooClose = doorLocations.some(d => Math.abs(d.x - x) + Math.abs(d.y - y) < 3);
                if (!tooClose) {
                    doorLocations.push({ x, y, orientation: isVerticalPassage ? 'vertical' : 'horizontal' });
                }
            }
        }
    }
    
    return { grid, rooms, doorLocations };
};
