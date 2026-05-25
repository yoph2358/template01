import $ from "jquery";
import "slick-carousel";
import { gsap } from "gsap";

// スライダー共通アニメ付き初期化
function initSlickWithAnim({
  rootSelector,
  animateSelector = ".flow-mask, .slidefadein, .opacityIn, .fadein, .shaking, .powawan",
  liSelector = null,
  slickOptions = {},
  triggerOnceSelector = null,
  triggerStart = "top 80%",
}) {
  const $roots = $(rootSelector);
  if (!$roots.length) return;

  const timings = {
    slickFade: 2000,
    liStagger: 300,
  };

  const queueRefresh = () => {
    ScrollTrigger.refresh();
  };

  $roots.each(function () {
    const $slider = $(this);

    $slider.slick({
      autoplay: false,
      dots: false,
      arrows: true,
      fade: true,
      infinite: true,
      ...slickOptions,
    });

    $slider.on("setPosition", queueRefresh);

    const resetTimers = {};
    const clearResetTimer = (idx) => {
      if (resetTimers[idx]) {
        clearTimeout(resetTimers[idx]);
        delete resetTimers[idx];
      }
    };

    const animateActiveSlide = () => {
      const $active = $slider.find(".slick-active");
      if (!$active.length) return;

      $active.find(animateSelector).addClass("is-animated");

      if (liSelector) {
        $active.find(liSelector).each(function (i) {
          setTimeout(() => this.classList.add("is-animated"), timings.liStagger * i);
        });
      }
    };

    if (triggerOnceSelector) {
      ScrollTrigger.create({
        trigger: triggerOnceSelector === "self" ? $slider[0] : triggerOnceSelector,
        start: triggerStart,
        once: true,
        onEnter: () => {
          animateActiveSlide();
          queueRefresh();
        },
      });
    } else {
      animateActiveSlide();
    }

    $slider.on("beforeChange", (e, slick, current, next) => {
      clearResetTimer(next);
      clearResetTimer(current);
      const $currentSlide = $(slick.$slides.get(current));
      resetTimers[current] = setTimeout(() => {
        const sel = liSelector ? `${animateSelector}, ${liSelector}` : animateSelector;
        $currentSlide.find(sel).removeClass("is-animated");
        delete resetTimers[current];
      }, timings.slickFade);
    });

    $slider.on("afterChange", (e, slick, current) => {
      clearResetTimer(current);
      animateActiveSlide();
      queueRefresh();
    });
  });
}

export function initSlick() {
  const $contentsSliders = $(".l-contents__slider");
  $contentsSliders.each(function () {
    const $slider = $(this);
    if ($slider.hasClass("slick-initialized")) return;

    $slider.slick({
      dots: true,
      arrows: true,
      infinite: true,
      autoplay: false,
      autoplaySpeed: 3000,

    });
  });
}
