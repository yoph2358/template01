// src/js/modules/iframeAutoHeight.js
import $ from "jquery";

export function initIframeAutoHeight() {
  $(window).on("message", function (e) {
    $(function () {
      if ($("#goodsmenuframe").length !== 0) {
        $("#goodsmenuframe iframe").css({
          height: e.originalEvent.data + 4 + "px",
          border: "none",
        });
      }
    });
  });
}
