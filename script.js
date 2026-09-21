// ===== Virtual Office Simulation =====
// OmniTech Engineering Virtual Office
// Avatars, animations, request routing, autonomous work

class VirtualOffice {
    constructor() {
        this.departments = {};
        this.requestQueue = [];
        this.completedTasks = 0;
        this.pendingTasks = 0;
        this.activeDepts = 0;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.setupDepartments();
        this.initAvatars();
        this.setupEventListeners();
        this.startSimulation();
        this.isInitialized = true;
        
        console.log('Virtual Office initialized - OmniTech Engineering');
    }

    setupDepartments() {
        const deptConfigs = {
            planner: {
                name: 'Planning & Strategy',
                color: '#ff9800',
                workTypes: ['strategy', 'planning', 'optimization'],
                workSpeed: 0.015,
                icon: 'fas fa-project-diagram'
            },
            backend: {
                name: 'Backend Engineering',
                color: '#00c8ff',
                workTypes: ['api', 'database', 'server', 'backend'],
                workSpeed: 0.02,
                icon: 'fas fa-server'
            },
            frontend: {
                name: 'Frontend Engineering',
                color: '#00c8ff',
                workTypes: ['ui', 'ux', 'frontend', 'design', 'react', 'dashboard', 'css', 'html', 'javascript', 'angular', 'vue', 'responsive', 'web-app'],
                workSpeed: 0.025,
                icon: 'fas fa-palette'
            },
            structural: {
                name: 'Structural Engineering',
                color: '#4caf50',
                workTypes: ['structural', 'building', 'bridge', 'blueprint'],
                workSpeed: 0.018,
                icon: 'fas fa-drafting-compass'
            },
            electrical: {
                name: 'Electrical Engineering',
                color: '#4caf50',
                workTypes: ['electrical', 'wiring', 'circuit', 'circuits', 'power', 'panel', 'electronics', 'voltage'],
                workSpeed: 0.02,
                icon: 'fas fa-bolt'
            },
            mechanical: {
                name: 'Mechanical Engineering',
                color: '#4caf50',
                workTypes: ['mechanical', 'gear', 'engine', 'machine'],
                workSpeed: 0.018,
                icon: 'fas fa-cog'
            },
            robotics: {
                name: 'Robotics Engineering',
                color: '#4caf50',
                workTypes: ['robot', 'robotics', 'arm', 'automation'],
                workSpeed: 0.015,
                icon: 'fas fa-robot'
            },
            ai: {
                name: 'AI Research',
                color: '#9c64ff',
                workTypes: ['ai', 'ml', 'neural', 'model', 'training', 'ai-model', 'machine-learning', 'deep-learning'],
                workSpeed: 0.012,
                icon: 'fas fa-brain'
            },
            mechatronics: {
                name: 'Mechatronics Engineering',
                color: '#4caf50',
                workTypes: ['mechatronics', 'embedded', 'integration', 'firmware', 'plc', 'actuator'],
                workSpeed: 0.016,
                icon: 'fas fa-cubes'
            }
        };

        Object.entries(deptConfigs).forEach(([id, config]) => {
            this.departments[id] = {
                id,
                name: config.name,
                color: config.color,
                workTypes: config.workTypes,
                workSpeed: config.workSpeed,
                icon: config.icon,
                status: 'idle', // idle, busy, working
                currentTask: 'Idle',
                progress: 0,
                taskTimer: null,
                avatarRenderer: null
            };
        });
    }

    initAvatars() {
        // Create avatar renderers for each department
        const avatarConfigs = {
            planner: this.createPlannerAvatar.bind(this),
            backend: this.createBackendAvatar.bind(this),
            frontend: this.createFrontendAvatar.bind(this),
            structural: this.createStructuralAvatar.bind(this),
            electrical: this.createElectricalAvatar.bind(this),
            mechanical: this.createMechanicalAvatar.bind(this),
            robotics: this.createRoboticsAvatar.bind(this),
            ai: this.createAIAvatar.bind(this),
            mechatronics: this.createMechatronicsAvatar.bind(this)
        };

        Object.entries(avatarConfigs).forEach(([deptId, renderer]) => {
            const canvas = document.getElementById(`avatar${this.capitalize(deptId)}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const rendererInstance = renderer(ctx, canvas.width, canvas.height);
                this.departments[deptId].avatarRenderer = rendererInstance;
            }
        });

        // CEO Avatar
        this.initCEOAvatar();
        
        // Start animation loops
        this.animateAllAvatars();
    }

    initCEOAvatar() {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        canvas.id = 'ceoCanvas';
        
        let angle = 0;
        const animateCEO = () => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw spinning crown
            ctx.save();
            ctx.translate(40, 35);
            ctx.rotate(angle * 0.02);
            ctx.fillStyle = '#00ccff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('♔', 0, 0);
            ctx.restore();
            
            // Draw CEO body
            ctx.fillStyle = '#00aaff';
            ctx.beginPath();
            ctx.arc(35, 55, 8, 0, Math.PI * 2);
            ctx.fill();
            
            angle += 0.5;
            requestAnimationFrame(animateCEO);
        };
        animateCEO();
        
        const ceoIconContainer = document.querySelector('.ceo-icon');
        if (ceoIconContainer) {
            ceoIconContainer.innerHTML = '';
            ceoIconContainer.appendChild(canvas);
        }
    }

    // ===== Avatar Renderers =====
    
    createPlannerAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw clipboard with chart
            ctx.fillStyle = '#d7ccc8';
            ctx.fillRect(20, 10, 60, 80);
            ctx.strokeStyle = '#8d6e68';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 10, 60, 80);
            
            // Clipboard clip
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(40, 85, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(60, 85, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw strategy chart
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const x = 30 + i * 10;
                const y = 25 + Math.sin(t * 0.05 + i) * 5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Draw optimization gears
            ctx.save();
            ctx.translate(70, 35);
            ctx.rotate(t * 0.03);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(0, -8);
                ctx.rotate(Math.PI / 3);
            }
            ctx.stroke();
            ctx.restore();
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createBackendAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw laptop
            ctx.fillStyle = '#2d2d2d';
            ctx.fillRect(25, 30, 60, 40);
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.strokeRect(25, 30, 60, 40);
            
            // Screen
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(28, 33, 54, 32);
            
            // Code lines on screen
            const codeLines = [
                { x: 32, y: 40, len: 40, color: '#4ade80' },
                { x: 32, y: 48, len: 35, color: '#60a5fa' },
                { x: 32, y: 56, len: 45, color: '#fbbf24' },
                { x: 32, y: 64, len: 30, color: '#f87171' }
            ];
            
            codeLines.forEach((line, i) => {
                ctx.fillStyle = line.color;
                ctx.fillRect(line.x + Math.sin(t * 0.1 + i) * 2, line.y, line.len, 2);
            });
            
            // Keyboard
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(25, 70, 60, 8);
            ctx.fillStyle = '#333';
            for (let i = 0; i < 8; i++) {
                ctx.fillRect(27 + i * 7, 72, 5, 4);
            }
            
            // Data flow animation
            ctx.fillStyle = '#00c8ff';
            const dataX = 28 + Math.cos(t * 0.08) * 25;
            const dataY = 35 + Math.sin(t * 0.08) * 14;
            ctx.beginPath();
            ctx.arc(dataX, dataY, 2, 0, Math.PI * 2);
            ctx.fill();
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createFrontendAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw tablet/mobile
            ctx.fillStyle = '#9333ea';
            ctx.fillRect(30, 20, 45, 65);
            ctx.strokeStyle = '#7e22ce';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 20, 45, 65);
            
            // Screen
            ctx.fillStyle = '#1e1e2d';
            ctx.fillRect(33, 24, 39, 56);
            
            // Draw UI elements on screen - animated palette
            const colors = ['#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa'];
            colors.forEach((color, i) => {
                ctx.fillStyle = color;
                const y = 32 + i * 10 + Math.sin(t * 0.1 + i) * 3;
                ctx.beginPath();
                ctx.arc(45, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw a button with hover effect
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(45, 68, 10, 6);
            ctx.fillStyle = '#ffffff';
            ctx.font = '6px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Btn', 50, 73);
            
            // Color brush animation
            ctx.save();
            ctx.translate(55, 55);
            ctx.rotate(Math.sin(t * 0.05) * 0.3);
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(-2, -10, 4, 20);
            ctx.restore();
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createStructuralAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw blueprint
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(15, 10, 70, 80);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(15, 10, 70, 80);
            
            // Draw grid lines on blueprint
            ctx.strokeStyle = '#1e293b';
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(25 + i * 12, 20);
                ctx.lineTo(25 + i * 12, 80);
                ctx.stroke();
            }
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(15, 25 + i * 13);
                ctx.lineTo(85, 25 + i * 13);
                ctx.stroke();
            }
            
            // Draw building structure
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            
            // Building outline
            ctx.beginPath();
            ctx.moveTo(25, 75);
            ctx.lineTo(50, 30);
            ctx.lineTo(75, 75);
            ctx.lineTo(75, 78);
            ctx.lineTo(25, 78);
            ctx.closePath();
            ctx.stroke();
            
            // Building supports
            ctx.beginPath();
            ctx.moveTo(35, 45);
            ctx.lineTo(35, 75);
            ctx.lineTo(65, 75);
            ctx.lineTo(65, 45);
            ctx.stroke();
            
            // Draw a beam being placed
            ctx.fillStyle = '#475569';
            ctx.save();
            ctx.translate(50, 25);
            ctx.rotate(Math.sin(t * 0.05) * 0.1);
            ctx.fillRect(-20, -3, 40, 6);
            ctx.restore();
            
            // Drafting compass animation
            ctx.save();
            ctx.translate(70, 20);
            ctx.rotate(t * 0.02);
            ctx.strokeStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 0);
            ctx.rotate(t * 0.05);
            ctx.moveTo(0, 0);
            ctx.lineTo(8, -8);
            ctx.stroke();
            ctx.restore();
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createElectricalAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw circuit board
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(20, 15, 60, 70);
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 1;
            
            // Circuit paths
            ctx.beginPath();
            ctx.moveTo(25, 25);
            ctx.lineTo(75, 25);
            ctx.lineTo(75, 35);
            ctx.lineTo(45, 35);
            ctx.lineTo(45, 55);
            ctx.lineTo(75, 55);
            ctx.lineTo(75, 65);
            ctx.stroke();
            
            // Circuit traces (animated current)
            const traceCount = 4;
            for (let i = 0; i < traceCount; i++) {
                const phase = (t * 0.1 + i * 1.5);
                const brightness = Math.sin(phase) * 0.5 + 0.5;
                ctx.strokeStyle = `rgba(96, 165, 250, ${brightness})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const startX = 25 + Math.sin(phase) * 3;
                const startY = 30 + i * 10;
                ctx.beginPath();
                ctx.arc(startX, startY, 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Electronic components
            // Resistors (brown)
            ctx.fillStyle = '#78350f';
            ctx.fillRect(30, 40, 12, 5);
            ctx.fillRect(60, 40, 12, 5);
            
            // Capacitors (blue)
            ctx.fillStyle = '#1e40af';
            ctx.fillRect(45, 50, 10, 5);
            
            // LED (pulsing)
            ctx.fillStyle = Math.sin(t * 0.1) > 0 ? '#f59e0b' : '#92400e';
            ctx.beginPath();
            ctx.arc(50, 30, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Wire animation
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const wireX = 40 + Math.cos(t * 0.08) * 10;
            ctx.moveTo(wireX, 60);
            ctx.lineTo(wireX, 68);
            ctx.stroke();
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createMechanicalAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw gears
            const gearCount = 3;
            const gearData = [
                { x: 30, y: 35, r: 12, teeth: 12, speed: 1 },
                { x: 55, y: 45, r: 10, teeth: 10, speed: -1.2 },
                { x: 75, y: 40, r: 8, teeth: 8, speed: 1.5 },
            ];
            
            gearData.forEach((gear, i) => {
                ctx.save();
                ctx.translate(gear.x, gear.y);
                ctx.rotate(t * 0.02 * gear.speed);
                
                // Gear teeth
                ctx.fillStyle = '#94a3b8';
                for (let j = 0; j < gear.teeth; j++) {
                    ctx.save();
                    ctx.rotate((j / gear.teeth) * Math.PI * 2);
                    ctx.beginPath();
                    ctx.moveTo(0, -gear.r - 2);
                    ctx.lineTo(0, -gear.r - 6);
                    ctx.lineTo(0, -gear.r - 8);
                    ctx.arc(0, -gear.r - 7, 1.5, 0, Math.PI);
                    ctx.fill();
                    ctx.restore();
                }
                
                // Gear center
                ctx.fillStyle = '#64748b';
                ctx.beginPath();
                ctx.arc(0, 0, gear.r * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                // Gear inner details
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1;
                for (let j = 0; j < gear.teeth; j++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(gear.r * 0.6, 0);
                    ctx.rotate((j / gear.teeth) * Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            });
            
            // Draw wrench animation
            ctx.save();
            ctx.translate(78, 55);
            ctx.rotate(Math.sin(t * 0.05) * 0.5);
            ctx.fillStyle = '#d4d4d4';
            ctx.fillRect(-3, -10, 6, 20);
            ctx.fillRect(-8, -3, 16, 6);
            ctx.restore();
            
            // Draw machine base
            ctx.fillStyle = '#334155';
            ctx.fillRect(15, 65, 70, 8);
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createRoboticsAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw work surface
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(10, 60, 80, 5);
            
            // Robot arm base
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(50, 58, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Robot arm segments
            const armAngle1 = Math.sin(t * 0.04) * 0.5;
            const armAngle2 = Math.sin(t * 0.03 + 0.5) * 0.8;
            const armAngle3 = Math.sin(t * 0.05 - 0.3) * 1.0;
            
            ctx.save();
            ctx.translate(50, 58);
            
            // Segment 1
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 18);
            ctx.stroke();
            
            // Joint 1
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, 18, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Segment 2
            ctx.translate(0, 18);
            ctx.rotate(armAngle1);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 20);
            ctx.stroke();
            
            // Joint 2
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, 20, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Segment 3
            ctx.translate(0, 20);
            ctx.rotate(armAngle2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 18);
            ctx.stroke();
            
            // Gripper
            ctx.translate(0, 18);
            ctx.rotate(armAngle3);
            const gripperOpen = Math.abs(Math.sin(t * 0.03)) * 4;
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-6, 0, 12, 4);
            ctx.fillRect(-6, 0, 4, 8);
            ctx.fillRect(2, 0, 4, 8);
            
            ctx.restore();
            
            // Robot body
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(35, 30, 30, 28);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(35, 30, 30, 28);
            
            // Robot face
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(42, 40, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(58, 40, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Robot mouth (LED display)
            ctx.fillStyle = '#10b981';
            ctx.fillRect(40, 45, 20, 6);
            ctx.font = '5px Arial';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.fillText('AI', 50, 49);
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createAIAvatar(ctx, w, h) {
        let t = 0;
        const nodeCount = 8;
        const nodes = [];
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: 30 + Math.cos(i / nodeCount * Math.PI * 2) * 25,
                y: 40 + Math.sin(i / nodeCount * Math.PI * 2) * 25,
                delay: i * 0.3
            });
        }
        
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw connections between nodes
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 1;
            nodes.forEach((node, i) => {
                const target = nodes[(i + 1) % nodeCount];
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            });
            
            // Draw data pulses along connections
            nodes.forEach((node, i) => {
                const target = nodes[(i + 1) % nodeCount];
                const progress = (Math.sin(t * 0.05 + node.delay) + 1) / 2;
                const px = node.x + (target.x - node.x) * progress;
                const py = node.y + (target.y - node.y) * progress;
                
                ctx.fillStyle = '#a78bfa';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw neurons/nodes
            nodes.forEach(node => {
                ctx.fillStyle = '#8b5cf6';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Activity pulse
                const pulseSize = 3 + Math.sin(t * 0.05 - node.delay) * 2;
                ctx.strokeStyle = '#c4b5ff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
                ctx.stroke();
            });
            
            // Draw the central processing unit
            ctx.fillStyle = '#1e1b2e';
            ctx.fillRect(25, 48, 50, 25);
            ctx.strokeStyle = '#6d28d9';
            ctx.lineWidth = 2;
            ctx.strokeRect(25, 48, 50, 25);
            
            // CPU activity bars
            const barCount = 6;
            for (let i = 0; i < barCount; i++) {
                const barHeight = Math.abs(Math.sin(t * 0.05 - i * 0.5)) * 18;
                ctx.fillStyle = i % 2 === 0 ? '#8b5cf6' : '#a78bfa';
                ctx.fillRect(28 + i * 7, 60 - barHeight, 5, barHeight);
            }
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    createMechatronicsAvatar(ctx, w, h) {
        let t = 0;
        const render = () => {
            ctx.clearRect(0, 0, w, h);
            
            // Draw combined mechanical + electrical system
            // Base platform
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(15, 70, 70, 5);
            
            // Mechanical arm + sensor
            ctx.save();
            ctx.translate(35, 65);
            
            // Rotating arm
            ctx.rotate(Math.sin(t * 0.04) * 0.5);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-2, -15, 4, 15);
            
            // Joint
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, -15, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Sensor at end
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-5, -22, 10, 8);
            ctx.strokeStyle = '#0ea5e9';
            ctx.strokeRect(-5, -22, 10, 8);
            
            // Sensor light
            ctx.fillStyle = Math.sin(t * 0.1) > 0 ? '#06b6d4' : '#0ea5e9';
            ctx.beginPath();
            ctx.arc(0, -18, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // Circuit traces on base
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(20, 65);
            ctx.lineTo(50, 65);
            ctx.lineTo(50, 70);
            ctx.stroke();
            
            // Data flow dots
            for (let i = 0; i < 5; i++) {
                const progress = (t * 0.05 + i * 0.5) % 3;
                if (progress < 1) {
                    ctx.fillStyle = '#38bdf8';
                    const x = 20 + (progress / 1) * 30;
                    ctx.beginPath();
                    ctx.arc(x, 65, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Microcontroller
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(60, 55, 22, 15);
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 1;
            ctx.strokeRect(60, 55, 22, 15);
            ctx.font = '5px Arial';
            ctx.fillStyle = '#0ea5e9';
            ctx.textAlign = 'center';
            ctx.fillText('MCU', 71, 63);
            
            // Pin dots
            ctx.fillStyle = '#d4d4d4';
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.arc(64 + i % 2 * 16, 58 + Math.floor(i / 2) * 4, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            t += 1;
            requestAnimationFrame(render);
        };
        render();
    }

    animateAllAvatars() {
        // Animation loops are already started within each avatar renderer
        // This method can be used for any global animation coordination
    }

    setupEventListeners() {
        const submitBtn = document.getElementById('submitRequest');
        const requestInput = document.getElementById('requestInput');
        
        submitBtn?.addEventListener('click', () => {
            const request = requestInput?.value.trim();
            if (request) {
                this.submitRequest(request);
                requestInput.value = '';
            }
        });
        
        requestInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const request = e.target.value.trim();
                if (request) {
                    this.submitRequest(request);
                    e.target.value = '';
                }
            }
        });
    }

    submitRequest(requestText) {
        const dept = this.routeRequest(requestText);
        this.showRequestFlow(requestText, dept);
        this.assignTask(dept, requestText);
    }

    routeRequest(requestText) {
        // CEO routes requests based on keyword scoring
        const lowerText = requestText.toLowerCase();
        
        let bestDept = 'planner';
        let bestScore = 0;
        
        const deptPriority = ['ai', 'robotics', 'mechatronics', 'structural', 'electrical',
                              'mechanical', 'backend', 'frontend', 'planner'];
        
        for (const deptId of deptPriority) {
            const dept = this.departments[deptId];
            if (!dept) continue;
            
            let score = 0;
            for (const workType of dept.workTypes) {
                // Split workType into tokens (handle hyphenated terms)
                const tokens = workType.replace(/[-_]/g, ' ').split(' ');
                const matched = tokens.every(token => {
                    // Skip very short tokens
                    if (token.length < 3) return false;
                    // Match with word boundary, allowing optional plural 's'
                    const regex = new RegExp(`\\b${token}s?\\b`, 'i');
                    return regex.test(lowerText);
                });
                if (matched && tokens.length > 0) {
                    score += 2; // Full workType match
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestDept = deptId;
            }
        }
        
        return bestDept;
    }

    showRequestFlow(requestText, dept) {
        const flowContainer = document.getElementById('requestFlow');
        if (!flowContainer) return;
        
        const card = document.createElement('div');
        card.className = 'request-card';
        card.textContent = requestText.substring(0, 60) + '...';
        flowContainer.appendChild(card);
        
        // Animate routing status
        setTimeout(() => {
            card.classList.add('routed');
            card.title = `Routed to: ${this.departments[dept]?.name || 'Planner'}`;
        }, 1000);
        
        setTimeout(() => {
            card.classList.add('processing');
        }, 2000);
        
        setTimeout(() => {
            card.classList.add('completed');
        }, 5000);
        
        setTimeout(() => {
            if (card.parentNode) {
                flowContainer.removeChild(card);
            }
        }, 8000);
    }

    assignTask(deptId, taskText) {
        const dept = this.departments[deptId];
        if (!dept) return;
        
        dept.status = 'busy';
        dept.currentTask = taskText;
        dept.progress = 0;
        
        this.updateDeptUI(deptId);
        this.updateStats();
        
        // Simulate task completion
        const duration = Math.random() * 3000 + 2000;
        const startTime = Date.now();
        
        const taskInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            dept.progress = progress;
            
            this.updateProgress(deptId, progress);
            
            if (progress >= 100) {
                clearInterval(taskInterval);
                dept.status = 'completed';
                dept.currentTask = `Completed: ${taskText.substring(0, 30)}...`;
                dept.progress = 100;
                
                this.completedTasks++;
                this.pendingTasks = Math.max(0, this.pendingTasks - 1);
                
                setTimeout(() => {
                    dept.status = 'idle';
                    dept.currentTask = 'Idle';
                    dept.progress = 0;
                    this.updateProgress(deptId, 0);
                    this.updateDeptUI(deptId);
                    this.updateStats();
                }, 2000);
                
                this.updateStats();
            }
        }, 100);
    }

    updateDeptUI(deptId) {
        const dept = this.departments[deptId];
        const statusEl = document.getElementById(`${deptId}Status`);
        const taskEl = document.getElementById(`${deptId}Task`);
        
        if (statusEl) {
            statusEl.className = 'dept-status-indicator';
            statusEl.classList.add(dept.status);
        }
        
        if (taskEl) {
            taskEl.textContent = dept.currentTask;
            taskEl.className = 'dept-task';
            if (dept.status === 'busy' || dept.status === 'completed') {
                taskEl.classList.add('busy');
            }
        }
    }

    updateProgress(deptId, progress) {
        const progressEl = document.getElementById(`${deptId}Progress`);
        if (progressEl) {
            progressEl.style.width = `${progress}%`;
        }
    }

    updateStats() {
        // Count active (non-idle) departments
        const activeCount = Object.values(this.departments).filter(
            d => d.status !== 'idle'
        ).length;
        const busyCount = Object.values(this.departments).filter(
            d => d.status === 'busy'
        ).length;
        
        const activeEl = document.getElementById('activeDeptsCount');
        const busyEl = document.getElementById('busyDeptsCount');
        const completedEl = document.getElementById('completedTasksCount');
        const pendingEl = document.getElementById('pendingTasksCount');
        
        if (activeEl) activeEl.textContent = `${activeCount}/9 Active`;
        if (busyEl) busyEl.textContent = `${busyCount} Busy`;
        if (completedEl) completedEl.textContent = `${this.completedTasks} Completed`;
        if (pendingEl) pendingEl.textContent = `${this.pendingTasks} Pending`;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    startSimulation() {
        // Simulate autonomous work - each department starts idle
        // The planner periodically distributes tasks
        
        // Start with some initial activity
        setTimeout(() => {
            this.assignTask('backend', 'Building API endpoints for user service');
        }, 500);
        
        setTimeout(() => {
            this.assignTask('ai', 'Training recommendation model v2');
        }, 1000);
        
        setTimeout(() => {
            this.assignTask('mechanical', 'Designing gear assembly for drone');
        }, 3000);
        
        setTimeout(() => {
            this.assignTask('planner', 'Optimizing resource allocation matrix');
        }, 4000);
        
        // Periodic autonomous task generation
        setInterval(() => {
            if (Math.random() > 0.7) {
                const deptIds = Object.keys(this.departments).filter(d => d !== 'planner');
                const randomDept = deptIds[Math.floor(Math.random() * deptIds.length)];
                const tasks = [
                    'Analyzing system performance metrics',
                    'Running diagnostics on subsystem',
                    'Processing data pipeline jobs',
                    'Compiling and deploying code',
                    'Running simulation tests'
                ];
                const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
                this.assignTask(randomDept, randomTask);
            }
        }, 8000);
        
        // Planner optimization cycle
        setInterval(() => {
            if (Math.random() > 0.5) {
                this.assignTask('planner', 'Running weekly resource optimization');
            }
        }, 15000);
        
        // Update stats periodically
        setInterval(() => {
            this.updateStats();
        }, 1000);
    }
}

// ===== Initialize when DOM is loaded =====
document.addEventListener('DOMContentLoaded', () => {
    const office = new VirtualOffice();
    
    // Simulate request routing demo
    setTimeout(() => {
        office.submitRequest('Build a React dashboard for the AI model metrics');
    }, 6000);
    
    setTimeout(() => {
        office.submitRequest('Design structural supports for rooftop installation');
    }, 12000);
    
    setTimeout(() => {
        office.submitRequest('Optimize neural network inference pipeline');
    }, 18000);
});
