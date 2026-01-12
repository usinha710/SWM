const admin_mail = document.getElementById("admin_mail");
const admin_password = document.getElementById("admin_password");
const admin_submit_btn = document.querySelector(".auth-btn");

window.addEventListener('DOMContentLoaded', () => {
    admin_mail.value = "";
    admin_password.value = "";
});


admin_submit_btn.addEventListener("click", (e) => {
    e.preventDefault();
    const email = admin_mail.value.trim();
    const password = admin_password.value.trim();

    if (!email || !password) {
        alert("Please fill all credentials");
        return;
    }
    validateAdminCredentials(email, password);
});

function validateAdminCredentials(email, password) {
    const adminEmail = "admintyur@smartwasteai.com"; 
    const adminPassword = "AQadmin@#123"; 
    if (email === adminEmail && password === adminPassword) {
        localStorage.setItem("role", "admin");
        localStorage.setItem("username", "BMC Admin");
        
        alert("Admin login successful!"); 
        window.location.href = "admin_dashboard.html"; 
    } else {
        alert("Invalid admin credentials");
    }
}

