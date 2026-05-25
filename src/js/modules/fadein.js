// src/js/modules/fadein.js
import $ from "jquery";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function fadeInAnimation() {
  $(".js-fadein").each(function () {
    const target = $(this);

    gsap.fromTo(
      target,
      {
        opacity: 0,
        y: 40, // 下から浮き上がる
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: target[0],
          start: "top 85%",
          toggleActions: "play none none reverse",
          // once: true, // 一度だけ発火させたいならこの1行を有効に
        },
      }
    );
  });
}
