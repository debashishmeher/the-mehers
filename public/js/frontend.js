const navbar = document.querySelector(".navbar");

function toggleFun() {
  navbar.classList.toggle("navslide");
}

const sideSpan = document.querySelectorAll(".side-name");


function sideToggle() {
  sideSpan.forEach((el) => {
    el.classList.toggle("side-active");
  });

}

// let quarylocation = window.location.href.split("?")[1]
// const pagelink= document.getElementsByClassName("pagelink")
// if(pagelink){
//   console.log(quarylocation)
//   for (let i = 0; i < pagelink.length; i++) {
//     const el = pagelink[i];
//     if(quarylocation==undefined){
//       quarylocation="?"
//     }
//     else{
//       const query=quarylocation.split("&")
//       if (query.includes("page")) {
//         el.href=`${quarylocation}&page=${i+1}&limit=10` 
//       } else {
//         el.href=`${quarylocation}&page=${i+1}&limit=10` 
//       }
//     }
    
//   }
// }

function goback() {
  console.log("called");
  
  window.history.back();
}

const hero = document.querySelector(".hero");
if (hero) {
  let heroheight = hero.offsetWidth * 0.56;
  hero.style.height = `${heroheight}px`;
}

const box = document.getElementsByClassName("hero-box");
let i = 0;

if (box) {
  function xyz(i) {
    setTimeout(() => {
      box[i].classList.toggle("visible-div");
      if (i > 2) {
        i = -1;
      }
      xyz(i + 1);
    }, 4000);
    setTimeout(() => {
      box[i].classList.toggle("visible-div");
    }, 400);
  }
  xyz(i);
}


// photo upload preview

function changeuserphoto() {
  const Photo = document.querySelector("#user-photo");
  const PhotoPreview = document.querySelector(".user-data-photo");
  const [file] = Photo.files;
  if (file) {
    PhotoPreview.src = URL.createObjectURL(file);
  }
}

function changePhoto(imgurl) {
  const mainPhoto = document.getElementById("mainPhoto");
  mainPhoto.src = imgurl;
}


function productPreview(){
  const Photo = document.getElementById("mainphoto");
  const PhotoPreview = document.querySelector("#preview-img");
  const [file] = Photo.files;
  if (file) {
    PhotoPreview.src = URL.createObjectURL(file);
  }
  document.getElementById("preview-name").innerHTML= document.getElementsByName("name")[0].value
  document.getElementById("preview-purchase").innerHTML= document.getElementsByName("purchase")[0].value
  document.getElementById("preview-price").innerHTML= document.getElementsByName("price")[0].value
  document.getElementById("preview-discount").innerHTML= document.getElementsByName("discount")[0].value
  document.getElementById("preview-catagory").innerHTML= document.getElementsByName("catagory")[0].value
  document.getElementById("preview-code").innerHTML= document.getElementsByName("code")[0].value
  document.getElementById("preview-weight").innerHTML= document.getElementsByName("weight")[0].value
  document.getElementById("preview-quantity").innerHTML= document.getElementsByName("quantity")[0].value
  document.getElementById("preview-desc").innerHTML= document.getElementsByName("desc")[0].value
}

function blogsPreview(){
  const Photo = document.getElementById("image");
  const PhotoPreview = document.querySelector("#preview-img");
  const [file] = Photo.files;
  if (file) {
    PhotoPreview.src = URL.createObjectURL(file);
  }
  document.getElementById("preview-title").innerHTML= document.getElementsByName("title")[0].value
  document.getElementById("preview-blog").innerHTML= document.getElementsByName("blog")[0].value
  document.getElementById("preview-desc").innerHTML= document.getElementsByName("desc")[0].value
}

function showUserEdit(){
  const formbody=document.querySelector(".form-body");
   formbody.classList.toggle("editactive");
 };


// scrolling
const head = document.querySelector(".mainheader");

console.log(head);

let scrollPoint;

window.addEventListener("scroll", function () {
  scrollPoint = this.scrollY;
  if (scrollPoint > 50) {
    head.classList.add("sticky");
    this.setTimeout(() => {
      head.style.top = "0";
    }, 300);
  } else {
    head.classList.remove("sticky");
    this.setTimeout(() => {
      head.style.top = "0";
    }, 300);
  }
});
