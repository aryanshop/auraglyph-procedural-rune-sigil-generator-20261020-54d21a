document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sigil-canvas');
    const ctx = canvas.getContext('2d');
    
    // Inputs
    const intentInput = document.getElementById('intent-input');
    const seedInput = document.getElementById('seed-input');
    const symmetrySelect = document.getElementById('symmetry-select');
    const gridSizeRange = document.getElementById('grid-size');
    const gridSizeVal = document.getElementById('grid-size-val');
    const toggleNodes = document.getElementById('toggle-nodes');
    const toggleCircles = document.getElementById('toggle-circles');
    const toggleRunes = document.getElementById('toggle-runes');
    const toggleOuter = document.getElementById('toggle-outer');
    const styleTheme = document.getElementById('style-theme');
    const lineWidthRange = document.getElementById('line-width');
    
    // Buttons
    const btnRegenerate = document.getElementById('btn-regenerate');
    const btnExportSvg = document.getElementById('btn-export-svg');
    const btnExportPng = document.getElementById('btn-export-png');
    const canvasLoading = document.getElementById('canvas-loading');

    // Meta Displays
    const metaSum = document.getElementById('meta-sum');
    const metaComplexity = document.getElementById('meta-complexity');
    const metaArchetype = document.getElementById('meta-archetype');

    // Theme configurations
    const themes = {
        gold: { primary: '#d4af37', secondary: '#f3e5ab', glow: 'rgba(212, 175, 55, 0.4)', bg: '#0c0d12' },
        silver: { primary: '#c0c0c0', secondary: '#e8e8e8', glow: 'rgba(192, 192, 192, 0.4)', bg: '#0c0d12' },
        emerald: { primary: '#2ecc71', secondary: '#a9dfbf', glow: 'rgba(46, 204, 113, 0.4)', bg: '#0c0d12' },
        obsidian: { primary: '#00ffff', secondary: '#80ffff', glow: 'rgba(0, 255, 255, 0.4)', bg: '#0c0d12' },
        crimson: { primary: '#e74c3c', secondary: '#f1948a', glow: 'rgba(231, 76, 60, 0.4)', bg: '#0c0d12' }
    };

    // Seeded random number generator
    class PseudoRandom {
        constructor(seed) {
            this.seed = seed;
        }
        next() {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            return this.seed / 233280;
        }
    }

    function computeChecksum(str) {
        let sum = 0;
        const clean = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length === 0) return 42;
        for (let i = 0; i < clean.length; i++) {
            sum += clean.charCodeAt(i) - 64;
        }
        return sum;
    }

    function getArchetype(sum) {
        const archetypes = [
            "Harmonic Weaver", "Celestial Sentinel", "Prismatic Catalyst", 
            "Infinite Conduit", "Ethereal Architect", "Vortex Seer", 
            "Astral Alchemist", "Silent Glyph", "Solar Monarch"
        ];
        return archetypes[sum % archetypes.length];
    }

    function drawSigil() {
        canvasLoading.classList.add('visible');

        setTimeout(() => {
            const intent = intentInput.value || 'AURA';
            const userSeed = parseInt(seedInput.value) || 42;
            const textSum = computeChecksum(intent);
            const combinedSeed = textSum * userSeed;
            const rng = new PseudoRandom(combinedSeed);

            const symmetry = symmetrySelect.value;
            const gridSize = parseInt(gridSizeRange.value);
            gridSizeVal.textContent = `${gridSize}x${gridSize}`;
            
            const showNodes = toggleNodes.checked;
            const showCircles = toggleCircles.checked;
            const showRunes = toggleRunes.checked;
            const showOuter = toggleOuter.checked;
            const themeKey = styleTheme.value;
            const theme = themes[themeKey] || themes.gold;
            const lineWidth = parseFloat(lineWidthRange.value);

            // Update UI metadata
            metaSum.textContent = textSum;
            const complexityVal = Math.min(99, Math.floor((gridSize * 7) + (textSum % 30) + (showRunes ? 15 : 0)));
            metaComplexity.textContent = complexityVal + '%';
            metaArchetype.textContent = getArchetype(textSum);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const maxRadius = canvas.width * 0.42;

            ctx.shadowColor = theme.glow;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = theme.primary;
            ctx.fillStyle = theme.primary;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // 1. Outer Protective Rings
            if (showOuter) {
                ctx.beginPath();
                ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cx, cy, maxRadius * 0.92, 0, Math.PI * 2);
                ctx.lineWidth = lineWidth * 0.5;
                ctx.setLineDash([4, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineWidth = lineWidth;

                // Outer glyph ticks
                const tickCount = 12;
                for (let i = 0; i < tickCount; i++) {
                    const angle = (i / tickCount) * Math.PI * 2;
                    const x1 = cx + Math.cos(angle) * maxRadius;
                    const y1 = cy + Math.sin(angle) * maxRadius;
                    const x2 = cx + Math.cos(angle) * (maxRadius * 0.95);
                    const y2 = cy + Math.sin(angle) * (maxRadius * 0.95);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }

            // 2. Orbital Circles
            if (showCircles) {
                const ringCount = 3;
                for (let i = 1; i <= ringCount; i++) {
                    const r = (maxRadius * 0.75) * (i / ringCount);
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.strokeStyle = i % 2 === 0 ? theme.secondary : theme.primary;
                    ctx.lineWidth = lineWidth * 0.7;
                    ctx.stroke();
                }
                ctx.strokeStyle = theme.primary;
                ctx.lineWidth = lineWidth;
            }

            // 3. Grid & Node connections (Sigil Core)
            const step = (maxRadius * 1.2) / gridSize;
            const halfGridSpan = (gridSize * step) / 2;
            const points = [];

            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const px = cx - halfGridSpan + (c * step) + (step / 2);
                    const py = cy - halfGridSpan + (r * step) + (step / 2);
                    points.push({ x: px, y: py, active: rng.next() > 0.4 });
                }
            }

            // Draw nodes
            if (showNodes) {
                points.forEach(p => {
                    if (p.active) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                        ctx.fillStyle = theme.secondary;
                        ctx.fill();
                    }
                });
            }

            // Generate path based on text characters
            const activePoints = points.filter(p => p.active);
            if (activePoints.length > 1) {
                const pathSegments = Math.min(activePoints.length, intent.length * 2);
                
                let drawSymmetricPath = (angleOffset) => {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angleOffset);
                    ctx.translate(-cx, -cy);

                    ctx.beginPath();
                    let startIdx = Math.floor(rng.next() * activePoints.length);
                    let current = activePoints[startIdx];
                    ctx.moveTo(current.x, current.y);

                    for (let i = 0; i < pathSegments; i++) {
                        let nextIdx = Math.floor(rng.next() * activePoints.length);
                        let nextPt = activePoints[nextIdx];
                        
                        // Add elegant bezier curves
                        let cpX = (current.x + nextPt.x) / 2 + (rng.next() - 0.5) * 40;
                        let cpY = (current.y + nextPt.y) / 2 + (rng.next() - 0.5) * 40;
                        ctx.quadraticCurveTo(cpX, cpY, nextPt.x, nextPt.y);
                        current = nextPt;
                    }
                    ctx.stroke();
                    ctx.restore();
                };

                // Apply Symmetry rules
                if (symmetry === 'radial4') {
                    for (let a = 0; a < 4; a++) {
                        drawSymmetricPath((a * Math.PI) / 2);
                    }
                } else if (symmetry === 'radial6') {
                    for (let a = 0; a < 6; a++) {
                        drawSymmetricPath((a * Math.PI) / 3);
                    }
                } else if (symmetry === 'radial8') {
                    for (let a = 0; a < 8; a++) {
                        drawSymmetricPath((a * Math.PI) / 4);
                    }
                } else if (symmetry === 'axial') {
                    drawSymmetricPath(0);
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.translate(-canvas.width, 0);
                    // Redraw mirrored
                    drawSymmetricPath(0);
                    ctx.restore();
                } else {
                    drawSymmetricPath(0);
                }
            }

            // 4. Decorative Runes / Glyphs on outer ring
            if (showRunes && showOuter) {
                const runeCount = 8;
                for (let i = 0; i < runeCount; i++) {
                    const angle = (i / runeCount) * Math.PI * 2 + (Math.PI / runeCount);
                    const rx = cx + Math.cos(angle) * (maxRadius * 0.84);
                    const ry = cy + Math.sin(angle) * (maxRadius * 0.84);
                    
                    ctx.save();
                    ctx.translate(rx, ry);
                    ctx.rotate(angle + Math.PI / 2);
                    ctx.beginPath();
                    ctx.moveTo(-4, -6);
                    ctx.lineTo(4, 0);
                    ctx.lineTo(-4, 6);
                    ctx.lineWidth = lineWidth * 0.8;
                    ctx.strokeStyle = theme.secondary;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            canvasLoading.classList.remove('visible');
        }, 50);
    }

    // Event Listeners for live updates
    const inputsToWatch = [intentInput, seedInput, symmetrySelect, gridSizeRange, toggleNodes, toggleCircles, toggleRunes, toggleOuter, styleTheme, lineWidthRange];
    inputsToWatch.forEach(input => {
        input.addEventListener('input', drawSigil);
        input.addEventListener('change', drawSigil);
    });

    btnRegenerate.addEventListener('click', () => {
        seedInput.value = Math.floor(Math.random() * 9999) + 1;
        drawSigil();
    });

    btnExportPng.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `${(intentInput.value || 'sigil').toLowerCase().replace(/\s+/g, '-')}-auraglyph.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    btnExportSvg.addEventListener('click', () => {
        // Generate clean simulated SVG wrapper for download
        const intent = intentInput.value || 'AURA';
        const theme = themes[styleTheme.value] || themes.gold;
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="100%" height="100%" fill="${theme.bg}"/>
    <circle cx="300" cy="300" r="252" fill="none" stroke="${theme.primary}" stroke-width="${lineWidthRange.value}"/>
    <circle cx="300" cy="300" r="230" fill="none" stroke="${theme.secondary}" stroke-width="1" stroke-dasharray="4,6"/>
    <text x="300" y="580" fill="${theme.primary}" font-family="monospace" font-size="14" text-anchor="middle" letter-spacing="4">INTENT: ${intent.toUpperCase()}</text>
    <!-- Generated via AuraGlyph -->
</svg>`;
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `${intent.toLowerCase().replace(/\s+/g, '-')}-auraglyph.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
    });

    // Initial draw
    drawSigil();
});
