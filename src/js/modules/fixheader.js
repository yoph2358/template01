// src/js/modules/fixheader.js
export function initFixHeader() {
  const contentHeader = document.querySelector("#contentHeader");
  const pageTop = document.querySelector(".pageTop");

  // 対象がなければ何もしない
  if (!contentHeader || !pageTop) return;

  // pageTopのドキュメント上での位置を取得
  let pageTopOffset = pageTop.getBoundingClientRect().top + window.pageYOffset;

  // スクロール時の処理
  const onScroll = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // pageTopが画面上端に「触れた」以上に下がったら固定
    if (scrollY >= pageTopOffset) {
      contentHeader.classList.add("is-fixed");
    } else {
      // pageTopより上に行こうとしたら外す
      contentHeader.classList.remove("is-fixed");
    }
  };

  // ウィンドウサイズが変わると位置がずれる可能性があるので再計算
  const onResize = () => {
    pageTopOffset = pageTop.getBoundingClientRect().top + window.pageYOffset;
    onScroll(); // 再計算後に状態を反映
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  // 初期表示時にも一度判定
  onScroll();
}
