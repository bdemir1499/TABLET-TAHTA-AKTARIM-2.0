const THREE = require('three');

function testPyramid(sides, r, height) {
    const apothem = r * Math.cos(Math.PI / sides);
    const sideWidth = 2 * r * Math.sin(Math.PI / sides);
    const slantHeight = Math.sqrt(height * height + apothem * apothem);
    const inwardAngle = Math.atan2(apothem, height);
    
    for (let i = 0; i < sides; i++) {
        const angle = (i * Math.PI * 2) / sides;
        const hinge = new THREE.Group();
        hinge.position.set(
            Math.cos(angle) * apothem,
            -height / 2,
            -Math.sin(angle) * apothem
        );
        hinge.rotation.y = angle + Math.PI / 2;
        
        // Apex local pos
        const apex = new THREE.Vector3(0, slantHeight, 0);
        
        // Apply hinge rotation X
        apex.applyAxisAngle(new THREE.Vector3(1, 0, 0), -inwardAngle);
        
        // Apply hinge rotation Y
        apex.applyAxisAngle(new THREE.Vector3(0, 1, 0), hinge.rotation.y);
        
        // Add hinge pos
        apex.add(hinge.position);
        
        console.log(`Face ${i+1} apex:`, apex);
    }
}

testPyramid(4, 10, 20);
