// 3D Şekillerin Açınım (Katlama) Mantığı İçin Ek Modül
window.Foldable3D = {
    createFoldableGroup: function(type, size, mainMaterial, edgeMaterial) {
        if (type === 'sphere') return null; // Küre için açınım hesaplanmaz, normal çizim için null dönüyoruz

        const group = new THREE.Group();
        group.userData.isFoldable = true;
        group.userData.shapeType = type;
        group.userData.baseSize = size;
        group.userData.hinges = []; // Katlanacak parçaların listesi

        // Özel mesh oluşturucu (edge çizgileriyle birlikte)
        const createFaceMesh = (geometry) => {
            const mesh = new THREE.Mesh(geometry, mainMaterial);
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
            return mesh;
        };

        const createLabelMesh = (text, color, w, h) => {
            return new THREE.Group(); // İsteğiniz üzerine etiketler kaldırıldı
        };

        let faceCounter = 1;

        const height = size * 2;
        
        // SİLİNDİR VE PRİZMALAR (Yan yüzeyler rulo gibi açılır)
        if (type.startsWith('prism_')) {
            let sides = 4;
            let heights = size * 2;
            let widths = [];
            let apothems = [];
            let isCustom = false;
            
            if (type === 'prism_cube') { 
                sides = 4; heights = size * 2; isCustom = true;
                const W = size * 2;
                widths = [W, W, W, W];
                apothems = [W/2, W/2, W/2, W/2];
            } else if (type === 'prism_square') { 
                sides = 4; heights = size * 3; isCustom = true;
                const W = size * 1.5; // Taban kare
                widths = [W, W, W, W];
                apothems = [W/2, W/2, W/2, W/2];
            } else if (type === 'prism_rect') { 
                sides = 4; heights = size * 2.2; isCustom = true;
                const W = size * 3; // Uzun kenar (Front/Back)
                const D = size * 1.5; // Kısa kenar (Left/Right)
                widths = [W, D, W, D];
                apothems = [D/2, W/2, D/2, W/2];
            } else {
                let r = size;
                if (type === 'prism_3') sides = 3;
                if (type === 'prism_5') sides = 5;
                if (type === 'prism_6') sides = 6;
                if (type === 'prism_cylinder') sides = 32;

                const sideWidth = 2 * r * Math.sin(Math.PI / sides);
                const apothem = r * Math.cos(Math.PI / sides);
                for(let i=0; i<sides; i++) { widths.push(sideWidth); apothems.push(apothem); }
            }

            const angleStep = (Math.PI * 2) / sides;
            const root = new THREE.Group();
            group.add(root);
            
            let currentParent = root;

            for (let i = 0; i < sides; i++) {
                const hinge = new THREE.Group();
                const actualSideWidth = widths[i];

                if (i === 0) {
                    hinge.position.set(-actualSideWidth / 2, 0, apothems[i]); 
                    hinge.rotation.y = 0; 
                    root.add(hinge);
                } else {
                    hinge.position.set(widths[i-1], 0, 0); 
                    currentParent.add(hinge);
                    group.userData.hinges.push({ obj: hinge, maxAngle: 0, initialAngle: -angleStep, axis: 'y' });
                }
                
                const panelGeo = new THREE.PlaneGeometry(actualSideWidth, heights);
                panelGeo.translate(actualSideWidth / 2, 0, 0); 
                const panelMesh = createFaceMesh(panelGeo);
                hinge.add(panelMesh);
                
                const label = createLabelMesh(faceCounter.toString(), '#ffaaaa', actualSideWidth, Math.min(heights, actualSideWidth));
                label.position.set(actualSideWidth / 2, 0, 0);
                hinge.add(label);
                faceCounter++;

                currentParent = hinge;

                let attachIndex = isCustom ? 0 : Math.floor((sides - 1) / 2);
                if (i === attachIndex) {
                    // Üst kapak
                    const topHinge = new THREE.Group();
                    topHinge.position.set(actualSideWidth / 2, heights / 2, 0);
                    hinge.add(topHinge);
                    
                    let topGeo;
                    if (isCustom) {
                        const capW = widths[0]; // Front genişliği W
                        const capH = widths[1]; // Yan genişlik D
                        topGeo = new THREE.PlaneGeometry(capW, capH);
                        topGeo.translate(0, -capH / 2, 0); // Pivot'u alt kenara al
                        topGeo.rotateX(-Math.PI / 2); // Yukarıya doğru (Z eksenine) katla
                    } else {
                        let r = size;
                        if (type === 'prism_cylinder') {
                            topGeo = new THREE.CircleGeometry(r, sides);
                        } else {
                            topGeo = new THREE.CircleGeometry(r, sides, 0); 
                            topGeo.rotateZ(-Math.PI / 2 - Math.PI / sides); 
                        }
                        topGeo.rotateZ(Math.PI); 
                        topGeo.translate(0, -apothems[i], 0); 
                        topGeo.rotateX(-Math.PI / 2); 
                    }
                    const topMesh = createFaceMesh(topGeo);
                    topHinge.add(topMesh);
                    group.userData.hinges.push({ obj: topHinge, maxAngle: -Math.PI / 2, initialAngle: 0, axis: 'x' }); 
                    
                    const topLabel = createLabelMesh(faceCounter.toString() + " (ÜST)", '#aaffaa', size*1.5, size*1.5);
                    topLabel.rotation.x = Math.PI / 2; 
                    topLabel.position.set(0, 0, 0);
                    topHinge.add(topLabel);
                    faceCounter++;

                    // Alt kapak
                    const bottomHinge = new THREE.Group();
                    bottomHinge.position.set(actualSideWidth / 2, -heights / 2, 0);
                    hinge.add(bottomHinge);
                    
                    let bottomGeo;
                    if (isCustom) {
                        const capW = widths[0]; // W
                        const capH = widths[1]; // D
                        bottomGeo = new THREE.PlaneGeometry(capW, capH);
                        bottomGeo.translate(0, capH / 2, 0); 
                        bottomGeo.rotateX(Math.PI / 2);
                    } else {
                        let r = size;
                        if (type === 'prism_cylinder') {
                            bottomGeo = new THREE.CircleGeometry(r, sides);
                        } else {
                            bottomGeo = new THREE.CircleGeometry(r, sides, 0);
                            bottomGeo.rotateZ(Math.PI / 2 - Math.PI / sides); 
                        }
                        bottomGeo.rotateZ(Math.PI); 
                        bottomGeo.translate(0, apothems[i], 0); 
                        bottomGeo.rotateX(Math.PI / 2); 
                    }
                    const bottomMesh = createFaceMesh(bottomGeo);
                    bottomHinge.add(bottomMesh);
                    group.userData.hinges.push({ obj: bottomHinge, maxAngle: Math.PI / 2, initialAngle: 0, axis: 'x' }); 

                    const bottomLabel = createLabelMesh(faceCounter.toString() + " (ALT)", '#aaaaff', size*1.5, size*1.5);
                    bottomLabel.rotation.x = -Math.PI / 2; 
                    bottomLabel.rotation.y = Math.PI; 
                    bottomLabel.position.set(0, 0, 0);
                    bottomHinge.add(bottomLabel);
                    faceCounter++;
                }
            }
            
            // Açıldığında ne kadar kaydırılacak?
            let totalWidth = widths.reduce((a, b) => a + b, 0);
            group.userData.shiftX = -totalWidth / 2 + widths[0]/2;
        } 
        // PİRAMİTLER (Yaprak gibi dışa doğru açılır)
        else if (type.startsWith('pyramid_')) {
            let sides = 4;
            if (type === 'pyramid_3') sides = 3;
            if (type === 'pyramid_4') sides = 4;
            if (type === 'pyramid_5') sides = 5;
            if (type === 'pyramid_6') sides = 6;
            
            const r = size;
            const apothem = r * Math.cos(Math.PI / sides);
            const sideWidth = 2 * r * Math.sin(Math.PI / sides);
            const slantHeight = Math.sqrt(height * height + apothem * apothem);
            const inwardAngle = Math.atan2(apothem, height); // İçeri doğru eğim açısı

            // Taban
            const baseGeo = new THREE.CircleGeometry(r, sides, Math.PI / sides);
            baseGeo.rotateX(-Math.PI / 2);
            const baseMesh = createFaceMesh(baseGeo);
            baseMesh.position.y = -height / 2;
            group.add(baseMesh);

            const baseLabel = createLabelMesh(faceCounter.toString() + " (ALT)", '#aaaaff', r*1.5, r*1.5);
            baseLabel.rotation.x = -Math.PI / 2;
            baseLabel.position.y = -height / 2;
            group.add(baseLabel);
            faceCounter++;

            // Yan üçgenler
            for (let i = 0; i < sides; i++) {
                const angle = (i * Math.PI * 2) / sides;
                const hinge = new THREE.Group();
                
                // Menteşeyi taban kenarına yerleştir
                hinge.position.set(
                    Math.cos(angle) * apothem,
                    -height / 2,
                    -Math.sin(angle) * apothem
                );
                // Kenara dik bakması için y ekseni etrafında döndür (+90 derece ile local Z içeri bakar)
                hinge.rotation.order = 'YXZ'; // Önce X (içeri eğilme), sonra Y (yönelme) uygulanmalı
                hinge.rotation.y = angle + Math.PI / 2;
                
                const triGeo = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    -sideWidth / 2, 0, 0,
                    sideWidth / 2, 0, 0,
                    0, slantHeight, 0
                ]);
                triGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                triGeo.computeVertexNormals();
                
                const triMesh = createFaceMesh(triGeo);
                hinge.add(triMesh);
                group.add(hinge);
                
                const triLabel = createLabelMesh(faceCounter.toString(), '#ffaaaa', sideWidth, slantHeight*0.5);
                triLabel.position.set(0, slantHeight*0.3, 0);
                
                hinge.add(triLabel);
                faceCounter++;
                
                // Başlangıç (0) -> Kapalı (içeri eğik), Bitiş (1) -> Açık (dışarı yatay)
                group.userData.hinges.push({ obj: hinge, maxAngle: Math.PI / 2, initialAngle: -inwardAngle, axis: 'x' });
            }
        }
        // KONİ (Daire dilimi şeklinde açılır)
        else if (type === 'pyramid_cone') {
            const r = size;
            const l = Math.sqrt(r * r + height * height); // Ana doğru
            
            const sides = 32;
            const apothem = r;
            const sideWidth = 2 * Math.PI * r / sides;
            const slantHeight = l;
            const inwardAngle = Math.atan2(apothem, height);

            // Taban (Sabit değil, açıldığında yana kayacak)
            const baseHinge = new THREE.Group();
            baseHinge.position.y = -height / 2;
            group.add(baseHinge);
            const baseGeo = new THREE.CircleGeometry(r, 32);
            baseGeo.rotateX(-Math.PI / 2);
            const baseMesh = createFaceMesh(baseGeo);
            baseHinge.add(baseMesh);

            const baseLabel = createLabelMesh(faceCounter.toString() + " (ALT)", '#aaaaff', r*1.5, r*1.5);
            baseLabel.rotation.x = -Math.PI / 2;
            baseHinge.add(baseLabel);
            faceCounter++;

            // Yan yüzeyler (çiçek gibi açılır)
            for (let i = 0; i < sides; i++) {
                const angle = (i * Math.PI * 2) / sides;
                const hinge = new THREE.Group();
                hinge.position.set(Math.cos(angle) * apothem, -height / 2, -Math.sin(angle) * apothem);
                hinge.rotation.order = 'YXZ'; // Önce X (içeri eğilme), sonra Y (yönelme) uygulanmalı
                hinge.rotation.y = angle + Math.PI / 2; // İçeri bakması için yönlendirme
                
                const triGeo = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    -sideWidth / 2, 0, 0,
                    sideWidth / 2, 0, 0,
                    0, slantHeight, 0
                ]);
                triGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                triGeo.computeVertexNormals();
                
                const triMesh = createFaceMesh(triGeo);
                hinge.add(triMesh);
                group.add(hinge);
                
                // Başlangıç (0) -> Kapalı (içeri eğik), Bitiş (1) -> Açık (dışarı yatay)
                group.userData.hinges.push({ obj: hinge, maxAngle: Math.PI / 2, initialAngle: -inwardAngle, axis: 'x' });
            }
        }

        // Şekil kapalıyken Z ekseni boyunca uzansın (böylece XY düzleminde dik durur)
        group.rotation.x = Math.PI / 2;

        const outerGroup = new THREE.Group();
        outerGroup.userData = group.userData;
        outerGroup.userData.innerGroup = group; // İç grubu sakla ki rotasyonu nötrleyebilelim
        if (type.startsWith('prism_')) {
            outerGroup.userData.shiftX = group.userData.shiftX;
        }
        outerGroup.add(group);

        return outerGroup;
    },

    updateUnfold: function(group, openRatio) {
        if (!group.userData.isFoldable || !group.userData.hinges) return;
        
        group.userData.hinges.forEach(h => {
            const initial = h.initialAngle || 0;
            const currentAngle = initial + (h.maxAngle - initial) * openRatio;
            h.obj.rotation[h.axis] = currentAngle;
        });

        // Şekil açıldıkça tam karşıdan görünmesi için rotasyonu otomatik olarak düzelt
        const inner = group.userData.innerGroup;
        if (inner) {
            // Perspektif yanılgısını (kameranın aşağıdan bakması) önlemek için prizmalarda şekli hafif geriye (yukarı) yatırıyoruz: 0.25 radyan
            // Ancak piramitlerin tam karşıdan görünmesi istendiği için onlarda bu eğimi sıfırlıyoruz.
            let tiltOffset = 0.25; 
            if (group.userData.shapeType && group.userData.shapeType.startsWith('pyramid_')) {
                tiltOffset = 0;
            }

            // Her iki şekil türü de Y ekseninde inşa edilip X ekseninde 90 derece döndürülerek dik hale getirilir.
            const qClosed = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            
            // Açıldığında tam karşıdan (ve hafif yukarıdan) görünmesi için mutlak hedef rotasyon
            const qOpenAbsolute = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 - tiltOffset);
            
            // Dış grubun dinamik rotasyonunu değil, sadece başlangıçtaki varsayılan rotasyonunu ters çeviriyoruz.
            // Böylece açıldığında "tam karşıdan" görünmesini sağlıyoruz ancak kullanıcının kendi yaptığı döndürmeleri SİLMİYORUZ.
            // Prizmalar ve Piramitler başlangıçta Z ekseninde -30 derece (-Math.PI / 6) dönük olarak ekleniyor.
            const defaultOuterQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 6));
            const qOuterInverse = defaultOuterQ.invert();
            const qOpenTarget = qOuterInverse.multiply(qOpenAbsolute);
            
            // Kapalıyken izometrik duruşta kal, açıldıkça kameraya dön
            inner.quaternion.copy(qClosed).slerp(qOpenTarget, openRatio);

            // Prizmaların açınımı yana doğru uzadığı için, açıldıkça şekli ortala
            if (group.userData.shiftX) {
                inner.position.x = group.userData.shiftX * openRatio;
            }
        }
    }
};
