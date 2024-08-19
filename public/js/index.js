import { forgot, login, signup, resetpassword, getEmail } from "./login.js";
const loginbtn = document.getElementById("login");
const signupbtn = document.getElementById("signup");
const forgotbtn = document.getElementById("forgot");
const resetPassBtn = document.getElementById("passwordReset");
const getUpdateBtn = document.getElementById("getUpdate");

if (loginbtn) {
  loginbtn.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    login(email, password);
  });
}

if (signupbtn) {
  signupbtn.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById(
      "signup-confirmPassword"
    ).value;
    signup(name, email, password, confirmPassword);
  });
}

// forgot email submit
if (forgotbtn)
  forgotbtn.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value;
    forgot(email);
  });
if (resetPassBtn)
  resetPassBtn.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("newpassword").value;
    const confirmPassword = document.getElementById("newconfirmpassword").value;
    resetpassword(password, confirmPassword);
  });
if (getUpdateBtn) {
  getUpdateBtn.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("updatedEmail").value;
    getEmail(email);
  });
}
