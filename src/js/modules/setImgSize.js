import $ from "jquery";

export function setImgSize() {
  function applySize() {
    $("img").each(function () {
      const $img = $(this);
      const w = $img.width();
      const h = $img.height();
      $img.attr("width", w);
      $img.attr("height", h);
    });
  }

  // ページロード時
  $(window).on("load", applySize);

  // ウィンドウリサイズ時
  $(window).on("resize", applySize);
}
