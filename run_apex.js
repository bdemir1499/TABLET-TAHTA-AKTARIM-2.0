const fs = require('fs');
let log = "";
const r = 10;
const height = 20;
const sides = 4;
const apothem = r * Math.cos(Math.PI / sides);
const sideWidth = 2 * r * Math.sin(Math.PI / sides);
const slantHeight = Math.sqrt(height * height + apothem * apothem);
const inwardAngle = Math.atan2(apothem, height);

for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides;
    
    // Hinge Position
    let hx = Math.cos(angle) * apothem;
    let hy = -height / 2;
    let hz = -Math.sin(angle) * apothem;
    
    // Hinge Rotation Y
    let ry = angle + Math.PI / 2;
    
    // Face apex in local coords
    let fx = 0;
    let fy = slantHeight;
    let fz = 0;
    
    // Apply inward angle (rotation around X)
    let y1 = fy * Math.cos(-inwardAngle) - fz * Math.sin(-inwardAngle);
    let z1 = fy * Math.sin(-inwardAngle) + fz * Math.cos(-inwardAngle);
    
    // Apply hinge rotation Y
    let x2 = fx * Math.cos(ry) + z1 * Math.sin(ry);
    let y2 = y1;
    let z2 = -fx * Math.sin(ry) + z1 * Math.cos(ry);
    
    // Add hinge pos
    let finalX = x2 + hx;
    let finalY = y2 + hy;
    let finalZ = z2 + hz;
    
    log += `Face ${i}: Apex = (${finalX.toFixed(2)}, ${finalY.toFixed(2)}, ${finalZ.toFixed(2)})\n`;
}

fs.writeFileSync('apex_test.txt', log);
