const navbar = document.querySelector(".navbar");

function toggleFun() {
  navbar.classList.toggle("navslide");
}

const sideSpan = document.querySelectorAll(".side-name");
console.log(sideSpan);

function sideToggle() {
  sideSpan.forEach((el) => {
    el.classList.toggle("side-active");
  });
  console.log("called");
}

// testing
function testing(x) {
  return console.log(`clicked div no ${x}`);
}
const hero = document.querySelector(".hero");
if (hero) {
  let heroheight = hero.offsetWidth * 0.5;
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
