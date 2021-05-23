/**
 * 画像の大きさに合わせて画面サイズを変える
 * （親で画像を選択した際、画像サイズが変わることを考慮）
 */
function resizeWindow(width, height) {
    // canvas-wrap内のサイズをそろえる
	$.each($('.canvas-cell'), function(idx, elm) {
		elm.setAttribute("width", width);
		elm.setAttribute("height", height);
	});

    // 枠等考慮して大き目にresize
	window.resizeTo(Number(width) + 50, Number(height) + 50);
}

/**
 * ウィンドウ表示時にcanvas反映
 */
function initLoad() {
	const kbn = queryStrings["kbn"];
	const no = queryStrings["no"];

    // 親のcanvasを取得描画
    var parentCanvasImage = window.opener.getCanvas(kbn, no, "image");
    var parentCanvasLight = window.opener.getCanvas(kbn, no, "light");
    var parentCanvasRect  = window.opener.getCanvas(kbn, no, "rect");

    var imgImage = $('#img-image').get(0);
    var imgLight = $('#img-light').get(0);
    var imgRect  = $('#img-rect').get(0);
    if (parentCanvasImage) {
        imgImage.src = parentCanvasImage.toDataURL();
    }
    if (parentCanvasLight) {
        imgLight.src = parentCanvasLight.toDataURL();
    }
    if (parentCanvasRect) {
        imgRect.src = parentCanvasRect.toDataURL();
    }

    var imageCheck = $(window.opener.document.getElementById("image-toggle")).prop("checked");
    if (imageCheck) {
        $('#img-image').hide();
    } else {
        $('#img-image').show();
    }
    var lightCheck = $(window.opener.document.getElementById("light-toggle")).prop("checked");
    if (lightCheck) {
        $('#img-light').hide();
    } else {
        $('#img-light').show();
    }
    var rectCheck = $(window.opener.document.getElementById("rect-toggle")).prop("checked");
    if (rectCheck) {
        $('#img-rect').hide();
    } else {
        $('#img-rect').show();
    }

    // ウィンドウサイズを画像サイズに合わせる
    imgImage.onload = function() {
        resizeWindow(imgImage.naturalWidth, imgImage.naturalHeight);
    }
}

/** key毎のURLパラメータ */
var queryStrings;
/**
 * URLパラメータをkey毎にqueryStringsに設定する
 */
function getQueryStrings() {
    if (1 < document.location.search.length) {
        // 最初の1文字 (?記号) を除いた文字列を取得する
        var query = document.location.search.substring(1);

        // クエリの区切り記号 (&) で文字列を配列に分割する
        var parameters = query.split('&');

        var result = new Object();
        for (var i = 0; i < parameters.length; i++) {
            // パラメータ名とパラメータ値に分割する
            var element = parameters[i].split('=');

            var paramName = decodeURIComponent(element[0]);
            var paramValue = decodeURIComponent(element[1]);

            // パラメータ名をキーとして連想配列に追加する
            result[paramName] = decodeURIComponent(paramValue);
        }
        return result;
    }
    return null;
}

$(function(){
    // URLパラメータを分解保持
	queryStrings = getQueryStrings();

	// 初期表示
	initLoad();
});
