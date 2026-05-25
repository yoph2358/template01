import $ from "jquery";

/**
 * ヘッダーナビ開閉（外側クリックなし）
 * @param {Object} options
 * @param {string} options.root
 * @param {string} options.trigger
 * @param {string} options.panel
 * @param {string} options.activeClass
 * @param {boolean} options.closeOnEsc
 */
export function initHeaderMenu(options = {}) {
  const settings = {
    root: "header#contentHeader",
    trigger: ".header_navTrigger a",
    panel: ".header_navOpen",
    activeClass: "active",
    closeOnEsc: true,
    ...options,
  };

  const $roots = $(settings.root);
  if (!$roots.length) return;

  // 既存の外側クリックハンドラを確実に解除（過去の実装対策）
  $(document).off("click.headerMenu");

  $roots.each(function () {
    const $root = $(this);
    const $trigger = $root.find(settings.trigger);
    const $panel = $root.find(settings.panel);

    // 初期状態は閉じる
    $trigger.removeClass(settings.activeClass).attr("aria-expanded", "false");
    $panel.css("display", "");
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const DURATION = prefersReduced ? 0 : 200;

    const anyPanelOpen = () => $(".header_navOpen:visible").length > 0;

    const open = () => {
      $trigger.addClass(settings.activeClass).attr("aria-expanded", "true");
      $panel.stop(true, true).fadeIn(DURATION).attr("aria-hidden", "false");
      $("body").addClass("nav-open");
    };

    const close = () => {
      $trigger.removeClass(settings.activeClass).attr("aria-expanded", "false");
      $panel
        .stop(true, true)
        .fadeOut(DURATION, () => {
          if (!anyPanelOpen()) $("body").removeClass("nav-open");
        })
        .attr("aria-hidden", "true");
    };

    const toggle = () => {
      if ($trigger.hasClass(settings.activeClass)) {
        close();
      } else {
        open();
      }
    };

    // トリガークリックで開閉
    $trigger.on("click", function (e) {
      e.preventDefault();
      toggle();
    });

    // ✅ パネル内リンクをクリックしたらナビを閉じる
    $panel.find("a[href]").on("click", function () {
      // すでに閉じていたら何もしない
      if ($trigger.hasClass(settings.activeClass)) {
        close();
      }
      // ※ preventDefaultはしないので通常のリンク遷移やアンカー動作はそのまま
    });

    // ESCで閉じる
    if (settings.closeOnEsc) {
      $(document)
        .off("keydown.headerMenu")
        .on("keydown.headerMenu", function (e) {
          if (e.key === "Escape") close();
        });
    }
  });
}
