/**
 * Real-time Collaborative Whiteboard Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('whiteboard');
    if (!canvas) return; // Not on whiteboard page

    const ctx = canvas.getContext('2d');
    const socket = io('/', { transports: ['polling', 'websocket'] });
    const group_id = typeof GROUP_ID !== 'undefined' ? GROUP_ID : null;

    if (!group_id) return;

    // Join room
    socket.emit('join', { username: 'User', room: group_id });

    // State
    let drawing = false;
    let current = { x: 0, y: 0 };
    let color = '#000000';
    let size = 2;

    // Controls
    const colorPicker = document.getElementById('wb-color');
    const sizePicker = document.getElementById('wb-size');
    const clearBtn = document.getElementById('wb-clear');
    const saveBtn = document.getElementById('wb-save');

    if (colorPicker) {
        colorPicker.addEventListener('change', (e) => color = e.target.value);
        color = colorPicker.value;
    }
    if (sizePicker) {
        sizePicker.addEventListener('change', (e) => size = parseInt(e.target.value));
        size = parseInt(sizePicker.value);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Local clear
            clearCanvas();
            // Emit clear
            socket.emit('wb_clear', { room: group_id });
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `whiteboard-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }

    // Resize
    function resize() {
        // Save content?
        const temp = canvas.toDataURL();
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Restore logic if needed, but resizing usually clears. 
        // For simple MVP we might just clear or accept it.
        // Better: don't resize constantly or set fixed high res and scale with CSS.
        // Let's set it once
    }

    // Initial resize
    setTimeout(resize, 100);
    window.addEventListener('resize', resize);

    // Helpers
    function drawLine(x0, y0, x1, y1, color, size, emit) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();

        if (!emit) return;

        socket.emit('wb_draw', {
            room: group_id,
            x0: x0 / canvas.width,
            y0: y0 / canvas.height,
            x1: x1 / canvas.width,
            y1: y1 / canvas.height,
            color: color,
            size: size
        });
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Mouse Events
    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        current.x = e.offsetX;
        current.y = e.offsetY;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!drawing) return;
        drawing = false;
        drawLine(current.x, current.y, e.offsetX, e.offsetY, color, size, true);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        drawLine(current.x, current.y, e.offsetX, e.offsetY, color, size, true);
        current.x = e.offsetX;
        current.y = e.offsetY;
    });

    // Touch Events (Basic support)
    canvas.addEventListener('touchstart', (e) => {
        drawing = true;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        current.x = touch.clientX - rect.left;
        current.y = touch.clientY - rect.top;
        e.preventDefault();
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!drawing) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        drawLine(current.x, current.y, x, y, color, size, true);
        current.x = x;
        current.y = y;
        e.preventDefault();
    });

    canvas.addEventListener('touchend', () => {
        drawing = false;
    });

    // Socket Listeners
    socket.on('wb_draw', (data) => {
        const x0 = data.x0 * canvas.width;
        const y0 = data.y0 * canvas.height;
        const x1 = data.x1 * canvas.width;
        const y1 = data.y1 * canvas.height;
        drawLine(x0, y0, x1, y1, data.color, data.size, false);
    });

    socket.on('wb_clear', () => {
        clearCanvas();
    });

    // Tab switching fix
    // If canvas is hidden, width might be 0. When tab switches, trigger resize.
    window.triggerWhiteboardResize = function () {
        setTimeout(resize, 50);
    }
});
