const socket = io("https://smart-waste-pics-authentication-user-new.onrender.com");

let activeReports = [];
let currentChatReport = null;

const reportsList = document.getElementById("admin-reports-list");
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("admin-msg-input");
const sendBtn = document.getElementById("send-btn");
const markSuccessBtn = document.getElementById("mark-success-btn");
const currentChatName = document.getElementById("current-chat-name");
const currentChatId = document.getElementById("current-chat-id");

socket.on("connect", () => {
    console.log("Connected to Socket.IO server");
    loadReportsFromStorage();
});

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server");
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    loadReportsFromStorage();
});

function loadReportsFromStorage() {
    try {
        const storedReports = localStorage.getItem('reports');
        
        if (storedReports) {
            const parsedReports = JSON.parse(storedReports);
            
            if (Array.isArray(parsedReports) && parsedReports.length > 0) {
                activeReports = parsedReports.filter(r => r.status !== 'Success');
                renderReports();
            } else {
                renderReports();
            }
        } else {
            renderReports();
        }
    } catch (error) {
        console.error("Error loading from localStorage:", error);
        renderReports();
    }
}

socket.on("announce_report_to_admin", (report) => {
    if (!report || !report.id) {
        return;
    }
    
    if (report.status === 'Success') {
        return;
    }
    
    const existingIndex = activeReports.findIndex(r => r.id === report.id);
    
    if (existingIndex === -1) {
        activeReports.unshift(report);
    } else {
        activeReports[existingIndex] = report;
    }
    
    renderReports();
});

function renderReports() {
    if (!reportsList) {
        return;
    }
    
    if (activeReports.length === 0) {
        reportsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                <p style="margin: 10px 0; font-weight: 500;">No active reports</p>
                <p style="font-size: 12px; color: #999;">All reports have been resolved or no reports yet</p>
                <button onclick="loadReportsFromStorage()" style="margin-top: 15px; padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                    <i class="fas fa-sync-alt"></i> Refresh Reports
                </button>
                <button onclick="addTestReport()" style="margin-top: 10px; padding: 8px 16px; background: #34a853; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                    <i class="fas fa-plus"></i> Add Test Report
                </button>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = activeReports.map(report => {
        const isActive = currentChatReport && currentChatReport.id === report.id;
        const statusText = report.status || 'Dispatched';
        const statusColor = '#1967d2';
        
        return `
            <div class="report-card ${isActive ? 'active' : ''}" data-report-id="${report.id}">
                <div style="display: flex; gap: 10px; align-items: start;">
                    <img src="${report.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Crect fill=\'%23f1f3f4\' width=\'60\' height=\'60\'/%3E%3C/svg%3E'}" 
                         style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; background: #f1f3f4;"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Crect fill=\'%23f1f3f4\' width=\'60\' height=\'60\'/%3E%3C/svg%3E'">
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${report.wasteType || 'Unknown'}</strong>
                            <span style="font-size: 11px; color: white; background: ${statusColor}; padding: 2px 8px; border-radius: 10px; white-space: nowrap;">${statusText}</span>
                        </div>
                        <p style="font-size: 12px; color: #666; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <i class="fas fa-user"></i> ${report.userEmail || 'Anonymous'}
                        </p>
                        <p style="font-size: 12px; color: #666; margin: 3px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <i class="fas fa-map-marker-alt"></i> ${report.location || 'No location'}
                        </p>
                        <p style="font-size: 11px; color: #999; margin: 3px 0 0 0;">
                            <i class="far fa-calendar"></i> ${report.date || new Date().toLocaleDateString()} • ID: #W-${report.id}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', () => {
            const reportId = card.dataset.reportId;
            const report = activeReports.find(r => r.id == reportId);
            if (report) {
                openChat(report);
            }
        });
    });
}

function openChat(report) {
    currentChatReport = report;
    
    document.querySelectorAll('.report-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-report-id="${report.id}"]`)?.classList.add('active');
    
    currentChatName.textContent = `Chat with ${report.userEmail || 'User'}`;
    currentChatId.textContent = `Report ID: #W-${report.id} | ${report.wasteType} | ${report.location}`;
    
    if (markSuccessBtn) {
        markSuccessBtn.style.display = 'block';
    }
    
    chatBox.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 14px;">💬 Chat started. Send a message to the user...</div>';
    
    socket.emit("join_report_chat", report.id);
}

function sendMessage() {
    if (!currentChatReport) {
        alert("Please select a report first");
        return;
    }
    
    const text = msgInput.value.trim();
    if (!text) return;
    
    appendMessage("Admin", text, true);
    
    socket.emit("send_message", {
        reportId: currentChatReport.id,
        text: text,
        sender: "Admin"
    });
    
    msgInput.value = "";
}

function appendMessage(sender, text, isAdmin = false) {
    const placeholder = chatBox.querySelector('div[style*="text-align: center"]');
    if (placeholder) placeholder.remove();
    
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${isAdmin ? 'admin' : 'user'}`;
    msgDiv.innerHTML = `
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">
            <strong>${sender}</strong>
            <span style="float: right;">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style="font-size: 14px; word-wrap: break-word;">${text}</div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

socket.on("receive_message", (data) => {
    if (currentChatReport && data.reportId == currentChatReport.id && data.sender !== "Admin") {
        appendMessage(data.sender, data.text, false);
    }
});

if (markSuccessBtn) {
    markSuccessBtn.addEventListener("click", () => {
        if (!currentChatReport) return;
        
        if (confirm(`Mark report #W-${currentChatReport.id} as cleaned and resolved? This will remove it from active reports.`)) {
            const reportId = currentChatReport.id;
            
            const allReports = JSON.parse(localStorage.getItem('reports') || '[]');
            const reportIndex = allReports.findIndex(r => r.id === reportId);
            if (reportIndex !== -1) {
                allReports[reportIndex].status = 'Success';
                localStorage.setItem('reports', JSON.stringify(allReports));
            }
            
            socket.emit("status_changed", {
                reportId: reportId,
                status: 'Success'
            });
            
            socket.emit("send_message", {
                reportId: reportId,
                text: "✅ This report has been marked as cleaned and resolved. Thank you for your contribution!",
                sender: "System"
            });
            
            activeReports = activeReports.filter(r => r.id !== reportId);
            
            currentChatReport = null;
            chatBox.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 14px;">Select a report to start chat</div>';
            currentChatName.textContent = "Select a report to start chat";
            currentChatId.textContent = "";
            markSuccessBtn.style.display = 'none';
            
            renderReports();
            
            alert("Report marked as cleaned and removed from active reports!");
        }
    });
}

if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}

if (msgInput) {
    msgInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
}

window.loadReportsFromStorage = loadReportsFromStorage;

window.addTestReport = function() {
    const testReport = {
        id: Math.floor(1000 + Math.random() * 9000),
        userEmail: 'test@example.com',
        wasteType: 'Biodegradable',
        location: 'Mumbai, Maharashtra',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%2334a853" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20"%3ETest Waste%3C/text%3E%3C/svg%3E',
        status: 'Dispatched'
    };
    
    activeReports.unshift(testReport);
    
    const existing = JSON.parse(localStorage.getItem('reports') || '[]');
    existing.unshift(testReport);
    localStorage.setItem('reports', JSON.stringify(existing));
    
    renderReports();
    alert('Test report added! You can now click on it to start chatting.');
};

loadReportsFromStorage();