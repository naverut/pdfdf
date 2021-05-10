/**
 * 指定キャンバスの(0,0)からのマウス位置を取得
 */
function getMousePosition(element, evt) {
    // ウィンドウ枠内の位置
	var rect = element.getBoundingClientRect();
	var rx = Math.floor(evt.clientX - rect.left);
	var ry = Math.floor(evt.clientY - rect.top);

    // elementサイズ（最大値）
	var mx = element.getAttribute("width");
	var my = element.getAttribute("height");

	return {
		x: rx > 0 ? (rx>mx?mx:rx):0
	,	y: ry > 0 ? (ry>my?my:ry):0
	};
}

/**
 * 2点の矩形を取得
 */
function getRect(posA, posB) {
	var sx = Math.min(posA.x, posB.x);
	var sy = Math.min(posA.y, posB.y);
	var lx = Math.max(posA.x, posB.x);
	var ly = Math.max(posA.y, posB.y);

	return {
		x:sx
	,	y:sy
	,	width:lx-sx
	,	height:ly-sy
	};
}

/**
 * 指定contextに矩形を描画
 */
function drawRect(canvas, rect) {
	const context = canvas.getContext("2d");
	context.strokeRect(rect.x, rect.y, rect.width, rect.height);
}
/**
 * 指定contextのクリア
 */
function clearRect(canvas) {
	const context = canvas.getContext("2d");
	var width = canvas.getAttribute("width");
	var height = canvas.getAttribute("height");
	context.clearRect(0, 0, width, height);
}


/**
 * 矩形を親ウィンドウに追加
 */
function addRectToOpener(startPos, endPos) {
	const rect = getRect(startPos, endPos);
	const added = window.opener.addRect(rect);

	if (!added) {
		return;
	}
}



/** 矩形描画時の開始Position */
var startPos = null;
/** 矩形描画時の終了Position */
var endPos = null;
/** マウスが画面内にいるかどうか */
var isOver = false;
$(function(){
    /**
     * 画像上にマウスがあるか判定
     */
    $('#cell-top').hover(
        function() {
            isOver = true;
        }
    ,   function () {
            isOver = false;
        }
    );

    /**
     * マウスの押下イベント(mouse down-upは枠外も判定対象とする)
     */
    $(window).mousedown(function(evt) {
        // 枠内での左クリックは無視
        if (evt.button != 0 && isOver) {
            return false;
        }
        // マウス位置取得
        const canvasDraw = document.getElementById("canvas-draw");
        var mousePos = getMousePosition(canvasDraw, evt);

        // ウィンドウ内の場合のみ開始位置を保存
        if (isOver) {
            startPos = mousePos;
        }
    });
    /**
     * マウスの押上イベント(mouse down-upは枠外も判定対象とする)
     */
    $(window).mouseup(function(evt) {
        // 枠内での左クリックは無視
        if (evt.button != 0 && isOver) {
            return false;
        }
        // マウス位置取得
        const canvasDraw = document.getElementById("canvas-draw");
        var mousePos = getMousePosition(canvasDraw, evt);

        // 開始位置がある（ウィンドウ内で押下している）場合に矩形を保存
        if (startPos) {
            addRectToOpener(startPos, mousePos);
            startPos = null;
        }

        // 矩形を保存したので矩形等をクリア
        endPos = null;
        clearRect(canvasDraw);
    });
    /**
     * マウス移動イベント：矩形を描画中の表現
     */
    $(window).mousemove(function(evt) {
        // マウス押下済みの場合のみ
        if (startPos) {
            const canvasDraw = document.getElementById("canvas-draw");

            // マウス移動時に以前の描画をクリア（[クリア⇒描画]⇒[クリア描画⇒描画]...で表現）
            if (endPos) {
                clearRect(canvasDraw);
            }

            // 終了位置を保持し、矩形を描画
            endPos = getMousePosition(canvasDraw, evt);
            var rect = getRect(startPos, endPos);
            drawRect(canvasDraw, rect);
        }
    });
});
