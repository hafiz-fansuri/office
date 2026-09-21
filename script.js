// ===== Virtual Office Simulation =====
// OmniTech Engineering Virtual Office
// Professional Dashboard Design System

class VirtualOffice {
    constructor() {
        this.departments = {};
        this.requestQueue = [];
        this.completedTasks = 0;
        this.pendingTasks = 0;
        this.activeDepts = 0;
        this.isInitialized = false;
        this.avatarAnimations = {};

        // ─── AI Backend Integration ───
        this.backendUrl = document.querySelector('meta[name="backend-url"]')?.content || 'http://localhost:8000';
        this.ws = null;
        this.wsConnected = false;
        this.pendingRequests = new Map();        // request_id → task text
        this.requestCards = new Map();            // request_id → DOM card element
        this.deptActiveTasks = new Map();         // deptId → { request_id, task }
        this.aiResults = new Map();               // deptId → AI result text

        this.init();
    }

    init() {
        this.setupDepartments();
        this.initAvatars();
        this.setupEventListeners();
        this.initFloorGrid();
        this.initBackend();
        this.startSimulation();
        this.isInitialized = true;
        console.log('[Virtual Office] OmniTech Engineering — System Initialized');
    }

    /* ===== AI BACKEND INTEGRATION ===== */

    initBackend() {
        const wsUrl = this.backendUrl.replace(/^http/, 'ws');
        console.log(`[Backend] Connecting to ${wsUrl}/ws`);

        this.ws = new WebSocket(`${wsUrl}/ws`);

        this.ws.onopen = () => {
            this.wsConnected = true;
            console.log('[Backend] WebSocket connected');
            this.updateBackendStatus(true);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleBackendEvent(data);
            } catch (e) {
                console.error('[Backend] Failed to parse event:', e);
            }
        };

        this.ws.onclose = () => {
            this.wsConnected = false;
            console.log('[Backend] WebSocket disconnected');
            this.updateBackendStatus(false);
            // Reconnect after 3 seconds
            setTimeout(() => this.initBackend(), 3000);
        };

        this.ws.onerror = (err) => {
            console.error('[Backend] WebSocket error:', err);
        };
    }

    updateBackendStatus(connected) {
        const indicator = document.getElementById('backendStatus');
        if (indicator) {
            indicator.textContent = connected ? 'Backend Connected' : 'Backend Disconnected';
            indicator.style.color = connected ? '#4ade80' : '#f97316';
        }
    }

    async handleBackendEvent(event) {
        const { type, request_id, department, task, result, error, priority, model, provider } = event;

        switch (type) {
            case 'request_received':
                this.onBackendRequestReceived(event);
                break;
            case 'task_routed':
                this.onBackendTaskRouted(event);
                break;
            case 'task_status':
                this.onBackendTaskStatus(event);
                break;
            case 'task_completed':
                this.onBackendTaskCompleted(event);
                break;
            case 'task_error':
                this.onBackendTaskError(event);
                break;
        }
    }

    onBackendRequestReceived(event) {
        const card = this.requestCards.get(event.request_id);
        if (card) {
            card.classList.add('processing');
            card.querySelector('.request-status').textContent = 'Routing to department...';
        }
    }

    onBackendTaskRouted(event) {
        const { request_id, department, task, priority, model, provider } = event;
        this.deptActiveTasks.set(department, { request_id, task });

        const dept = this.departments[department];
        if (dept) {
            dept.status = 'busy';
            dept.currentTask = task || 'Processing with AI...';
            this.updateDeptUI(department);
            this.updateStats();
        }

        const card = this.requestCards.get(request_id);
        if (card) {
            card.classList.add('processing');
            const statusEl = card.querySelector('.request-status');
            if (statusEl) statusEl.textContent = `Routed to ${dept?.name || department}`;

            const modelBadge = card.querySelector('.request-model-badge');
            if (modelBadge) {
                modelBadge.textContent = `${provider}/${model}`;
            }
        }
    }

    onBackendTaskStatus(event) {
        const { request_id, department, status } = event;
        const dept = this.departments[department];
        if (dept && status === 'processing') {
            dept.status = 'busy';
            dept.currentTask = 'AI processing...';
            this.updateDeptUI(department);
        }
    }

    onBackendTaskCompleted(event) {
        const { request_id, department, task, result } = event;

        const dept = this.departments[department];
        if (dept) {
            dept.status = 'completed';
            dept.currentTask = 'Completed!';
            this.completedTasks++;
            this.pendingTasks = Math.max(0, this.pendingTasks - 1);
            this.updateDeptUI(department);
            this.updateStats();

            // Display AI result on the department card
            this.displayAIResult(department, result);
        }

        // Update request flow card
        const card = this.requestCards.get(request_id);
        if (card) {
            card.classList.remove('processing');
            card.classList.add('completed');
            const statusEl = card.querySelector('.request-status');
            if (statusEl) statusEl.textContent = 'Completed';
            card.classList.add('result-visible');
        }

        // Clean up
        this.deptActiveTasks.delete(department);
        this.pendingRequests.delete(request_id);

        // Reset department to idle after a delay
        setTimeout(() => {
            if (dept && dept.status === 'completed') {
                dept.status = 'idle';
                dept.currentTask = 'Idle';
                dept.progress = 0;
                this.updateDeptUI(department);
                this.updateStats();
                this.hideAIResult(department);
            }
        }, 8000);
    }

    onBackendTaskError(event) {
        const { request_id, department, error } = event;

        const dept = this.departments[department];
        if (dept) {
            dept.status = 'idle';
            dept.currentTask = 'Error (see log)';
            this.pendingTasks = Math.max(0, this.pendingTasks - 1);
            this.updateDeptUI(department);
            this.updateStats();
        }

        const card = this.requestCards.get(request_id);
        if (card) {
            card.classList.remove('processing');
            const statusEl = card.querySelector('.request-status');
            if (statusEl) statusEl.textContent = `Error: ${error || 'Unknown error'}`;
        }

        this.deptActiveTasks.delete(department);
        this.pendingRequests.delete(request_id);
    }

    displayAIResult(deptId, result) {
        let resultEl = document.getElementById(`${deptId}Result`);
        if (!resultEl) {
            const taskInfo = document.querySelector(`[data-dept="${deptId}"] .dept-task-info`);
            if (taskInfo) {
                resultEl = document.createElement('div');
                resultEl.id = `${deptId}Result`;
                resultEl.className = 'dept-result';
                taskInfo.parentNode.insertBefore(resultEl, taskInfo.nextSibling);
            }
        }
        if (resultEl) {
            resultEl.innerHTML = `<div class="result-content">${this.escapeHtml(result)}</div>`;
            resultEl.style.display = 'block';
            setTimeout(() => resultEl.classList.add('visible'), 50);
        }
    }

    hideAIResult(deptId) {
        const resultEl = document.getElementById(`${deptId}Result`);
        if (resultEl) {
            resultEl.classList.remove('visible');
            setTimeout(() => { resultEl.style.display = 'none'; }, 300);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupDepartments() {
        const deptConfigs = {
            planner: {
                name: 'Planning & Strategy',
                colorKey: 'strategist',
                workTypes: ['strategy', 'planning', 'optimization', 'workflow', 'resource'],
                workSpeed: 0.015
            },
            backend: {
                name: 'Backend Engineering',
                colorKey: 'developer',
                workTypes: ['backend', 'api', 'database', 'server', 'serverless'],
                workSpeed: 0.02
            },
            frontend: {
                name: 'Frontend Engineering',
                colorKey: 'developer',
                workTypes: ['frontend', 'react', 'vue', 'angular', 'dashboard', 'ui', 'css', 'html'],
                workSpeed: 0.025
            },
            structural: {
                name: 'Structural Engineering',
                colorKey: 'engineering',
                workTypes: ['structural', 'building', 'bridge', 'blueprint', 'framework'],
                workSpeed: 0.018
            },
            electrical: {
                name: 'Electrical Engineering',
                colorKey: 'engineering',
                workTypes: ['electrical', 'wiring', 'circuit', 'circuits', 'power', 'electronics', 'voltage'],
                workSpeed: 0.02
            },
            mechanical: {
                name: 'Mechanical Engineering',
                colorKey: 'engineering',
                workTypes: ['mechanical', 'gear', 'engine', 'machine', 'assembly'],
                workSpeed: 0.018
            },
            robotics: {
                name: 'Robotics Engineering',
                colorKey: 'engineering',
                workTypes: ['robot', 'robotics', 'arm', 'automation', 'kinematics'],
                workSpeed: 0.015
            },
            ai: {
                name: 'AI Research',
                colorKey: 'ai',
                workTypes: ['ai', 'ml', 'neural', 'model', 'training', 'machine-learning', 'deep-learning'],
                workSpeed: 0.012
            },
            mechatronics: {
                name: 'Mechatronics Engineering',
                colorKey: 'engineering',
                workTypes: ['mechatronics', 'embedded', 'integration', 'firmware', 'plc', 'actuator'],
                workSpeed: 0.016
            }
        };

        const deptPriority = ['ai', 'robotics', 'mechatronics', 'structural', 'electrical',
                              'mechanical', 'backend', 'frontend', 'planner'];

        Object.entries(deptConfigs).forEach(([id, config]) => {
            this.departments[id] = {
                id,
                name: config.name,
                colorKey: config.colorKey,
                workTypes: config.workTypes,
                workSpeed: config.workSpeed,
                status: 'idle',
                currentTask: 'Idle',
                progress: 0,
                taskTimer: null,
                avatarRenderer: null,
                canvas: null,
                wrapper: null,
                statusEl: null,
                taskEl: null,
                progressEl: null
            };
        });
        this.deptPriority = deptPriority;
    }

    initAvatars() {
        const avatarMap = {
            planner: 'Planner', backend: 'Backend', frontend: 'Frontend',
            structural: 'Structural', electrical: 'Electrical',
            mechanical: 'Mechanical', robotics: 'Robotics',
            ai: 'AI', mechatronics: 'Mechatronics'
        };

        Object.entries(avatarMap).forEach(([deptId, suffix]) => {
            const canvas = document.getElementById(`avatar${suffix}`);
            const wrapper = document.getElementById(`${deptId}Wrapper`);
            const statusEl = document.getElementById(`${deptId}Status`);
            const taskEl = document.getElementById(`${deptId}Task`);
            const progressEl = document.getElementById(`${deptId}Progress`);

            if (canvas && this.departments[deptId]) {
                const ctx = canvas.getContext('2d');
                this.departments[deptId].canvas = canvas;
                this.departments[deptId].wrapper = wrapper;
                this.departments[deptId].statusEl = statusEl;
                this.departments[deptId].taskEl = taskEl;
                this.departments[deptId].progressEl = progressEl;
                
                this.setupDeptElements(deptId);
                this.initAvatarAnimation(deptId, ctx, canvas.width, canvas.height);
            }
        });

        this.animateAllAvatars();
    }

    setupDeptElements(deptId) {
        const dept = this.departments[deptId];
        const colorMap = {
            developer: '#00c8ff',
            engineering: '#4ade80',
            ai: '#a883ff',
            strategist: '#fb9254'
        };
        const deptColor = colorMap[dept.colorKey] || '#00c8ff';
        const borderColor = dept.wrapper;
        const deptCard = document.querySelector(`[data-dept="${deptId}"]`);
        if (deptCard) {
            deptCard.style.setProperty('--dept-color', deptColor);
        }
    }

    initAvatarAnimation(deptId, ctx, w, h) {
        const renderers = {
            planner: () => this.renderPlannerAvatar(ctx, w, h),
            backend: () => this.renderBackendAvatar(ctx, w, h),
            frontend: () => this.renderFrontendAvatar(ctx, w, h),
            structural: () => this.renderStructuralAvatar(ctx, w, h),
            electrical: () => this.renderElectricalAvatar(ctx, w, h),
            mechanical: () => this.renderMechanicalAvatar(ctx, w, h),
            robotics: () => this.renderRoboticsAvatar(ctx, w, h),
            ai: () => this.renderAIAvatar(ctx, w, h),
            mechatronics: () => this.renderMechatronicsAvatar(ctx, w, h)
        };

        const renderer = renderers[deptId];
        if (renderer) {
            let frame = 0;
            const animate = () => {
                frame += 1;
                renderer(frame);
                this.avatarAnimations[deptId] = requestAnimationFrame(animate);
            };
            animate();
        }
    }

    animateAllAvatars() {
        // Animation loops are initiated in initAvatarAnimation
        // This method exists for future global animation coordination
    }

    initFloorGrid() {
        const canvas = document.getElementById('floorGridCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let t = 0;

        const animate = () => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // Draw grid lines
            ctx.strokeStyle = 'rgba(40, 120, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 32) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += 32) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Animated grid nodes
            ctx.fillStyle = 'rgba(0, 200, 255, 0.15)';
            for (let i = 0; i < 50; i++) {
                const x = (i * 137 % w);
                const y = (i * 73 % h);
                const pulse = Math.sin(t * 0.02 + i * 0.3) * 0.5 + 0.5;
                const size = 1 + pulse * 1.5;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            t += 1;
            requestAnimationFrame(animate);
        };
        animate();
    }

    /* ===== AVATAR RENDERERS ===== */

    renderPlannerAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Draw clipboard
        ctx.fillStyle = '#2d2d38';
        ctx.fillRect(25, 10, 65, 85);
        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 10, 65, 85);

        // Clipboard clip
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(40, 88, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(62, 88, 4, 0, Math.PI * 2);
        ctx.fill();

        // Strategy chart on clipboard
        ctx.strokeStyle = '#fb9254';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const x = 33 + i * 8;
            const y = 25 + Math.sin(t * 0.06 + i) * 5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Optimization gear
        ctx.save();
        ctx.translate(72, 40);
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

        // Drawing hand
        ctx.save();
        ctx.translate(58, 60);
        ctx.rotate(Math.sin(t * 0.05) * 0.3);
        ctx.strokeStyle = '#d4b483';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, 5);
        ctx.stroke();
        ctx.fillStyle = '#d4b483';
        ctx.beginPath();
        ctx.arc(14, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    renderBackendAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Draw laptop
        ctx.fillStyle = '#2d2d35';
        ctx.fillRect(25, 40, 62, 42);
        ctx.strokeStyle = '#1a1a1f';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 40, 62, 42);

        // Screen
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(28, 44, 56, 34);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(28, 44, 56, 34);

        // Code lines on screen
        const codeLines = [
            { y: 52, color: '#4ade80', prefix: 'const ' },
            { y: 59, color: '#60a5fa', prefix: 'async ' },
            { y: 66, color: '#fbbf24', prefix: 'await ' },
            { y: 73, color: '#f87171', prefix: 'throw ' }
        ];
        codeLines.forEach((line, i) => {
            ctx.fillStyle = line.color;
            ctx.font = '6px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(line.prefix, 32, line.y);
        });

        // Data flow particles
        ctx.fillStyle = '#00c8ff';
        const dataX = 30 + Math.cos(t * 0.08) * 20;
        const dataY = 47 + Math.sin(t * 0.08) * 8;
        ctx.beginPath();
        ctx.arc(dataX, dataY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Keyboard
        ctx.fillStyle = '#4a4a55';
        ctx.fillRect(28, 82, 56, 7);
        ctx.strokeStyle = '#333';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(30 + i * 7, 84);
            ctx.lineTo(30 + i * 7, 86);
            ctx.stroke();
        }

        // Server rack in background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(15, 25, 8, 12);
        ctx.fillStyle = '#00c8ff';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(16, 29 + i * 3, 6, 1.5);
        }
    }

    renderFrontendAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Draw tablet
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(35, 15, 50, 75);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(35, 15, 50, 75);

        // Screen
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(38, 20, 44, 62);

        // Color palette swatches
        const colors = ['#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa', '#ec4899'];
        colors.forEach((color, i) => {
            ctx.fillStyle = color;
            const y = 28 + i * 8 + Math.sin(t * 0.1 + i) * 3;
            ctx.beginPath();
            ctx.arc(50, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // UI button with hover
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(55, 65, 10, 6);
        ctx.strokeStyle = '#1e40af';
        ctx.strokeRect(55, 65, 10, 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = '5px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Btn', 60, 69);

        // Cursor/mouse pointer
        ctx.save();
        ctx.translate(62, 35);
        ctx.rotate(t * 0.02);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, 0);
        ctx.lineTo(8, 10);
        ctx.lineTo(0, 8);
        ctx.fill();
        ctx.restore();
    }

    renderStructuralAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Draw blueprint
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(20, 10, 72, 85);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 10, 72, 85);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(28 + i * 11, 20);
            ctx.lineTo(28 + i * 11, 88);
            ctx.stroke();
        }
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(20, 25 + i * 13);
            ctx.lineTo(92, 25 + i * 13);
            ctx.stroke();
        }

        // Building structure
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 75);
        ctx.lineTo(48, 35);
        ctx.lineTo(66, 75);
        ctx.lineTo(66, 78);
        ctx.lineTo(30, 78);
        ctx.closePath();
        ctx.stroke();

        // Building supports
        ctx.beginPath();
        ctx.moveTo(40, 48);
        ctx.lineTo(40, 75);
        ctx.lineTo(56, 75);
        ctx.lineTo(56, 48);
        ctx.stroke();

        // Beam being placed
        ctx.fillStyle = '#475569';
        ctx.save();
        ctx.translate(48, 33);
        ctx.rotate(Math.sin(t * 0.05) * 0.15);
        ctx.fillRect(-15, -2, 30, 4);
        ctx.restore();

        // Drafting compass
        ctx.save();
        ctx.translate(78, 22);
        ctx.rotate(t * 0.025);
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(10, 0);
        ctx.rotate(t * 0.06);
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -8);
        ctx.stroke();
        ctx.restore();
    }

    renderElectricalAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Circuit board
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(25, 10, 62, 85);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 1;

        // Circuit paths
        ctx.beginPath();
        ctx.moveTo(30, 25);
        ctx.lineTo(80, 25);
        ctx.lineTo(80, 35);
        ctx.lineTo(50, 35);
        ctx.lineTo(50, 55);
        ctx.lineTo(80, 55);
        ctx.lineTo(80, 65);
        ctx.lineTo(35, 65);
        ctx.lineTo(35, 75);
        ctx.lineTo(80, 75);
        ctx.stroke();

        // Animated current pulses
        const pulses = 6;
        for (let i = 0; i < pulses; i++) {
            const progress = (t * 0.05 + i * 0.8) % 2;
            const brightness = Math.sin(progress * Math.PI) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(96, 165, 250, ${brightness})`;
            ctx.lineWidth = 2;

            let x, y;
            if (progress < 1) {
                x = 30 + progress * 50;
                y = 25;
            } else {
                x = 80;
                y = 25 + (progress - 1) * 10;
            }

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Electronic components
        ctx.fillStyle = '#78350f';
        ctx.fillRect(35, 42, 12, 5);
        ctx.fillRect(65, 42, 12, 5);

        ctx.fillStyle = '#1e40af';
        ctx.fillRect(50, 50, 10, 5);

        // LED (pulsing)
        ctx.fillStyle = Math.sin(t * 0.08) > 0 ? '#f59e0b' : '#92400e';
        ctx.beginPath();
        ctx.arc(52, 30, 3, 0, Math.PI * 2);
        ctx.fill();

        // Wire animation
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const wireX = 45 + Math.cos(t * 0.08) * 12;
        ctx.moveTo(wireX, 60);
        ctx.lineTo(wireX, 68);
        ctx.stroke();
    }

    renderMechanicalAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Draw gears
        const gearData = [
            { x: 35, y: 50, r: 12, teeth: 12, speed: 1, color: '#94a3b8' },
            { x: 60, y: 45, r: 10, teeth: 10, speed: -1.2, color: '#cbd5e1' },
            { x: 82, y: 55, r: 8, teeth: 8, speed: 1.5, color: '#64748b' },
        ];

        gearData.forEach((gear) => {
            ctx.save();
            ctx.translate(gear.x, gear.y);
            ctx.rotate(t * 0.02 * gear.speed);

            for (let j = 0; j < gear.teeth; j++) {
                ctx.save();
                ctx.rotate((j / gear.teeth) * Math.PI * 2);
                ctx.fillStyle = gear.color;
                ctx.beginPath();
                ctx.moveTo(0, -gear.r - 3);
                ctx.lineTo(0, -gear.r - 7);
                ctx.lineTo(0, -gear.r - 9);
                ctx.arc(0, -gear.r - 8, 1.8, 0, Math.PI);
                ctx.fill();
                ctx.restore();
            }

            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, 0, gear.r * 0.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#334155';
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

        // Wrench animation
        ctx.save();
        ctx.translate(85, 75);
        ctx.rotate(Math.sin(t * 0.05) * 0.6);
        ctx.fillStyle = '#d4d4d4';
        ctx.fillRect(-3, -14, 6, 28);
        ctx.fillRect(-10, -3, 26, 6);
        ctx.restore();

        // Machine base
        ctx.fillStyle = '#334155';
        ctx.fillRect(15, 70, 82, 6);

        // Pulley system
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(35, 70, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(82, 70, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(39, 70);
        ctx.lineTo(78, 70);
        ctx.stroke();
    }

    renderRoboticsAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Work surface
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(15, 70, 82, 5);

        // Robot arm base
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(50, 68, 5, 0, Math.PI * 2);
        ctx.fill();

        // Robot arm segments
        const armAngle1 = Math.sin(t * 0.05 + 0.2) * 0.7;
        const armAngle2 = Math.sin(t * 0.04 - 0.3) * 0.9;
        const armAngle3 = Math.sin(t * 0.03 + 0.5) * 1.1;

        ctx.save();
        ctx.translate(50, 68);

        // Segment 1
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 20);
        ctx.stroke();

        // Joint 1
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 20, 4, 0, Math.PI * 2);
        ctx.fill();

        // Segment 2
        ctx.translate(0, 20);
        ctx.rotate(armAngle1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 22);
        ctx.stroke();

        // Joint 2
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 22, 4, 0, Math.PI * 2);
        ctx.fill();

        // Segment 3
        ctx.translate(0, 22);
        ctx.rotate(armAngle2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 20);
        ctx.stroke();

        // Gripper
        ctx.translate(0, 20);
        ctx.rotate(armAngle3);
        const gripOpen = Math.abs(Math.sin(t * 0.04)) * 5;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-6, 0, 12, 4);
        ctx.fillRect(-8, 0, 4, 8 + gripOpen);
        ctx.fillRect(4, 0, 4, 8 + gripOpen);

        ctx.restore();

        // Robot body
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(38, 28, 24, 30);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(38, 28, 24, 30);

        // Robot face
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(45, 40, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(55, 40, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // LED mouth display
        ctx.fillStyle = Math.sin(t * 0.05) > 0 ? '#10b981' : '#064e35';
        ctx.fillRect(42, 48, 16, 5);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(42, 48, 16, 5);
        ctx.fillStyle = '#0d9488';
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AI', 50, 52);
    }

    renderAIAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Neural network nodes
        const nodeCount = 8;
        const radius = 28;
        const centerX = 50;
        const centerY = 45;

        // Draw connections
        for (let i = 0; i < nodeCount; i++) {
            const aX = centerX + Math.cos(i / nodeCount * Math.PI * 2) * radius;
            const aY = centerY + Math.sin(i / nodeCount * Math.PI * 2) * radius;
            for (let j = i + 1; j < nodeCount; j++) {
                const bX = centerX + Math.cos(j / nodeCount * Math.PI * 2) * radius;
                const bY = centerY + Math.sin(j / nodeCount * Math.PI * 2) * radius;

                const alpha = Math.sin(t * 0.03 + i * 0.5 + j * 0.3) * 0.3 + 0.3;
                ctx.strokeStyle = `rgba(167, 139, 255, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(aX, aY);
                ctx.lineTo(bX, bY);
                ctx.stroke();
            }
        }

        // Draw data pulses along connections
        for (let i = 0; i < nodeCount; i++) {
            const next = (i + 1) % nodeCount;
            const aX = centerX + Math.cos(i / nodeCount * Math.PI * 2) * radius;
            const aY = centerY + Math.sin(i / nodeCount * Math.PI * 2) * radius;
            const bX = centerX + Math.cos(next / nodeCount * Math.PI * 2) * radius;
            const bY = centerY + Math.sin(next / nodeCount * Math.PI * 2) * radius;

            const progress = (Math.sin(t * 0.08 + i * 0.7) + 1) / 2;
            const px = aX + (bX - aX) * progress;
            const py = aY + (bY - aY) * progress;

            ctx.fillStyle = '#c4b5ff';
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw neurons
        for (let i = 0; i < nodeCount; i++) {
            const x = centerX + Math.cos(i / nodeCount * Math.PI * 2) * radius;
            const y = centerY + Math.sin(i / nodeCount * Math.PI * 2) * radius;

            const pulseSize = 3 + Math.sin(t * 0.05 - i * 0.4) * 2;
            ctx.strokeStyle = '#c4b5ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central processing unit
        ctx.fillStyle = '#1e1b2e';
        ctx.fillRect(35, 53, 30, 22);
        ctx.strokeStyle = '#6d28d9';
        ctx.lineWidth = 2;
        ctx.strokeRect(35, 53, 30, 22);

        // CPU activity bars
        const barCount = 5;
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.abs(Math.sin(t * 0.05 - i * 0.7)) * 16;
            ctx.fillStyle = i % 2 === 0 ? '#8b5cf6' : '#a78bfa';
            ctx.fillRect(37 + i * 6, 62 - barHeight, 4, barHeight);
        }

        // Binary data stream
        ctx.fillStyle = '#a78bfa';
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        for (let i = 0; i < 5; i++) {
            const bit = Math.floor(Math.sin(t * 0.2 + i) * 10) % 2;
            ctx.fillText(bit === 0 ? '0' : '1', 37 + i * 6 + 2, 76);
        }
    }

    renderMechatronicsAvatar(ctx, w, h, frame = 0) {
        ctx.clearRect(0, 0, w, h);
        const t = frame;

        // Work surface
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(10, 75, 80, 5);

        // Mechanical arm
        ctx.save();
        ctx.translate(40, 70);
        ctx.rotate(Math.sin(t * 0.04) * 0.5);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-2, -18, 4, 18);

        // Joint
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, -18, 3, 0, Math.PI * 2);
        ctx.fill();

        // Sensor end-effector
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-5, -28, 10, 8);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 1;
        ctx.strokeRect(-5, -28, 10, 8);

        // Sensor light
        ctx.fillStyle = Math.sin(t * 0.12) > 0 ? '#06b6d4' : '#0ea5e9';
        ctx.beginPath();
        ctx.arc(0, -24, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Circuit traces on base
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 68);
        ctx.lineTo(50, 68);
        ctx.lineTo(50, 70);
        ctx.lineTo(78, 70);
        ctx.stroke();

        // Data flow dots
        for (let i = 0; i < 5; i++) {
            const progress = (t * 0.05 + i * 0.6) % 2;
            if (progress < 0.5) {
                ctx.fillStyle = '#38bdf8';
                const x = 22 + (progress / 0.5) * 28;
                ctx.beginPath();
                ctx.arc(x, 68, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Microcontroller
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(62, 52, 24, 16);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 1;
        ctx.strokeRect(62, 52, 24, 16);
        ctx.fillStyle = '#0ea5e9';
        ctx.font = '5px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MCU', 74, 59);

        // MCU pins
        ctx.fillStyle = '#d4d4d4';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc(66 + (i % 2) * 14, 54 + Math.floor(i / 2) * 4, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ===== EVENT LISTENERS ===== */

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

    /* ===== REQUEST ROUTING ===== */

    async submitRequest(requestText) {
        if (this.wsConnected) {
            // Send to backend AI team
            this.pendingRequests.set(requestText, true);
            const card = this.addRequestCard(requestText, 'routing');

            try {
                const response = await fetch(`${this.backendUrl}/api/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ request: requestText })
                });
                const data = await response.json();
                this.pendingRequests.set(data.request_id, requestText);
                this.requestCards.set(data.request_id, card);
            } catch (e) {
                console.error('[Backend] Submit failed:', e);
                // Fallback to local routing
                const dept = this.routeRequest(requestText);
                this.showRequestFlow(requestText, dept);
                this.assignTask(dept, requestText);
            }
        } else {
            // Fallback: local routing (no backend connection)
            const dept = this.routeRequest(requestText);
            this.showRequestFlow(requestText, dept);
            this.assignTask(dept, requestText);
        }
    }

    addRequestCard(requestText, status) {
        const flowContainer = document.getElementById('requestFlow');
        if (!flowContainer) return null;

        const card = document.createElement('div');
        card.className = 'request-card';
        card.title = requestText;

        const textEl = document.createElement('div');
        textEl.className = 'request-text';
        textEl.textContent = requestText.substring(0, 80);
        card.appendChild(textEl);

        const statusEl = document.createElement('div');
        statusEl.className = 'request-status';
        statusEl.textContent = status === 'routing' ? 'Routing...' : status;
        card.appendChild(statusEl);

        const modelBadge = document.createElement('div');
        modelBadge.className = 'request-model-badge';
        modelBadge.textContent = 'AI Team';
        card.appendChild(modelBadge);

        flowContainer.appendChild(card);

        // Position right or left alternately
        const cards = flowContainer.children;
        if (cards.length % 2 === 0) {
            card.classList.add('request-flow-right');
        } else {
            card.classList.add('request-flow-left');
        }

        setTimeout(() => card.classList.add('show'), 50);
        return card;
    }

    routeRequest(requestText) {
        const lowerText = requestText.toLowerCase();
        let bestDept = 'planner';
        let bestScore = 0;

        for (const deptId of this.deptPriority) {
            const dept = this.departments[deptId];
            if (!dept) continue;

            let score = 0;
            for (const workType of dept.workTypes) {
                const tokens = workType.replace(/[-_]/g, ' ').split(' ');
                const matched = tokens.every(token => {
                    if (token.length < 3) return false;
                    const regex = new RegExp(`\\b${token}s?\\b`, 'i');
                    return regex.test(lowerText);
                });
                if (matched && tokens.length > 0) {
                    score += 2;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestDept = deptId;
            }
        }

        return bestDept;
    }

    /* ===== WORK SIMULATION ===== */

    assignTask(deptId, taskText) {
        const dept = this.departments[deptId];
        if (!dept || dept.status === 'busy') return;

        dept.status = 'busy';
        dept.currentTask = taskText;
        dept.progress = 0;
        this.pendingTasks++;

        this.updateDeptUI(deptId);
        this.updateStats();

        // Simulate task duration based on department work speed
        const baseDuration = 3000 + Math.random() * 4000;
        const duration = baseDuration / (dept.workSpeed * 50);
        const startTime = Date.now();

        const taskInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            dept.progress = progress;
            this.updateProgress(deptId, progress);

            if (progress >= 100) {
                clearInterval(taskInterval);
                dept.status = 'completed';
                dept.currentTask = 'Completed!';
                dept.progress = 100;
                this.completedTasks++;
                this.pendingTasks = Math.max(0, this.pendingTasks - 1);
                this.updateStats();

                this.updateDeptUI(deptId);

                setTimeout(() => {
                    if (dept.status === 'completed') {
                        dept.status = 'idle';
                        dept.currentTask = 'Idle';
                        dept.progress = 0;
                        this.updateProgress(deptId, 0);
                        this.updateDeptUI(deptId);
                        this.updateStats();
                    }
                }, 2000);
            }
        }, 50);
    }

    /* ===== UI UPDATES ===== */

    updateDeptUI(deptId) {
        const dept = this.departments[deptId];
        if (!dept) return;

        const statusEl = document.getElementById(`${deptId}Status`);
        const taskEl = document.getElementById(`${deptId}Task`);
        const wrapper = document.getElementById(`${deptId}Wrapper`);

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

        if (wrapper) {
            wrapper.className = 'avatar-canvas-wrapper';
            wrapper.classList.add(dept.status);
        }
    }

    updateProgress(deptId, progress) {
        const progressEl = document.getElementById(`${deptId}Progress`);
        if (progressEl) {
            progressEl.style.width = `${progress}%`;
        }
    }

    updateStats() {
        const activeCount = Object.values(this.departments).filter(d => d.status !== 'idle').length;
        const busyCount = Object.values(this.departments).filter(d => d.status === 'busy').length;

        const activeEl = document.getElementById('activeDeptsCount');
        const busyEl = document.getElementById('busyDeptsCount');
        const completedEl = document.getElementById('completedTasksCount');
        const pendingEl = document.getElementById('pendingTasksCount');

        if (activeEl) activeEl.textContent = `${activeCount}/9 Active`;
        if (busyEl) busyEl.textContent = `${busyCount} Busy`;
        if (completedEl) completedEl.textContent = `${this.completedTasks} Completed`;
        if (pendingEl) pendingEl.textContent = `${this.pendingTasks} Pending`;
    }

    showRequestFlow(requestText, dept) {
        const flowContainer = document.getElementById('requestFlow');
        if (!flowContainer) return;

        const card = document.createElement('div');
        card.className = 'request-card';
        card.textContent = requestText.substring(0, 80);
        card.title = requestText;
        flowContainer.appendChild(card);

        // Position right or left alternately
        const cards = flowContainer.children;
        if (cards.length % 2 === 0) {
            card.classList.add('request-flow-right');
        } else {
            card.classList.add('request-flow-left');
        }

        setTimeout(() => card.classList.add('show'), 50);

        setTimeout(() => card.classList.add('routed'), 1000);
        setTimeout(() => card.classList.add('processing'), 2000);
        setTimeout(() => card.classList.add('completed'), 5000);

        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            setTimeout(() => {
                if (card.parentNode) flowContainer.removeChild(card);
            }, 500);
        }, 8000);
    }

    startSimulation() {
        // Initial task assignments
        setTimeout(() => this.assignTask('backend', 'Building API endpoints for user service'), 500);
        setTimeout(() => this.assignTask('ai', 'Training recommendation model v2'), 1000);
        setTimeout(() => this.assignTask('mechanical', 'Designing gear assembly for drone'), 2000);
        setTimeout(() => this.assignTask('planner', 'Optimizing resource allocation matrix'), 3000);
        setTimeout(() => this.assignTask('robotics', 'Assembling robotic arm prototype'), 2500);
        setTimeout(() => this.assignTask('electrical', 'Wiring control panel circuits'), 1500);

        // Periodic autonomous task generation
        setInterval(() => {
            if (Math.random() > 0.7) {
                const deptIds = Object.keys(this.departments).filter(d => d !== 'planner' && d !== 'backend' && d !== 'ai');
                const randomDept = deptIds[Math.floor(Math.random() * deptIds.length)];
                const tasks = [
                    'Analyzing system performance metrics',
                    'Running diagnostics on subsystem',
                    'Processing pipeline jobs',
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
        setInterval(() => this.updateStats(), 1000);
    }
}

/* ===== Initialize on DOM load ===== */
document.addEventListener('DOMContentLoaded', () => {
    const office = new VirtualOffice();

    // Auto-dispatch demo requests
    setTimeout(() => office.submitRequest('Build a React dashboard for the AI model metrics'), 6000);
    setTimeout(() => office.submitRequest('Design structural supports for rooftop installation'), 12000);
    setTimeout(() => office.submitRequest('Optimize neural network inference pipeline'), 18000);
});

