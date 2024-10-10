const axios = require("axios");

const publicVapidKey =
  'BO64nFLjYDrOH1GvwXftIEEroUpihOost6Rcutdw1O-rqTDIFgS2sZwNTApxSAYFZ_JaIeS2Ul75qXhuhhzq3ao';


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
      url: "https://themehers.in/login",
      data: {
        email,
        password,
      },
      httpOnly: true,
    });
    console.log(res.data);

    if (res.data.status === "success") {
      showAlert("success", "login successful");

      if ("serviceWorker" in navigator) {
        console.log("service worker");
        send().catch((err) => {
          console.log(err);
        });
      }

      async function send() {
        console.log("registration of service worker---------");
        const register = await navigator.serviceWorker.register("/sw.js");
        console.log("register sw...");

        // register push
        console.log("registering push...");
        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicVapidKey,
        });
        console.log(subscription);
        console.log("push registered...");

        // send push
        console.log("sending push...");
        await fetch("/subscribe", {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: {
            "content-type": "application/json",
          },
        });
        console.log("push send....");
      }



      // if (res.data.user.role === "admin") {
      //   console.log(res.data.user);
      //   window.setTimeout(() => {
      //     location.assign("/admin");
      //   }, 5000);
      // }


      // window.setTimeout(() => {
      //   location.assign("/");
      // }, 5000);
    }

    console.log("called");
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};
exports.signup = async (name, email, password, confirmpassword) => {
  try {
    const res = await axios({
      method: "POST",
      url: "https://themehers.in/signup",
      data: {
        name,
        email,
        password,
        confirmpassword,
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
      url: "https://themehers.in/forgot",
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
      url: `https://themehers.in/email`,
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

exports.updateUser = async (formdata) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "https://themehers.in/user",
      data: formdata,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(res.data);

    if (res.data.status === "success") {
      showAlert("success", res.data.message);
      window.setTimeout(() => {
        location.assign("/me");
      }, 500);
    }

    console.log("called");
  } catch (err) {
    showAlert("err", err.response.data.message);
    console.log(err.response);
  }
};
