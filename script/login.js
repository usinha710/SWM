const submit_btn = document.querySelector(".auth-btn");

const adminLoginBtn = document.getElementById("admin_login");

if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
        window.location.href = "admin_login.html";
    });
}


window.addEventListener('DOMContentLoaded', () => {
    document.getElementById("mail").value = "";
    document.getElementById("password").value = "";
});

submit_btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("mail").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please fill all credentials");
        return;
    }

    submit_btn.classList.add("Loading");
    submit_btn.disabled = true;

    try {
        const response = await fetch("https://smart-waste-pics-authentication-user-new.onrender.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })  
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email || email);
            localStorage.setItem("phone", data.phone);
            alert(`Welcome ${data.username}!`);
            window.location.href = "index.html";
        } else {
            alert(data.msg || "Login failed");
            submit_btn.classList.remove("Loading");
            submit_btn.disabled = false;
        }

    } catch (err) {
        console.error("Login error:", err);
        alert("Server error");
        submit_btn.classList.remove("Loading");
        submit_btn.disabled = false;
    }
});