// src/js/script.js
import $ from "jquery";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "../scss/style.scss"; // SCSS 全体をまとめてバンドル

import { initSlick } from "./modules/slick.js";
import { initAccordion } from "./modules/accordion.js";
import { setImgSize } from "./modules/setImgSize.js";
import { initIframeAutoHeight } from "./modules/iframeAutoHeight.js";
//import { fadeInAnimation } from "./modules/fadein.js";
import { initFixHeader } from "./modules/fixheader.js";
import { initHeaderMenu } from "./modules/headermenu.js";
import { initAnchorScroll } from "./modules/anchorScroll.js";
import { initSlideLine } from "./modules/slideline.js";
import { initBounce } from "./modules/bounce.js";

gsap.registerPlugin(ScrollTrigger);

$(function () {
  initSlick();
  initAccordion();
  setImgSize();
  initSlideLine();
  initBounce();
  initIframeAutoHeight();
  initFixHeader();
  //fadeInAnimation();
  initHeaderMenu();
  initAnchorScroll({
    offset: 80,
    duration: 0.8,
  });
});
