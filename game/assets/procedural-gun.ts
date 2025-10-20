// A simple procedural gun generator for 2D sprites

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
    return Math.floor(rand(min, max));
}

function randChoice<T>(arr: T[]): T {
    return arr[randInt(0, arr.length)];
}

// Helper to lighten/darken a hex color
function shadeColor(color: string, percent: number) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.round(R * (100 + percent) / 100);
    G = Math.round(G * (100 + percent) / 100);
    B = Math.round(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;
    
    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}


export const generateProceduralGun = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000'; // Black outlines for definition

    // --- Palettes ---
    const palettes = {
        dark: { body: '#333333', barrel: '#444444', grip: '#222222', details: '#555555' },
        grey: { body: '#6c757d', barrel: '#495057', grip: '#343a40', details: '#adb5bd' },
        tan: { body: '#c6ac8f', barrel: '#544b3d', grip: '#6f6250', details: '#8e7f6c' },
    };
    const basePalette = randChoice(Object.values(palettes));
    const palette = {
      ...basePalette,
      bodyLight: shadeColor(basePalette.body, 15),
      bodyDark: shadeColor(basePalette.body, -15),
      barrelLight: shadeColor(basePalette.barrel, 15),
      barrelDark: shadeColor(basePalette.barrel, -15),
      gripLight: shadeColor(basePalette.grip, 15),
      gripDark: shadeColor(basePalette.grip, -15),
      detailsLight: shadeColor(basePalette.details, 15),
      detailsDark: shadeColor(basePalette.details, -15),
    }

    // --- Stats ---
    const stats = { fireRate: 0, bulletSpeed: 0, damage: 0 };
    
    // --- Perspective & Anchor ---
    const p = { x: 0.8, y: 0.5 }; // Perspective factors
    const anchor = { x: 300, y: 200 }; // Back of the gun body

    // --- Part Generation ---
    // 1. Body/Receiver
    const bodyLength = rand(90, 140);
    const bodyHeight = rand(40, 60);
    const bodyWidth = rand(15, 25);

    const body_x0 = anchor.x;
    const body_y0 = anchor.y;
    const body_x1 = anchor.x - bodyLength * p.x;
    const body_y1 = anchor.y - bodyLength * p.y;
    
    // Side face
    ctx.fillStyle = palette.body;
    ctx.beginPath();
    ctx.moveTo(body_x0, body_y0);
    ctx.lineTo(body_x1, body_y1);
    ctx.lineTo(body_x1, body_y1 - bodyHeight);
    ctx.lineTo(body_x0, body_y0 - bodyHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top face
    ctx.fillStyle = palette.bodyLight;
    ctx.beginPath();
    ctx.moveTo(body_x0, body_y0 - bodyHeight);
    ctx.lineTo(body_x1, body_y1 - bodyHeight);
    ctx.lineTo(body_x1 + bodyWidth, body_y1 - bodyHeight);
    ctx.lineTo(body_x0 + bodyWidth, body_y0 - bodyHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Front face (barrel attaches here)
    const barrelAttach = {
        x: body_x1,
        y: body_y1 - bodyHeight / 2,
    };
    
    // 2. Barrel
    const barrelLength = rand(80, 200);
    const barrelDiameter = rand(10, 15);
    
    const barrel_x0 = barrelAttach.x;
    const barrel_y0 = barrelAttach.y;
    const barrel_x1 = barrel_x0 - barrelLength * p.x;
    const barrel_y1 = barrel_y0 - barrelLength * p.y;

    // Barrel Top
    ctx.fillStyle = palette.barrelLight;
    ctx.beginPath();
    ctx.moveTo(barrel_x0, barrel_y0 - barrelDiameter / 2);
    ctx.lineTo(barrel_x1, barrel_y1 - barrelDiameter / 2);
    ctx.lineTo(barrel_x1 + barrelDiameter, barrel_y1 - barrelDiameter / 2);
    ctx.lineTo(barrel_x0 + barrelDiameter, barrel_y0 - barrelDiameter / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Barrel Side
    ctx.fillStyle = palette.barrel;
    ctx.beginPath();
    ctx.moveTo(barrel_x0, barrel_y0 + barrelDiameter / 2);
    ctx.lineTo(barrel_x1, barrel_y1 + barrelDiameter / 2);
    ctx.lineTo(barrel_x1, barrel_y1 - barrelDiameter / 2);
    ctx.lineTo(barrel_x0, barrel_y0 - barrelDiameter / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Muzzle
    ctx.fillStyle = palette.barrelDark;
    ctx.beginPath();
    ctx.ellipse(barrel_x1 + barrelDiameter / 2, barrel_y1, barrelDiameter / 2 + 1, barrelDiameter / 2 + 1, 0, 0, 2 * Math.PI);
    ctx.fill();

    // 3. Grip/Stock
    const gripType = randChoice(['pistol', 'rifle', 'pdw']);
    
    if (gripType === 'pistol') {
        const gripLength = rand(50, 70);
        const gripAngle = Math.PI / 10; // Angle down and back
        const grip_x0 = anchor.x - bodyLength * p.x * 0.7;
        const grip_y0 = anchor.y;

        ctx.fillStyle = palette.grip;
        ctx.beginPath();
        ctx.moveTo(grip_x0, grip_y0);
        ctx.lineTo(grip_x0 - 15, grip_y0);
        ctx.lineTo(grip_x0 - 15 + Math.cos(gripAngle) * gripLength, grip_y0 + Math.sin(gripAngle) * gripLength);
        ctx.lineTo(grip_x0 + Math.cos(gripAngle) * gripLength, grip_y0 + Math.sin(gripAngle) * gripLength);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else { // Rifle or PDW stock
        const stockLength = (gripType === 'rifle') ? rand(60, 90) : rand(40, 60);
        const stockHeight = bodyHeight * 0.7;
        
        // Stock Side
        ctx.fillStyle = palette.grip;
        ctx.beginPath();
        ctx.moveTo(anchor.x, anchor.y - bodyHeight / 2 - stockHeight / 2);
        ctx.lineTo(anchor.x + stockLength, anchor.y - bodyHeight / 2 - stockHeight / 2 + 10);
        ctx.lineTo(anchor.x + stockLength, anchor.y - bodyHeight / 2 + stockHeight / 2 + 10);
        ctx.lineTo(anchor.x, anchor.y - bodyHeight / 2 + stockHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Stock Top
        ctx.fillStyle = palette.gripLight;
        ctx.beginPath();
        ctx.moveTo(anchor.x, anchor.y - bodyHeight / 2 - stockHeight / 2);
        ctx.lineTo(anchor.x + stockLength, anchor.y - bodyHeight / 2 - stockHeight / 2 + 10);
        ctx.lineTo(anchor.x + stockLength + bodyWidth, anchor.y - bodyHeight / 2 - stockHeight / 2 + 10);
        ctx.lineTo(anchor.x + bodyWidth, anchor.y - bodyHeight / 2 - stockHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // 4. Magazine
    if (Math.random() > 0.3) {
        const magLength = rand(40, 80);
        const magWidth = bodyWidth * 0.8;
        const mag_x0 = anchor.x - bodyLength * p.x * 0.4;
        const mag_y0 = anchor.y;

        // Mag side
        ctx.fillStyle = palette.details;
        ctx.beginPath();
        ctx.moveTo(mag_x0, mag_y0);
        ctx.lineTo(mag_x0 - 15, mag_y0);
        ctx.lineTo(mag_x0 - 15, mag_y0 + magLength);
        ctx.lineTo(mag_x0, mag_y0 + magLength);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Mag front
        ctx.fillStyle = palette.detailsDark;
        ctx.beginPath();
        ctx.moveTo(mag_x0 - 15, mag_y0);
        ctx.lineTo(mag_x0 - 15 + magWidth, mag_y0);
        ctx.lineTo(mag_x0 - 15 + magWidth, mag_y0 + magLength);
        ctx.lineTo(mag_x0 - 15, mag_y0 + magLength);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // 5. Optics
    if (Math.random() > 0.4) {
        const scopeType = randChoice(['dot_sight', 'scope']);
        
        if (scopeType === 'dot_sight') {
            const scope_x0 = anchor.x - bodyLength * p.x * 0.6;
            const scope_y_base = anchor.y - bodyHeight - bodyLength * p.y * 0.6;
            
            ctx.fillStyle = palette.detailsDark;
            ctx.fillRect(scope_x0, scope_y_base - 15, 30, 15);
            ctx.strokeRect(scope_x0, scope_y_base - 15, 30, 15);

        } else {
            const scope_x0 = anchor.x - bodyLength * p.x * 0.7;
            const scope_x1 = anchor.x - bodyLength * p.x * 0.3;
            const scope_y_base0 = anchor.y - bodyHeight - bodyLength * p.y * 0.7;
            const scope_y_base1 = anchor.y - bodyHeight - bodyLength * p.y * 0.3;
            const scopeRadius = 12;

            ctx.fillStyle = palette.details;
            ctx.beginPath();
            ctx.moveTo(scope_x0, scope_y_base0 - scopeRadius);
            ctx.lineTo(scope_x1, scope_y_base1 - scopeRadius);
            ctx.lineTo(scope_x1, scope_y_base1 + scopeRadius);
            ctx.lineTo(scope_x0, scope_y_base0 + scopeRadius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = palette.detailsDark;
            ctx.beginPath();
            ctx.ellipse(scope_x1, scope_y_base1, scopeRadius, scopeRadius, 0, 0, 2*Math.PI);
            ctx.fill();
        }
    }

    // --- Animation & Stat Calculation ---
    const bodySize = bodyLength * bodyHeight;
    const barrelPower = barrelLength * barrelDiameter;
    
    const recoilAmount = Math.max(0.2, (barrelPower / bodySize) * 2.5);
    const animation = {
        recoil: {
            x: rand(5, 10) * recoilAmount,
            y: rand(-15, -8) * recoilAmount,
            angle: rand(-2.5, -1) * recoilAmount,
        },
        duration: rand(60, 120),
    };

    stats.bulletSpeed = 60 + (barrelLength / 200) * 40;
    stats.fireRate = 500 - (bodyLength / 140) * 400 + rand(0, 50);
    stats.damage = 10 + (barrelPower / 3000) * 5;

    // --- Create Firing Sprite ---
    const firingCanvas = document.createElement('canvas');
    firingCanvas.width = canvas.width;
    firingCanvas.height = canvas.height;
    const firingCtx = firingCanvas.getContext('2d')!;
    firingCtx.imageSmoothingEnabled = false;

    firingCtx.drawImage(canvas, 0, 0);

    const flashSize = 10 + stats.damage * 1.5;
    const flashX = barrel_x1 + barrelDiameter / 2;
    const flashY = barrel_y1;
    firingCtx.fillStyle = `rgba(255, 235, 59, 0.9)`;
    firingCtx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
    firingCtx.lineWidth = 2;

    const spikes = randInt(5, 8);
    const outerRadius = flashSize;
    const innerRadius = flashSize / 2;
    const rot = Math.random() * Math.PI;

    firingCtx.beginPath();
    firingCtx.moveTo(flashX + Math.cos(rot) * outerRadius, flashY + Math.sin(rot) * outerRadius);
    for (let i = 0; i < spikes; i++) {
        let angle = rot + i * 2 * Math.PI / spikes;
        let x = flashX + Math.cos(angle) * outerRadius;
        let y = flashY + Math.sin(angle) * outerRadius;
        firingCtx.lineTo(x, y);
        angle += Math.PI / spikes;
        x = flashX + Math.cos(angle) * innerRadius;
        y = flashY + Math.sin(angle) * innerRadius;
        firingCtx.lineTo(x, y);
    }
    firingCtx.closePath();
    firingCtx.fill();
    firingCtx.stroke();
    
    return { 
        sprite: canvas.toDataURL(), 
        firingSprite: firingCanvas.toDataURL(),
        stats, 
        animation 
    };
}