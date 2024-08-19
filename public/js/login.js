const axios = require("axios");

const hideAlert = () => {
  const box = document.querySelector(".alert");
  if (box) {
    box.parentElement.removeChild(box);
  }
};

const showAlert = (status, message) => {
  hideAlert();
  const box = `<div class="alert alert-${status}">${message}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", box);

  window.setTimeout(hideAlert, 4000);
};

exports.login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:8000/login",
      data: {
        email,
        password,
      },
      httpOnly: true,
    });
    console.log(res.data);

    if (res.data.status === "success") {
      showAlert("success", "login successful");
      if(res.data.user.role==="admin"){
        console.log(res.data.user);
        window.setTimeout(() => {
          location.assign("/admin");
        }, 5000);
      }
      window.setTimeout(() => {
        location.assign("/");
      }, 5000);
    }

    console.log("called");
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};
exports.signup = async (name, email, password, confirmPassword) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:8000/signup",
      data: {
        name,
        email,
        password,
        confirmPassword,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "you are successfully signup");

      window.setTimeout(() => {
        location.assign("/");
      }, 500);
    }
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};
exports.forgot = async (email) => {
  console.log(email);
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:8000/forgot",
      data: {
        email,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "link send to your email please check");
    }
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};

exports.resetpassword = async (password, confirmPassword) => {
  const token = window.location.href.split("/")[4];
  console.log(token);
  try {
    const res = await axios({
      method: "patch",
      url: `http://localhost:3000/resetPassword/${token}`,
      data: {
        password,
        confirmPassword,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "password reset successful");

      window.setTimeout(() => {
        location.assign("/");
      }, 700);
    }
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};

exports.getEmail = async (email) => {
  try {
    const response = await axios({
      method: "POST",
      url: `http://localhost:8000/email`,
      data: {
        email,
      },
    });
    console.log("geting email...");
    console.log(response.data.status);
    if (response.data.status === "success") {
      showAlert("success", "email send successful");
    }
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};
