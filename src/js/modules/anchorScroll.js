// /src/js/modules/anchorScroll.js
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import $ from "jquery";

gsap.registerPlugin(ScrollToPlugin);

/**
 * アンカーリンク スムーススクロール初期化
 * @param {Object} options - 設定オプション
 * @param {number} options.offset - 固定ヘッダーなどの高さ分ずらす値 (px)
 * @param {number} options.duration - スクロール時間 (秒)
 * @param {string} options.ease - イージング (例: 'power2.inOut')
 */
export const initAnchorScroll = ({ offset = 0, duration = 1, ease = "power4.out" } = {}) => {
  // ページロード時にハッシュがある場合の処理
  $(window).on("load", function () {
    const hash = window.location.hash;
    if (hash && $(hash).length) {
      // ブラウザ標準のスクロール復元を無効化（ガタつき防止）
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }

      gsap.to(window, {
        duration: 0, // ロード時は瞬時に移動
        scrollTo: {
          y: hash,
          offsetY: offset, // 引数のoffsetを使用
        },
      });
    }
  });

  // hrefが#から始まるリンクをクリックした時の処理
  $('a[href^="#"]').on("click", function (e) {
    const href = $(this).attr("href");

    // hrefが '#' または空の場合は処理しない（またはトップへ戻る挙動にする）
    const target = href === "#" || href === "" ? "html" : href;

    // ターゲット要素が存在するか確認
    if ($(target).length) {
      e.preventDefault();

      gsap.to(window, {
        duration: duration,
        ease: ease,
        scrollTo: {
          y: target,
          offsetY: offset, // ヘッダーの高さなどを考慮
          autoKill: false, // ユーザーがスクロール操作したらアニメーションを中断しない設定
        },
      });
    }
  });
};
