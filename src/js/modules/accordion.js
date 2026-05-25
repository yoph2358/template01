// src/js/modules/accordion.js
import $ from "jquery";

export function initAccordion() {
  const ROOT = ".accordion";
  const ITEM = ".accordion-item";
  const HEADER = ".accordion-item__header";
  const CONTENT = ".accordion-item__content";

  // 初期状態：headerにis-openがあれば展開、なければ閉じる
  $(ROOT)
    .find(ITEM)
    .each(function () {
      const $item = $(this);
      const $header = $item.children(HEADER);
      const $content = $item.children(CONTENT);
      const open = $header.hasClass("is-open");
      $content.css("max-height", open ? $content.prop("scrollHeight") + "px" : 0);
    });

  // クリックで開閉（クラス付与はheader側）
  $(ROOT).on("click", HEADER, function () {
    const $header = $(this);
    const $item = $header.closest(ITEM);
    const $content = $item.children(CONTENT);

    if ($header.hasClass("is-open")) {
      $content.css("max-height", 0);
      $header.removeClass("is-open");
    } else {
      $content.css("max-height", $content.prop("scrollHeight") + "px");
      $header.addClass("is-open");
    }
  });
}
