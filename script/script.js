const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("preview");
const previewWrapper = document.getElementById("preview-wrapper");
const resultDiv = document.getElementById("prediction-result");
const detectedImg = document.getElementById("detected-image");
const warning = document.querySelector('.warning');
const wasteTypeField = document.getElementById("waste-type");
const recommendationField = document.getElementById("recommendation");
const nameInput = document.getElementById("userName");
const emailInput = document.getElementById("userEmail");
const phoneInput = document.getElementById("userPhone");
const locationInput = document.getElementById("userLocation");
const detectBtn = document.getElementById("detect-button");
const submitBtn = document.getElementById("submit-details");
const wasteDescInput = document.getElementById("wasteDescription");
const trackEmailInput = document.getElementById("track-email");
const submitText = document.getElementById("submit-text");
const submitSpinner = document.getElementById("submit-spinner");

let socket;
try {
    if (typeof io !== 'undefined') {
        socket = io("https://smart-waste-pics-authentication-user-new.onrender.com");
        console.log("Socket.IO initialized");
    } else {
        console.warn("Socket.IO not loaded");
    }
} catch (e) {
    console.warn("Socket.IO initialization failed:", e);
}

const N8N_WEBHOOK_URL = "https://n8n-smart-waste-pics.onrender.com/webhook/61e29fbc-00ef-4ab5-9d0a-ac1c416eb8c7";
const ML_PREDICTION_URL = "https://smart-waste-pics-1.onrender.com/predict";

let imageUploaded = false;
let analysisRun = false;
let imgbb = null;

if (fileInput) {
    fileInput.addEventListener("change", function (e) {
        const file = this.files[0];
        imageUploaded = false;
        analysisRun = false;
        imgbb = null;
        
        if (resultDiv) resultDiv.classList.add("hidden");
        if (detectBtn) detectBtn.classList.add("hidden");
        if (previewWrapper) previewWrapper.classList.add("hidden");
        
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = e => {
            previewImg.src = e.target.result;
            previewWrapper.classList.remove("hidden");
            detectBtn.classList.remove("hidden");
            imageUploaded = true;
        };
        
        reader.onerror = () => {
            alert("Error reading file. Please try again.");
        };
        
        reader.readAsDataURL(file);
    });
}

async function predictWaste() {
    const file = fileInput.files[0];
    if (!file) return;

    wasteTypeField.textContent = "Waste type: Detecting...";
    recommendationField.textContent = "Recommended disposal: Processing...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(ML_PREDICTION_URL, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        const category = data.category || "Unknown";
        imgbb = data.image_url;

        let rec;
        if (category === "Biodegradable") {
            rec = "For environmentally responsible disposal, please compost this material. Place it exclusively in the organic/food waste receptacle provided by your local waste management service.";
        } else if (category === "Non-Biodegradable") {
            rec = "Please place this item in your designated general waste bin. This material is not accepted by standard municipal recycling or composting facilities.";
        } else {
            rec = "Follow local disposal guidelines. Disposal of hazardous waste can lead to serious legal consequences. Contact your local authority for more details.";
        }

        wasteTypeField.textContent = `Waste type: ${category}`;
        recommendationField.textContent = `Recommended disposal: ${rec}`;
        detectedImg.src = previewImg.src;
        analysisRun = true;

        return category;
    } catch (err) {
        wasteTypeField.textContent = "Waste type: Error";
        recommendationField.textContent = "Failed to connect to server.";
        alert("Server error. Please check your connection and try again.");
        throw err;
    }
}

if (detectBtn) {
    detectBtn.addEventListener("click", async () => {
        if (!imageUploaded) {
            alert("Please select an image first");
            return;
        }

        detectBtn.disabled = true;
        const detectText = detectBtn.querySelector('span:not(.spinner)');
        const detectSpinner = document.getElementById("spinner");
        
        if (detectText) detectText.textContent = "Analyzing...";
        if (detectSpinner) detectSpinner.classList.remove("hidden");

        if (resultDiv) resultDiv.classList.remove("hidden");
        if (detectedImg) detectedImg.src = previewImg.src;
        
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            await predictWaste();
            detectBtn.classList.add('hidden');
            setTimeout(() => autoDetectLocation(), 1200);
        } catch (e) {
            detectBtn.disabled = false;
            if (detectText) detectText.textContent = "Run AI Analysis";
            if (detectSpinner) detectSpinner.classList.add("hidden");
        }
    });
}

function autoDetectLocation() {
    if (!navigator.geolocation) {
        if (locationInput) locationInput.value = "Geolocation not supported";
        return;
    }
    
    if (locationInput) {
        locationInput.readOnly = true;
        locationInput.style.backgroundColor = "#f1f3f4";
        locationInput.value = "Detecting location...please wait!";
    }
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            const addr = data.address;
            const parts = [];
            
            if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
            if (addr.road) parts.push(addr.road);
            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
            if (addr.state) parts.push(addr.state);
            
            if (locationInput) {
                locationInput.value = parts.length > 0 ? parts.join(", ") : data.display_name || `${lat}, ${lon}`;
            }
        } catch (e) {
            if (locationInput) locationInput.value = `${lat}, ${lon}`;
        }
    }, (err) => {
        if (locationInput) locationInput.value = "Location access denied.";
    }, { enableHighAccuracy: true });
}

if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
        if (!nameInput.value || !emailInput.value || !phoneInput.value || !locationInput.value || !wasteDescInput.value) {
            alert("Please fill all fields.");
            return;
        }

        submitBtn.disabled = true;
        if (submitText) submitText.textContent = "Submitting...";
        if (submitSpinner) submitSpinner.classList.remove("hidden");

        const submissionFormData = new FormData();
        submissionFormData.append('name', nameInput.value);
        submissionFormData.append('email', emailInput.value);
        submissionFormData.append('phone', phoneInput.value);
        submissionFormData.append('location', locationInput.value);
        submissionFormData.append('wasteType', wasteTypeField.textContent.replace("Waste type: ", ""));
        submissionFormData.append('wasteDescription', wasteDescInput.value);
        submissionFormData.append('image', imgbb);

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                body: submissionFormData
            });

            if (response.ok) {
                const newReport = {
                    id: Math.floor(1000 + Math.random() * 9000),
                    userEmail: emailInput.value.trim(),
                    wasteType: wasteTypeField.textContent.replace("Waste type: ", ""),
                    location: locationInput.value,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    image: previewImg.src,
                    status: 'Dispatched'
                };
                
                const existingReports = JSON.parse(localStorage.getItem("reports")) || [];
                existingReports.unshift(newReport);
                localStorage.setItem("reports", JSON.stringify(existingReports));

                if (socket) {
                    socket.emit("announce_report_to_admin", newReport);
                }

                alert("Report successfully dispatched and saved!");
                submitBtn.style.display = "none";
                if (warning) warning.textContent = '';
            } else {
                alert("Failed to submit data.");
                resetSubmitButton();
            }
        } catch (error) {
            alert("Network error.");
            resetSubmitButton();
        }
    });
}

function resetSubmitButton() {
    submitBtn.disabled = false;
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitText) {
        submitText.innerHTML = `<i class="fas fa-paper-plane"></i> Dispatch Report to BMC`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const trackEmailBtn = document.getElementById("search-btn");
    const trackEmailInput = document.getElementById("track-email");
    const resultsSection = document.getElementById('results-section');
    const historyList = document.getElementById('history-list');
    const emptyState = document.getElementById('empty-state');
    const messageDiv = document.getElementById('message');
    const token = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');

    const savedName = localStorage.getItem("username");
    if (savedName && nameInput) { 
        nameInput.value = savedName; 
        nameInput.readOnly = true; 
    }
    if (storedEmail && emailInput) { 
        emailInput.value = storedEmail; 
        emailInput.readOnly = true; 
    }

    window.loadHistory = function (email) {
        const user_email = email.trim().toLowerCase();
        const rawData = localStorage.getItem('reports');
        const reports = rawData ? JSON.parse(rawData) : [];

        const filteredReports = reports.filter(report =>
            report.userEmail && report.userEmail.toLowerCase() === user_email
        );

        if (filteredReports.length === 0) {
            if (resultsSection) resultsSection.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (resultsSection) resultsSection.classList.remove('hidden');

            if (historyList) {
                historyList.innerHTML = filteredReports.map(report => {
                    const statusText = report.status || 'Dispatched';
                    const statusClass = statusText === 'Success' ? 'status-success' : 'status-dispatched';
                    
                    const chatButton = statusText !== 'Success' ? `
                        <button class="chat-btn" onclick="startChat('${report.id}')">
                            <i class="fas fa-comments"></i> Chat with Admin
                        </button>
                    ` : `
                        <p style="color: #34a853; font-size: 13px; margin-top: 8px;">
                            <i class="fas fa-check-circle"></i> Resolved
                        </p>
                    `;

                    return `
                    <div class="complaint-card">
                        <img src="${report.image}" class="complaint-thumb" alt="Waste">
                        <div class="complaint-info">
                            <h3>${report.wasteType}</h3>
                            <p><i class="fas fa-map-marker-alt"></i> ${report.location}</p>
                            <p><i class="far fa-calendar-alt"></i> ${report.date} • ID: #W-${report.id}</p>
                            ${chatButton}
                        </div>
                        <div class="status-badge ${statusClass}">${statusText}</div>
                    </div>
                    `;
                }).join('');
            }

            if (socket) {
                filteredReports.filter(r => r.status !== 'Success').forEach(report => {
                    socket.emit("announce_report_to_admin", report);
                });
            }
        }
    };

    if (storedEmail && token && trackEmailInput) {
        trackEmailInput.value = storedEmail;
        trackEmailInput.disabled = true;
        if (messageDiv) {
            messageDiv.innerHTML = `
                <p style="text-align: center; color: var(--google-blue); font-size: 13px;">
                    <i class="fas fa-user-check"></i> Viewing history for: <strong>${storedEmail}</strong>
                </p>`;
        }
        loadHistory(storedEmail);
    } else if (trackEmailInput) {
        trackEmailInput.disabled = false;
        if (messageDiv) {
            messageDiv.innerHTML = `
                <p style="text-align: center; color: #ea4335; font-size: 13px;">
                    <i class="fas fa-exclamation-circle"></i> Please <a href="register.html" style="color: var(--google-blue); text-decoration: underline;">login</a> to view history
                </p>`;
        }
    }

    if (trackEmailBtn) {
        trackEmailBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const email = trackEmailInput.value.trim();
            if (!email) {
                alert("Please enter an email address");
                return;
            }
            loadHistory(email);
        });
        
        trackEmailInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") trackEmailBtn.click();
        });
    }

    if (socket) {
        socket.on('status_changed', (data) => {
            let reports = JSON.parse(localStorage.getItem('reports')) || [];
            const index = reports.findIndex(r => r.id == data.reportId);

            if (index !== -1) {
                reports[index].status = 'Success';
                localStorage.setItem('reports', JSON.stringify(reports));

                const currentEmail = localStorage.getItem('email');
                if (currentEmail) loadHistory(currentEmail);
                alert(`Report #${data.reportId} has been successfully cleared!`);
            }
        });

        socket.on('receive_message', (data) => {
            if (data.reportId == activeChatId && data.sender !== "User") {
                appendMessage(data.sender, data.text);
            }
        });
    }
});

let activeChatId = null;

function startChat(reportId) {
    activeChatId = reportId;
    
    const chatPopup = document.getElementById("chat-popup");
    const chatHeader = document.getElementById("chat-header-id");
    const chatContainer = document.getElementById("chat-messages-container");
    
    if (chatPopup) chatPopup.classList.remove("hidden");
    if (chatHeader) chatHeader.innerText = "Chat for ID: #W-" + reportId;
    if (chatContainer) chatContainer.innerHTML = "";

    if (socket) {
        socket.emit("join_report_chat", reportId);
    }
}

function closeChat() {
    const chatPopup = document.getElementById("chat-popup");
    if (chatPopup) chatPopup.classList.add("hidden");
    activeChatId = null;
}

function sendChatMessage() {
    const input = document.getElementById("chat-input");
    if (!input) return;
    
    const text = input.value.trim();
    if (text && activeChatId) {
        appendMessage("You", text);
        
        if (socket) {
            socket.emit("send_message", {
                reportId: activeChatId,
                text: text,
                sender: "User"
            });
        }
        
        input.value = "";
    }
}

function appendMessage(sender, text) {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;
    
    const msgDiv = document.createElement("div");
    msgDiv.style.marginBottom = "8px";
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}