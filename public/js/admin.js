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

exports.scheduleenquary = async (enquaryid,formdata) => {
    console.log(enquaryid,formdata);
    
    try {
      const res = await axios({
        method: "POST",
        url: `http://localhost:8000/admin/${enquaryid}/schedule`,
        data: formdata,
        httpOnly: true,
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/${enquaryid}`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };