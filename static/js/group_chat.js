document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // UX Logic (Auto-resize, Enter key)
    // ----------------------------------------------------
    const chatInput = document.getElementById('groupChatInput');
    const sendButton = document.getElementById('groupSendButton');
    const messagesContainer = document.getElementById('groupMessagesContainer');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const chatForm = document.getElementById('groupChatForm');

    if (chatInput) {
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Instead of clicking button, dispatch submit event to handle via socket
                if (chatForm) chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        const previewContainer = document.getElementById('filePreviewContainer');
        const previewName = document.getElementById('previewFileName');
        const removeFileBtn = document.getElementById('removeFileBtn');

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                uploadBtn.classList.add('text-primary');

                // Show preview
                if (previewContainer && previewName) {
                    previewContainer.style.display = 'flex';
                    previewName.textContent = file.name;

                    // Optional: Image preview if needed
                    // const reader = new FileReader(); ...
                }
            } else {
                clearFileSelection();
            }
        });

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                clearFileSelection();
            });
        }

        function clearFileSelection() {
            fileInput.value = '';
            uploadBtn.classList.remove('text-primary');
            if (previewContainer) previewContainer.style.display = 'none';
        }

        // Expose to submit handler scope if needed, or attach to form element
        chatForm.clearFileSelection = clearFileSelection;
    }

    // ----------------------------------------------------
    // Auto-refresh: Poll for new messages every 2 seconds
    // ----------------------------------------------------
    let lastMessageId = 0;
    const seenMessageIds = new Set();

    // Get the last message ID from the page
    const existingMessages = document.querySelectorAll('[data-message-id]');
    if (existingMessages.length > 0) {
        const lastMsg = existingMessages[existingMessages.length - 1];
        lastMessageId = parseInt(lastMsg.getAttribute('data-message-id')) || 0;

        // Populate seen IDs
        existingMessages.forEach(el => {
            const id = parseInt(el.getAttribute('data-message-id'));
            if (id) seenMessageIds.add(id);
        });
    }

    // Poll for new messages every 2 seconds
    setInterval(async () => {
        try {
            const response = await fetch(`/group/${GROUP_ID}/messages?since=${lastMessageId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        appendMessage(msg);
                    });
                }
            }
        } catch (err) {
            console.error('Error polling messages:', err);
        }
    }, 2000); // Poll every 2 seconds

    // ----------------------------------------------------
    // Socket.IO Logic (keeping as backup)
    // ----------------------------------------------------
    if (typeof io !== 'undefined' && GROUP_ID) {
        // Initialize socket with explicit path and polling-first transport for stability on Render
        const socket = io('/', {
            transports: ['polling', 'websocket'],
            upgrade: true,
            rememberUpgrade: true
        });

        socket.on('connect', () => {
            console.log('Connected to SocketIO server');
            console.log('Transport:', socket.io.engine.transport.name);  // Debug: show transport type
            socket.emit('join', { group_id: GROUP_ID });
        });

        socket.on('joined_room', (data) => {
            console.log('✓ Joined room:', data.room);
        });

        socket.on('receive_message', (data) => {
            console.log('📩 Message received:', data);
            appendMessage(data);
            handleNovaProxy(data);
        });

    // --- NOVA PROXY ---
    function handleNovaProxy(data) {
        const isMe = String(data.user_id) === String(CURRENT_USER_ID);
        const isProxyEnabled = sessionStorage.getItem('nova_proxy_enabled') === 'true';
        
        if (!isMe && isProxyEnabled && data.role !== 'assistant') {
            // Get last 5 messages for context
            const messageElements = Array.from(messagesContainer.children).slice(-5);
            const chatMsgs = messageElements.map(el => {
                const bubble = el.querySelector('div[style*="background"]');
                return {
                    is_me: bubble ? bubble.style.background.includes('var(--accent-green)') : false,
                    content: bubble ? bubble.innerText.trim() : ''
                };
            }).filter(m => m.content !== '');

            fetch('/api/nova/proxy-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friend_name: data.username || 'Friend', history: chatMsgs })
            })
            .then(res => res.json())
            .then(proxyData => {
                if (proxyData.reply) {
                    chatInput.value = proxyData.reply;
                    // Trigger auto-resize
                    chatInput.dispatchEvent(new Event('input'));
                    setTimeout(() => { 
                        if (chatForm) chatForm.dispatchEvent(new Event('submit'));
                    }, 2000);
                }
            })
            .catch(err => console.error("Nova Proxy Error:", err));
        }
    }

        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const message = chatInput.value.trim();
                const file = fileInput.files[0];

                console.log('🔵 Form submitted. Message:', message, 'File:', file);

                if (!message && !file) {
                    console.log('❌ No message or file - aborting');
                    return;
                }

                let filePath = null;

                // Handle File Upload first if exists
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        sendButton.disabled = true;
                        console.log('📤 Uploading file...');
                        const response = await fetch('/group/upload', {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            const result = await response.json();
                            filePath = result.url;
                            console.log('✅ File uploaded:', filePath);
                        } else {
                            console.error('❌ File upload failed');
                            alert('Failed to upload file');
                            sendButton.disabled = false;
                            return;
                        }
                    } catch (err) {
                        console.error('❌ Error uploading file:', err);
                        sendButton.disabled = false;
                        return;
                    }
                }

                // Emit message via SocketIO
                console.log('📡 Emitting message to room:', GROUP_ID);
                socket.emit('send_message', {
                    group_id: GROUP_ID,
                    content: message,
                    file_path: filePath
                });
                console.log('✅ Message emitted successfully');

                // FALLBACK: Also append to UI immediately (will remove duplicates later)
                // This ensures user ALWAYS sees their message even if Socket.IO broadcast fails
                // Mark as temp so it can be replaced
                const tempId = 'temp-' + Date.now();
                const tempMessage = {
                    id: tempId,  // Temporary ID
                    user_id: CURRENT_USER_ID,
                    username: CURRENT_USER_NAME || 'You',  // Use actual user name
                    avatar: CURRENT_USER_AVATAR,  // Use actual user avatar
                    content: message,
                    file_path: filePath,
                    created_at: new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    role: 'user',
                    is_temp: true
                };

                console.log('💬 Adding message to UI immediately');
                appendMessage(tempMessage);

                // Reset UI
                chatInput.value = '';
                chatInput.style.height = 'auto';
                if (chatForm.clearFileSelection) chatForm.clearFileSelection();
                sendButton.disabled = false;
            });
        }
    }

    function appendMessage(data) {
        if (!messagesContainer) return;

        // DEDUPLICATION LOGIC
        // If it's a real message (not temp) and we've seen it, skip
        if (data.id && !String(data.id).startsWith('temp-')) {
            if (seenMessageIds.has(data.id)) {
                console.log(`Duplicate message ${data.id} ignored.`);
                return;
            }

            // Mark as seen
            seenMessageIds.add(data.id);

            // Update lastMessageId for polling
            if (typeof data.id === 'number') {
                lastMessageId = Math.max(lastMessageId, data.id);
            }

            // Remove any temp messages if this is 'my' message coming back from server
            const isMe = String(data.user_id) === String(CURRENT_USER_ID);
            if (isMe) {
                // Try to find a temp message and remove it to avoid visual double for a split second
                // (Simple heuristic: remove the last temp message if exists)
                const temps = messagesContainer.querySelectorAll('[data-temp="true"]');
                if (temps.length > 0) {
                    temps[temps.length - 1].remove();
                }
            }
        }

        const isMe = String(data.user_id) === String(CURRENT_USER_ID);
        const isAI = data.role === 'assistant';

        // Create message container with same styling as template
        const msgDiv = document.createElement('div');
        msgDiv.style.display = 'flex';
        msgDiv.style.gap = '10px';
        msgDiv.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
        msgDiv.style.maxWidth = '70%';
        if (isMe) {
            msgDiv.style.flexDirection = 'row-reverse';
        }

        // Mark temp messages
        if (data.is_temp) {
            msgDiv.setAttribute('data-temp', 'true');
            msgDiv.style.opacity = '0.7'; // Visual cue it's sending
        } else {
            msgDiv.setAttribute('data-message-id', data.id);
        }

        // Avatar HTML
        let avatarHtml = '';
        if (isAI) {
            avatarHtml = `
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: grid; place-items: center; color: white; font-size: 0.8rem;">
                    <i class="fa-solid fa-robot"></i>
                </div>
            `;
        } else {
            const avatarUrl = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username || 'User')}&background=random`;
            avatarHtml = `<img src="${avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`;
        }

        // Name label
        const nameLabel = isAI ? 'AI Coach' : (isMe ? 'You' : data.username);

        // Message bubble styling
        const bubbleBg = isMe ? 'var(--accent-green)' : (isAI ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)');
        const bubbleColor = isMe ? 'black' : 'white';
        const borderRadius = isMe ? '12px 0 12px 12px' : '0 12px 12px 12px';
        const borderColor = isAI ? 'rgba(59, 130, 246, 0.3)' : 'transparent';

        // Attachment HTML
        let attachmentHtml = '';
        if (data.file_path) {
            attachmentHtml = `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.1);">
                    <a href="${data.file_path}" target="_blank" style="text-decoration: none; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: inherit; font-weight: 600;">
                        <i class="fa-solid fa-paperclip"></i> Attachment
                    </a>
                </div>
            `;
        }

        // Build the complete message structure matching the template
        msgDiv.innerHTML = `
            ${avatarHtml}
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 4px;">
                    ${nameLabel} • <span>${data.created_at}</span>
                </div>
                <div style="background: ${bubbleBg}; color: ${bubbleColor}; padding: 12px; border-radius: ${borderRadius}; font-weight: 500; font-size: 0.95rem; border: 1px solid ${borderColor};">
                    ${escapeHtml(data.content)}
                    ${attachmentHtml}
                </div>
            </div>
        `;

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});