document.addEventListener("DOMContentLoaded", () => {

    const hamburger = document.getElementById("hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            hamburger.classList.toggle("active");
        });
    }

    const token = localStorage.getItem("token");
    const username = localStorage.getItem('username');  

    const loginBtn = document.getElementById("lgr");
    const userNameLi = document.getElementById("user-name");
    const logoutBtn = document.getElementById("logout-btn");
    const aiDetectionLink = document.getElementById("ai-detection");
    const goToDetectionBtn = document.querySelector(".hero .btn");

    function updateUI(isLoggedIn) {
        if (isLoggedIn) {
            loginBtn.style.display = "none";
            userNameLi.style.display = "flex";
            userNameLi.querySelector("span").textContent = `Hi, ${username}`;  
            aiDetectionLink.style.display = "inline-block";
            if (goToDetectionBtn) goToDetectionBtn.style.display = "inline-block";
        } else {
            loginBtn.style.display = "inline-block";
            userNameLi.style.display = "none";
            aiDetectionLink.style.display = "none";
            if (goToDetectionBtn) goToDetectionBtn.style.display = "none";
        }
    }

    const isLoggedIn = !!(token && username);  
    updateUI(isLoggedIn);

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("email");
            localStorage.removeItem("phone");
            window.location.href = "index.html";
        });
    }

    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "detection.html" && !isLoggedIn) {
        alert("Please login to access AI Detection");
        window.location.href = "register.html";
    }
});

window.addEventListener("storage", (e) => {
    if (e.key === "token" || e.key === "username") {  
        location.reload();
    }
});