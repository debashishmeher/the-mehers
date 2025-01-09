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
    
    try {
      const res = await axios({
        method: "POST",
        url: `https://themehers.in/enquary/${enquaryid}/schedule`,
        data: formdata,
        httpOnly: true,
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/enquary/${enquaryid}`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };

  // create product
exports.createProduct = async (formdata) => {
    
    try {
      const res = await axios({
        method: "POST",
        url: `https://themehers.in/product`,
        data: formdata,
        httpOnly: true,
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/products`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };
exports.editProduct = async (productid,formdata) => {
    console.log(formdata);
    try {
      const res = await axios({
        method: "PATCH",
        url: `https://themehers.in/product/${productid}`,
        data:formdata,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/product/${productid}`);
        }, 1000);
        console.log(res.data);
        
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };

exports.deleteProduct = async (productid) => {

    try {
      const res = await axios({
        method: "DELETE",
        url: `https://themehers.in/product/${productid}`
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/product`);
        }, 1000);
        
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
    }
  };

  // create blogs------------------------------------
exports.createBlogs = async (formdata) => {
    
    try {
      const res = await axios({
        method: "POST",
        url: `https://themehers.in/blogs`,
        data: formdata,
        httpOnly: true,
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/blogs`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };

exports.editBlogs = async (blogsid,formdata) => {  
    try {
      const res = await axios({
        method: "PATCH",
        url: `https://themehers.in/blogs/${blogsid}/admin`,
        data: formdata,
        httpOnly: true,
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/blogs`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };

exports.deleteBlogs = async (blogsid) => {  
  console.log(blogsid);
  
    try {
      const res = await axios({
        method: "DELETE",
        url: `https://themehers.in/blogs/${blogsid}/admin`,
        httpOnly: true,
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/blogs`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
    }
  };

  // enquary-------------------------
exports.createEnquary = async (formdata) => {
    
    try {
      const res = await axios({
        method: "POST",
        url: `https://themehers.in/enquary`,
        data: formdata,
        httpOnly: true,
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };

  // offline sell-------------------------
exports.offlineSell = async (productid,formdata) => {
    
    try {
      const res = await axios({
        method: "POST",
        url: `https://themehers.in/admin/product/${productid}/sell`,
        data: formdata,
        httpOnly: true,
      });
  
      if (res.data.status === "success") {
        showAlert("success", res.data.message);
        window.setTimeout(() => {
          location.assign(`/admin/products`);
        }, 1000);
      }
    } catch (err) {
      showAlert("err", err.response.data.message);
      console.log(err.response);
    }
  };

