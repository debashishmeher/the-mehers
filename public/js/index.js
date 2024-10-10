import {
  forgot,
  login,
  signup,
  resetpassword,
  getEmail,
  updateUser,
} from "./login.js";
import { scheduleenquary, createProduct,createBlogs,createEnquary,offlineSell } from "./admin.js";
import { addtocart,updateCartItem,deleteToCart,address,buying } from "./product.js";
const loginbtn = document.getElementById("login");
const signupbtn = document.getElementById("signup");
const forgotbtn = document.getElementById("forgot");
const resetPassBtn = document.getElementById("passwordReset");
const getUpdateBtn = document.getElementById("getUpdate");
const userDatabtn = document.getElementById("user-data");

// admin action ------------------------------
const scheduleForm = document.getElementById("scheduleForm");
const productCreate = document.getElementById("create-product");
const blogCreate = document.getElementById("create-blogs");
const offlineSellForm = document.getElementById("offline-sell");

// general action-------------------------------
const addtocartBtn=document.getElementById("addtocart")
const addressBtn=document.getElementById("user-address")
const cartquantity=document.querySelectorAll(".cartquantity")
const deleteitem =document.querySelectorAll(".delete-product")
const checkoutBtn=document.getElementById("order-details")
const enquaryForm=document.getElementById("enquary")


function getFilledData(formId) {
  const form = document.getElementById(formId);
  let filledData = {};

  for (let i = 0; i < form.elements.length; i++) {
    let elements = form.elements[i];
    let name;
    let value;
    console.log(elements.type);

    if (elements.type === "file") {
      name = elements.name;
      if(elements.files.length==1){
        value = elements.files[0];
      }
      if(elements.files.length>1){
        // value=[]
        for (let i = 0; i < elements.files.length; i++) {
          const el = elements.files[i];
          // name=elements.name
          // value.push(el)
          value = el;
        }
      }
    } 
  
    else if (elements.type === "radio") {
      const selectedRadio = document.querySelector(
        `input[name="${elements.name}"]:checked`
      );
      name = elements.name;
      value = selectedRadio.value;
    } else if (elements.type === "select-one") {
      const selectElement = document.querySelector(
        `select[name="${elements.name}"]`
      );

      name = elements.name;
      value = selectElement.value;
    } else {
      name = elements.name;
      value = elements.value;
    }

    if (name && value) {
      filledData[name] = value;
    }
  }
  console.log(filledData);
  
  return filledData;
}

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
    const confirmpassword = document.getElementById(
      "signup-confirmpassword"
    ).value;
    signup(name, email, password, confirmpassword);
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

if (userDatabtn) {
  userDatabtn.addEventListener("submit", (e) => {
    e.preventDefault();
    let formData = getFilledData("user-data");
    updateUser(formData);
  });
}

// admin actions----------------------------
if (scheduleForm) {
  scheduleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const enquaryid = scheduleForm.dataset.enquaryId;
    const formdata = getFilledData("scheduleForm");
    scheduleenquary(enquaryid, formdata);
  });
}
if (productCreate) {
  productCreate.addEventListener("submit", (e) => {
    e.preventDefault();
    // const formdata = getFilledData("create-product");
    const formdata = new FormData(productCreate);
    createProduct(formdata);
  });
}
if (blogCreate) {
  blogCreate.addEventListener("submit", (e) => {
    e.preventDefault();
    const formdata = getFilledData("create-blogs");
    createBlogs(formdata);
  });
}

// general action-----------------------
if (addtocartBtn) {
  addtocartBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const productid=addtocartBtn.dataset.productid
    const quantity=document.getElementById("product-quantity").value
    addtocart(productid,quantity);
  });
}

if(cartquantity){
  
  const incqun =document.querySelectorAll(".incqun")
    for (let i = 0; i < incqun.length; i++) {
      const el = incqun[i];
        el.addEventListener("click",(e)=>{
          e.preventDefault();
        const itemid=el.dataset.itemid;
        let formdata={}
        formdata.quantity=cartquantity[i].value*1 + 1
          console.log(itemid,formdata);
        updateCartItem(itemid,formdata)
      })
    }
  const decqun =document.querySelectorAll(".decqun")
    for (let i = 0; i < decqun.length; i++) {
      const el = decqun[i];
        el.addEventListener("click",(e)=>{
          e.preventDefault();
        const itemid=el.dataset.itemid;
        let formdata={}
        formdata.quantity=cartquantity[i].value*1 - 1
          console.log(itemid,formdata);
        updateCartItem(itemid,formdata)
      })
    }
  for (let i = 0; i < cartquantity.length; i++) {
    const el = cartquantity[i];
      el.addEventListener("change",(e)=>{
        e.preventDefault();
      const itemid=el.dataset.itemid;
      let formdata={}
      formdata.quantity=el.value
        console.log(itemid,formdata);
      updateCartItem(itemid,formdata)
    })
  }
}

if(deleteitem){
  for (let i = 0; i < deleteitem.length; i++) {
    const el = deleteitem[i];
      el.addEventListener("click",(e)=>{
        e.preventDefault();
      const cartitem=el.dataset.cartitem;

      deleteToCart(cartitem)
    })
  }
}


// checkout----------------------------
if (addressBtn) {
  addressBtn.addEventListener("submit", (e) => {
    e.preventDefault();
    let formData=getFilledData("user-address")
    address(formData)
  });
}

if(checkoutBtn){
  checkoutBtn.addEventListener("submit", (e) => {
    e.preventDefault();
    let formData=getFilledData("order-details")
      buying(formData)
    console.log("payment initiate");
  });
}

// /enquary post
if(enquaryForm){
 enquaryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let formData=getFilledData("enquary")
    createEnquary(formData)
  });
}

// offline selling
if(offlineSellForm){
offlineSellForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let formData=getFilledData("offline-sell")
    const productid=offlineSellForm.dataset.productid;
    offlineSell(productid,formData)
  });
}