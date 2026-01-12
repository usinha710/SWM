const sendOtpBtn = document.getElementById("send-otp-btn");
const submitBtn = document.querySelector('button[type="submit"]');
const otpBtnText = sendOtpBtn.querySelector(".btn-text");
const submitBtnText = submitBtn.querySelector(".btn-text");

const otpInput = document.getElementById("otp");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("mail");
const passwordInput = document.getElementById("password");
const ageInput = document.getElementById("age");
const phoneInput = document.getElementById("phone");

let otpVerified = false;

submitBtn.style.display = "none";


// SEND/VERIFY OTP BUTTON
sendOtpBtn.addEventListener("click", async () => {
    const phone = phoneInput.value.trim();
    const otp = otpInput.value.trim();

    // Stage 1: Send OTP
    if (otpBtnText.textContent === "Send OTP") {
        if (!phone || phone.length !== 10) {
            alert("Enter a valid 10-digit phone number");
            return;
        }

        sendOtpBtn.classList.add("Loading");
        sendOtpBtn.disabled = true;

        try {
            const response = await fetch("https://smart-waste-pics-authentication-user-new.onrender.com/api/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.msg || "Failed to send OTP");
                sendOtpBtn.classList.remove("Loading");
                sendOtpBtn.disabled = false;
                return;
            }

            otpInput.style.display = "block";
            phoneInput.disabled = true;
            otpBtnText.textContent = "Verify OTP";
            alert(`OTP sent to ${phone}`);
            sendOtpBtn.classList.remove("Loading");
            sendOtpBtn.disabled = false;

        } catch (error) {
            console.error("Error:", error);
            alert("Server error. Please try again.");
            sendOtpBtn.classList.remove("Loading");
            sendOtpBtn.disabled = false;
        }
    }
    
    // Stage 2: Verify OTP
    else if (otpBtnText.textContent === "Verify OTP") {
        if (!otp || otp.length !== 6) {
            alert("Enter the 6-digit OTP");
            return;
        }

        sendOtpBtn.classList.add("Loading");
        sendOtpBtn.disabled = true;

        try {
            const response = await fetch("https://smart-waste-pics-authentication-user-new.onrender.com/api/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.msg || "Invalid OTP");
                sendOtpBtn.classList.remove("Loading");
                sendOtpBtn.disabled = false;
                return;
            }

            otpInput.disabled = true;
            otpVerified = true;
            sendOtpBtn.style.display = "none";
            submitBtn.style.display = "block";
            alert("OTP verified successfully! Click on 'Submit'");

        } catch (error) {
            console.error("Error:", error);
            alert("Server error. Please try again.");
            sendOtpBtn.classList.remove("Loading");
            sendOtpBtn.disabled = false;
        }
    }
});

submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const age = ageInput.value.trim();
    const password = passwordInput.value.trim();

    if (!otpVerified) {
        alert("Please verify your phone number first");
        return;
    }

    if (!username || !email || !password || !age) {
        alert("Fill all fields");
        return;
    }

    if (password.length < 6) {
        alert("Password must be 6+ characters");
        return;
    }

    if (age < 12 || age > 110) {
        alert("Age must be between 12 and 110");
        return;
    }

    submitBtn.classList.add("Loading");
    submitBtn.disabled = true;

    try {
        const response = await fetch("https://smart-waste-pics-authentication-user-new.onrender.com/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, phone, age, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // If user already exists, redirect to login
            if (data.msg && data.msg.toLowerCase().includes("already exists")) {
                alert("This account already exists. Redirecting to login...");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
                return;
            }
            alert(data.msg || "Registration failed");
            submitBtn.classList.remove("Loading");
            submitBtn.disabled = false;
            return;
        }

        alert("Registration successful!");
        window.location.href = "login.html";

    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again.");
        submitBtn.classList.remove("Loading");
        submitBtn.disabled = false;
    }
});