/** BASE64を判定する文字列 */
const BASE64_POS = "base64,"
/**
 * fileをbase64として取得する
 */
function getFileBase64(file) {
	var deferred = new $.Deferred;

    var fr = new FileReader();
    // jsでbase64化するとmime情報が設定される。
    // "base64,"以降を素のbase64とする
    fr.onload = function(evt) {
        var base64withMime = evt.target.result;
        var pos = base64withMime.indexOf(BASE64_POS);
        if (pos < 0) {
            alert("ファイル取得失敗。やり直しをお願いします");
    		deferred.reject();
            return;
        }
        var base64 = base64withMime.substr(pos + BASE64_POS.length);
		deferred.resolve(base64);
    }
    fr.readAsDataURL(file);

	return deferred.promise();
}

/**
 * fileを素のtextとして取得する
 */
function getFileText(file) {
	var deferred = new $.Deferred;

    var fr = new FileReader();
    fr.onload = function(evt) {
        var text = evt.target.result;
		deferred.resolve(text);
    }
    fr.readAsText(file);

	return deferred.promise();
}

/**
 * PDFを取得する
 */
function getPdfImage(pdf64) {
	var deferred = new $.Deferred;

    startMakeImage(pdf64).done(function(tid) {
    	var checkDef = new $.Deferred;
    	checkDef.promise();
        var timerId = setInterval(function() {
            checkPdfImage(tid).done(function(status){
                refreshLoadingMessage("PDF画像化中：" + status.cnt + "/" + status.max);
                if (status.fin) {
                    wait = false;
                    checkDef.resolve();
                }
            }).fail(function(res) {
                checkDef.reject();
                deferred.reject();
                alert("エラー発生");
                console.log(res);
            });
        }, 500);

        checkDef.done(function() {
            downloadPdfImage(tid).done(function(image64s){
                deferred.resolve(image64s);
            });
        }).always(function() {
            clearInterval(timerId);
        });
    });

    return deferred.promise();
}

/**
 * PDFの画像イメージ作成を開始する
 */
function startMakeImage(pdf64) {
	var deferred = new $.Deferred;

	dispLoading("イメージファイル取得開始");
    params = {"pdf64" : pdf64};

    $.ajax({
        url: './pdf/image/start'
    ,   type: 'POST'
    ,   headers : { "content-type" : "application/json; charset=UTF-8" }
    ,   data : JSON.stringify(params)
    ,   dataType: 'json'
    ,   timeout: 100000 // PDFの送信なので長めに待つ
    }).done(function(result) {
        // 画像の一覧表示
		deferred.resolve(result);
    }).fail(function(result) {
        // 一覧を削除してアラート表示
        $('.pages').remove();
		deferred.reject(result);
        alert("エラー発生:");
		console.log(result);
    }).always(function() {
		removeLoading();
    });

	return deferred.promise();
}

/**
 * PDFの画像イメージをAPI取得する
 */
function checkPdfImage(tid) {
	var deferred = new $.Deferred;

    $.ajax({
        url: './pdf/image/status'
    ,   type: 'GET'
    ,   data : {tid:tid}
    ,   dataType: 'json'
    ,   timeout: 1000
    }).done(function(result) {
        deferred.resolve(result);
    }).fail(function(result) {
        // 一覧を削除してアラート表示
        deferred.reject(result);
        console.log(result);
        alert("エラー発生:");
    });
	return deferred.promise();
}

/**
 * PDFの画像イメージを取得する
 */
function downloadPdfImage(tid) {
	var deferred = new $.Deferred;

    dispLoading("ファイルダウンロード中");

    $.ajax({
        url: './pdf/image/data'
    ,   type: 'POST'
    ,   data : {tid:tid}
    ,   dataType: 'json'
    ,   timeout: 100000 // PDFの受信なので長めに待つ
    }).done(function(result) {
        deferred.resolve(result.image64s);
    }).fail(function(result) {
        // 一覧を削除してアラート表示
        deferred.reject(result);
        console.log(result);
        alert("エラー発生:");
    }).always(function() {
        removeLoading();
    });
	return deferred.promise();
}

/**
 * cssのheightをpx抜きで取得する
 */
function getCssHeight($tdTag) {
    var height = $tdTag.css('height');
    height = height.substr(0, height.length - 2); //"px"を削除
    return Math.ceil(height)
}

/**
 * 画像比較テーブルをセットアップ
 */
function setupImageTable($listTop, image64s) {
	var deferred = new $.Deferred;

    // リスト初期化
    $listTop.find('.image-tr').remove();
    // 比較結果をクリア（orgの比較対象Noをクリア）
    $('.canvas-image').attr('data-diff-no', 'X');

    // 取得した画像を取得
    viewListImages(image64s, $listTop);

    // 開いているpopupがあれば閉じる
    if(popWin && !popWin.closed) {
        popWin.close();
    }

    // PDFを両方取得したら比較開始
    var isLoaded = true;
    $.each($('.image-top'), function(cnt, elm) {
        if (!$(elm).attr('data-loaded')) {
            isLoaded = false;
            return false; // break
        }
    });
    if (isLoaded) {
        $('.file-label').css("width", MAX_WIDTH);
        $('.table-label').css("height", 0 + "px"); // より低くなることを想定

        // canvasタグ追加や高さ設定後のためsetTimeoutする
        setTimeout(function() {
            // 各テーブル内要素を表示（cell-top等add後のものがあるためtimeout内）
            $('.page-table').show();
            $('.diff-table').show();
            $('#rect-box').show();
            $('#view-control').show();
            $('.cell-top').show();

            // テーブルラベルの高さをそろえる
            var maxHeight = 0;
            $.each($('.table-label'), function(cnt, elm) {
                var height = getCssHeight($(elm));
                if (maxHeight < height) {
                    maxHeight = height;
                }
            });
            $('.table-label').css("height", maxHeight);

            viewDiff();

        	deferred.resolve();
        }, 1);
    } else {
        deferred.resolve();
    }

	return deferred.promise();
}

/**
 * 画像イメージLISTを表示する
 * @param image64List
 */
function viewListImages(image64List, $listTop) {
    var img = new Array();
    var count = 0;
    for (var idx = 0; idx < image64List.length; idx++) {
        img[idx] = new Image();

        // 画像をcanvasに描画
        img[idx].onload = function(event) {
            drawCanvas(event.target, $listTop, count++);
        };
        img[idx].src = "data:image/jpeg;base64," + image64List[idx];
    }
}

/**
 * html上のファイルをダウンロードリンクを取得する
 */
function getDownloadTag(file, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = URL.createObjectURL(new Blob([file], {type: "application/json"}));
    link.text = name;

    return link;
}

/** 最大幅 */
const MAX_WIDTH = 300;
/**
 * 画像用canvasに画像をセットする
 */
function drawCanvas(imageTag, $listTop, idx) {
     // 画像のサイズ取得
	const width = imageTag.naturalWidth;
	const height = imageTag.naturalHeight;

	// 画像は最大幅に合わせて表示する
	var cssWidth = width;
	var cssHeight = height;
	var scale = 1;
	if (width > MAX_WIDTH) {
		scale = MAX_WIDTH / width;
		cssWidth = MAX_WIDTH;
		cssHeight = Math.ceil(height * scale);
	}

    // テンプレートインサート
    var $imagePos = $listTop.find('.image-pos');
    var data = {"idx" : idx, "width" : width, "height" : height, "cssWidth" : cssWidth, "cssHeight" : cssHeight};
    var $addImage = $($('#image-tag').render(data));
    $addImage.insertBefore($imagePos);

    // 画像描画
    var $canvasImage = $addImage.find('.canvas-image');

    const context = $canvasImage.get(0).getContext("2d");
    context.drawImage(imageTag, 0, 0);
}

/**
 * 自動か判別しorgとdstの画像比較結果を表示する
 */
function viewDiff() {
    // 自動比較なしチェックがある場合は無視する
    const checked = $('#auto-toggle').prop("checked");
    if (checked) {
        return;
    }
    doDiff();
}
/**
 * orgとdstの画像比較結果を表示する
 */
function doDiff() {
    $('.page-tr').remove();
    $('.diff-tr').remove();

    var $pagePos = $('.page-pos');
    var $diffPos = $('.diff-pos');

    // orgを基準に比較を行う
    var defs = [];
    var $target = $('.image-top[data-kbn="org"]').find('.image-tr');
    var targetLen = $target.length;

    var eps = $('#eps-bar').val() / 100 * 195075; // 255^2 + 255^2 + 255^2=195075
    // 領域リスト
    var rectList = getRectList();

    refreshLoadingMessage("差分比較中");
    $.each($target, function(idx, elm) {
        var deferred = new $.Deferred;
        defs.push(deferred);

        var $orgImageTd = $(elm).find('.image-td');

        var $dstTop = $('.image-top[data-kbn="dst"]');
        var $dstImageTr = $dstTop.find('.image-tr[data-page=' + idx + ']');

        // orgに対するdstがない
        if (!$dstImageTr.get(0)) {
            deferred.resolve();
            return true; // continue;
        }

        var $dstImageTd = $dstImageTr.find('.image-td');

        // 各行の高さを最大の高さに合わせる
        var orgHeight = getCssHeight($orgImageTd);
        var dstHeight = getCssHeight($dstImageTd);
        var maxHeight = Math.max(orgHeight, dstHeight);

        // 画像tdの高さもそろえる
        $orgImageTd.css('height', maxHeight);
        $dstImageTd.css('height', maxHeight);

        var data = {"idx" : idx, "height": maxHeight};
        // ページの表示
        var $addPage = $($('#page-tag').render(data));
        $addPage.insertBefore($pagePos);

        // 差分枠(計算中)を表示
        var $diffPage = $($('#diff-tag').render(data));
        $diffPage.insertBefore($diffPos);

        // 差分文字列タグ取得
        var $diffTr = $('.diff-tr[data-page=' + idx + ']');

        // rectを取得
        var pageRectList = getPageRectList(rectList, idx);

        // 差分計算し描画。時間がかかるためローディング
        setTimeout(function() {
            // loading件数を更新
            refreshLoadingMessage("差分比較中：" + (idx + 1) + "/" + targetLen);

            calcViewDiff($orgImageTd, $dstImageTd, $diffTr, eps, pageRectList);

            deferred.resolve();
        }, 1);

        deferred.promise();
    });

    // 全差分完了後に再描画処理
    $.when.apply($, defs).done(function() {
        removeLoading();
        // 各ON/OFFが変わるので再toggle
        $('#light-toggle').change();
        $('#image-toggle').change();
        $('#rect-toggle').change();
        $('#diff-toggle').change();

        // 差分が変わるのでポップアップも再描画
        popWinReload();
    });
}

/**
 * ページ単位でのrectListを作成する
 */
function getPageRectList(rectList, page) {
    var pageRectList = [];
    for (var idx = 0; idx < rectList.length; idx++) {
        var rect = rectList[idx];

        // 全体チェックと詳細チェックからチェック有無を導き出す
        var details = rect.details;
        var checked = rect.checked;
        for (var rx = 0; rx < details.length; rx++) {
            if (details[rx] == page) {
                checked = !checked;
                break;
            }
        }

        pageRectList.push({
            id : rect.id
        ,   checked : checked
        ,   label : rect.label
        ,   x : rect.x
        ,   y : rect.y
        ,   width : rect.width
        ,   height : rect.height
        });
    }
    return pageRectList;
}

/**
 * 差分を計算し描画する
 */
function calcViewDiff($orgImageTd, $dstImageTd, $diffTr, eps, rectList) {
    // 画像の差分計算
    var orgImageCanvas = $orgImageTd.find('.canvas-image').get(0);
    var dstImageCanvas = $dstImageTd.find('.canvas-image').get(0);

    var diffResult = getDiff(orgImageCanvas, dstImageCanvas);
    var epsDiffResult = getEpsDiffResult(diffResult, eps);

    // 差分点の描画
    var orgLightCanvas = $orgImageTd.find('.canvas-light').get(0);
    var dstLightCanvas = $dstImageTd.find('.canvas-light').get(0);

    drawDiffLight(orgLightCanvas, epsDiffResult);
    drawDiffLight(dstLightCanvas, epsDiffResult);

    // 領域考慮
    var rectDiffResult = getRectDiffResult(epsDiffResult, rectList);

    // 領域描画
    var orgRectCanvas = $orgImageTd.find('.canvas-rect').get(0);
    var dstRectCanvas = $dstImageTd.find('.canvas-rect').get(0);
    drawRectList(orgRectCanvas, rectList);
    drawRectList(dstRectCanvas, rectList);

    // 差分テキスト表示
    var $diffText = $diffTr.find('.diff-result');
    $diffText.text(getDiffText(rectDiffResult));

    // 差分状態をタグ保持
    var isDiff = false;
    if (!rectDiffResult || rectDiffResult.diff) {
        isDiff = true;
    }
    $diffTr.attr('data-diff', isDiff);

    // 差分に領域名を表示
    if (rectDiffResult) {
        viewDiffRect($diffTr, rectList);
    }

    // ポップアップも再描画
    popWinReload();
}

/**
 * 差分点を描画する
 */
function drawDiffLight(diffCanvas, diffResult) {
    // 空行は何もしない
    if (!diffCanvas) {
        return;
    }

    // 差分点初期化
	const width = diffCanvas.getAttribute("width");
	const height = diffCanvas.getAttribute("height");
	var context = diffCanvas.getContext("2d");
	context.clearRect(0, 0, width, height);

    // 空行との比較や差分なしではクリアのみ
	if (!diffResult || !diffResult.diff) {
        return;
	}

    // 差分点を描画
	context.fillStyle = "rgba(255, 0, 0, 0.5)";
	context.lineWidth = 0;
	const diffPos = diffResult.diffPos;
	for (var idx = 0; idx < diffPos.length; idx++) {
        context.fillRect(diffPos[idx].x, diffPos[idx].y, 1, 1);
	}
}

/**
 * 差分をorgのindex単位で保持
 */
var diffMap = [];
/**
 * canvasの差分を取得する
 */
function getDiff(orgCanvas, dstCanvas) {
    // 空行との比較ではnullを返却
    if (!orgCanvas) {
        return null;
    }

    let result;

    const orgNo = orgCanvas.getAttribute('data-image-no');
    const orgDiffNo = orgCanvas.getAttribute('data-diff-no');

    if (!dstCanvas) {
        result = null;
        diffMap[orgNo] = result;
        return result;
    }

    const dstNo = dstCanvas.getAttribute('data-image-no');
    if (orgDiffNo == dstNo) {
        return diffMap[orgNo];
    }

	const width = orgCanvas.width;
	const height = orgCanvas.height;

    // サイズに違いがあれば比較せず返却
	if (width != dstCanvas.width
	 || height != dstCanvas.height
	) {
        result = {
			diff:true
		,	size:false
		,	diffPos:[]
		};
        diffMap[orgNo] = result;
        orgCanvas.setAttribute('data-diff-no', dstNo);
        return result;
	}

    // canvasの各ドットを比較
    const orgContext = orgCanvas.getContext("2d");
    const dstContext = dstCanvas.getContext("2d");

	var orgData = orgContext.getImageData(0, 0, width, height).data;
	var dstData = dstContext.getImageData(0, 0, width, height).data;

    // 各ドットで差分を取得
	var diffPos = [];
	var diff = false;
	var orgData = orgContext.getImageData(0, 0, width, height).data;
	for (var px = 0; px < width; px++) {
		for (var py = 0; py < height; py++) {
		    const base = (px + py * width) * 4;
			const r = base;
			const g = base + 1;
			const b = base + 2;
			const a = base + 3;

			var diff_r = orgData[r] - dstData[r];
			var diff_g = orgData[g] - dstData[g];
			var diff_b = orgData[b] - dstData[b];

			let distance = Math.pow(diff_r, 2) + Math.pow(diff_g, 2) + Math.pow(diff_b, 2);
			if (distance > 0) {
				diffPos.push({x:px, y:py, distance:distance});
				diff = true;
			}
		}
	}

    // 差分を返却
	if (diff) {
        result = {
			diff:true
		,	size:true
		,	diffPos:diffPos
		};
        diffMap[orgNo] = result;
        orgCanvas.setAttribute('data-diff-no', dstNo);
        return result;
	}

    // 同一画像を返却
    result = {
		diff:false
	,	size:true
	,	diffPos:[]
    };
    diffMap[orgNo] = result;
    orgCanvas.setAttribute('data-diff-no', dstNo);
    return result;
}

/**
 * eps考慮のdiffResultを取得する
 */
function getEpsDiffResult(diffResult, eps) {
    // 元がnull
    if (!diffResult) {
        return null;
    }

	// 元々が同じであればepsも同じ
	if (!diffResult.diff) {
		return {
			diff : false
		,	size : true
		,	diffPos : []
		}
	}
	// 画像サイズが異なればepsも異なる
	if (!diffResult.size) {
		return {
			diff : true
		,	size : false
		,	diffPos : []
		}
	}

	var diffPos = [];
	var diff = false;

	for (var idx = 0; idx < diffResult.diffPos.length; idx++) {
		if (diffResult.diffPos[idx].distance > eps) {
			diffPos.push(diffResult.diffPos[idx]);
		}
	}

	if (diffPos.length > 1) {
		return {
			diff : true
		,	size : true
		,	diffPos : diffPos
		}
	}

	return {
		diff : false
	,	size : true
	,	diffPos : []
	}
}

/**
 * rectList考慮のdiffResultを取得する
 */
function getRectDiffResult(diffResult, rectList) {
    // 元がnull
    if (!diffResult) {
        return null;
    }

	// 元々が同じであればrectDiffも同じ
	if (!diffResult.diff) {
		return {
			diff : false
		,	size : true
		,	diffPos : []
		}
	}
	// 画像サイズが異なればrectDiffも異なる
	if (!diffResult.size) {
		return {
			diff : true
		,	size : false
		,	diffPos : []
		}
	}

	var diffPos = [];
	var diff = false;

	for (var idx = 0; idx < diffResult.diffPos.length; idx++) {
        var isDiff = true;
        for (var rdx = 0; rdx < rectList.length; rdx++) {
            if (rectList[rdx].checked
             && (rectList[rdx].x <= diffResult.diffPos[idx].x && diffResult.diffPos[idx].x <= rectList[rdx].x + rectList[rdx].width)
             && (rectList[rdx].y <= diffResult.diffPos[idx].y && diffResult.diffPos[idx].y <= rectList[rdx].y + rectList[rdx].height)
            ) {
                isDiff = false;
                break;
            }
        }
        if (isDiff) {
            diffPos.push(diffResult.diffPos[idx]);
        }
	}

	if (diffPos.length > 1) {
		return {
			diff : true
		,	size : true
		,	diffPos : diffPos
		}
	}

	return {
		diff : false
	,	size : true
	,	diffPos : []
	}
}


/**
 * diffResultから差分文字列を取得する
 */
function getDiffText(diffResult) {
    if (!diffResult) {
        return "空行との比較";
    }
    if (!diffResult.diff) {
        return "差分なし";
    }
    if (!diffResult.size) {
        return "画像サイズ違い";
    }
    return "差分あり";
}

/**
 * 指定canvasを取得する
 */
function getCanvas(kbn, imageNo, type) {
    var $imageTop = $('.image-top[data-kbn=' + kbn + ']');
    var $canvasImage = $imageTop.find('.canvas-image[data-image-no=' + imageNo + ']');

    if (type == "image") {
        return $canvasImage.get(0);
    }

    var findType = '.canvas-' + type;
    return $canvasImage.siblings(findType).get(0);
}

/**
 * 領域追加
 */
function addRect(rect) {
    // リストを追加
	var id = (new Date()).getTime();
	var label = id;

    // rectに情報追加
	rect.checked = true;
	rect.id = id;
	rect.label = label;

    // 行追加描画
    addRectRow(rect);

    // 差分が変わるため再計算（描画後のためsetTimeout）
    setTimeout(function() {
        viewDiff();
    }, 1);
}

/**
 * rectタブの詳細行を追加
 */
function addRectRow(rect) {
    var $rectTop = $("#rect-box");

	var $addTag = $($("#rect-tag").render({rect:rect}));
	var $rectPos = $rectTop.find('.rect-pos');
	$addTag.insertBefore($rectPos);
}

/**
 * 差分に領域名を表示
 */
function viewDiffRect($diffTr, rectList){
    var $labelPos = $diffTr.find('.diff-label-pos');
    var page = $diffTr.attr('data-page');

    // 古いものを削除して新しいものを描画
    $diffTr.find('.diff-label-wrap').remove();

    for (var idx = 0; idx < rectList.length; idx++) {
        var $labelTag = $($("#diff-label-tag").render({page:page, rect:rectList[idx]}));
        $labelTag.insertBefore($labelPos);
    }
}

/**
 * ポップアップウィンドウの再描画
 */
function popWinReload() {
    // 開いている場合のみ
    if(popWin && !popWin.closed) {
        popWin.initLoad();
    }
}

/**
 * ポップアップウィンドウの画像ON/OFF
 */
function popWinToggle(canvasType, checked) {
    // 開いている場合のみ
    if(popWin && !popWin.closed) {
        var elementId = 'img-' + canvasType;
        var $element = $(popWin.document.getElementById(elementId));
        if (checked) {
            $element.hide();
        } else {
            $element.show();
        }
    }
}

/**
 * rectリストを取得
 */
function getRectList() {
    var rectList = [];
    $.each($('.rect-row'), function(idx, elm) {
        var $row = $(elm);
        var id = $row.attr("data-rect-id");
        var $dtlTop = $('.rect-detail-top[data-rect-id=' + id + '] .rect-detail-page');

        // 入力は1～で入っているので0に合わせて保存
        var detailList = [];
        $.each($dtlTop, function(dtlCnt, dtlElm) {
            detailList.push(Number($(dtlElm).val()) - 1);
        });

        rectList.push({
            id : id
        ,   checked : $row.find('.rect-check').prop("checked")
        ,   label : $row.find('.rect-label').val()
        ,   x : Number($row.find('.rect-x').val())
        ,   y : Number($row.find('.rect-y').val())
        ,   width : Number($row.find('.rect-w').val())
        ,   height : Number($row.find('.rect-h').val())
        ,   details : detailList
        });
    });
    return rectList;
}

/**
 * 領域描画
 */
function drawRectList(canvas, rectList) {
    // 空行は何もしない
    if (!canvas) {
        return;
    }
    const context = canvas.getContext("2d");
    for (var cnt = 0; cnt < rectList.length; cnt++) {
        var rect = rectList[cnt];
        if (rect.checked) {
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
    }
}

/** ポップアップウィンドウ */
var popWin = null;

$(function(){
    window.onunload = function() {
        // 開いているpopupがあれば閉じる
        if(popWin && !popWin.closed) {
            popWin.close();
        }
    }

    /**
     * ファイル選択時にbase64項目にファイルのbase64値を配置する
     */
    $('.select-file').on('change', function(event){
        var inputFiles = event.target.files || event.dataTransfer.files;

        if(!inputFiles.length) {
            return;
        }
        var file = inputFiles[0];
        var $listTop = $(event.target).closest('.image-top');
        var $fileName = $listTop.find('.file-name');
        $listTop.attr('data-loaded', true);

        var ext = "";
        var extPos = file.name.lastIndexOf('.');
        if (extPos >= 0) {
            ext = file.name.slice(extPos + 1).toLowerCase();
        }


    	var deferred = new $.Deferred;
    	deferred.promise();
        dispLoading("ファイル取得中");

        if (ext == "pdf") {
            // PDFファイルをbase64化
            getFileBase64(file).done(function(base64){
                // PDFのbase64ファイルをAPI送信して画像リスト取得
                getPdfImage(base64).done(function(image64s){
                    // 画像リストをtableに配置
                    setupImageTable($listTop, image64s).always(function() {
                    	deferred.resolve();
                    });

                    // 取得した画像リストをダウンロードできるようにする
                    var link = getDownloadTag(JSON.stringify(image64s), file.name + ".pdfimg");
                    $fileName.html(link);
                });
            });
        } else if (ext == "pdfimg") {
            // 画像リストをtableに配置
            dispLoading("ファイル取得中");
            getFileText(file).done(function(str){
                // 画像リストをtableに配置
                setupImageTable($listTop, JSON.parse(str)).always(function() {
                    deferred.resolve();
                });

                // ファイル名表示
                $fileName.text(file.name);
            });
        } else {
            alert("拡張子がおかしい");
            console.log(file.name);
            console.log(ext);

            deferred.reject();
        }

    	$.when(deferred).always(function(){
            removeLoading();
    	});
    });
    /**
     * 行追加押下時
     */
    $('body').on('click', '.blank-add', function(event){
        var $listTop = $(event.target).closest('.image-top');
        var kbn = $listTop.attr("data-kbn");
        var $clickTr = $(event.target).closest(".image-tr");
        var clickPage = Number($clickTr.attr("data-page"));

        // クリックしたページ以降を+1
        $.each($('.image-top[data-kbn="' + kbn + '"]').find('.image-tr'), function(idx, elm) {
            var page = Number($(elm).attr("data-page"));
            if (page >= clickPage) {
                $(elm).attr("data-page", page + 1);
            }
        });

        var $blankTag = $($("#blank-tag").render({idx:clickPage}));
        $blankTag.insertBefore($clickTr);

        viewDiff();
    });
    /**
     * 行削除押下時
     */
    $('body').on('click', '.blank-remove', function(event){
        var $listTop = $(event.target).closest('.image-top');
        var kbn = $listTop.attr("data-kbn");
        var $clickTr = $(event.target).closest(".image-tr");
        var clickPage = Number($clickTr.attr("data-page"));

        // クリックしたページ以降を-1
        $.each($('.image-top[data-kbn="' + kbn + '"]').find('.image-tr'), function(idx, elm) {
            var page = Number($(elm).attr("data-page"));
            if (page >= clickPage) {
                $(elm).attr("data-page", page - 1);
            }
        });

        $clickTr.remove();

        viewDiff();
    });
    /**
     * 差分バー変更時
     */
    $('#eps-bar').on('mouseup',function(event){
        viewDiff();
    });

    /**
     * 差分実行ボタン
     */
    $('#diff-btn').on('click',function(event){
        doDiff();
    });

    /**
     * 差分点Toggle時
     */
    $('#light-toggle').on('change',function(event){
        const checked = $('#light-toggle').prop("checked");
        if (checked) {
            $('.canvas-light').hide();
        } else {
            $('.canvas-light').show();
        }
        popWinToggle("light", checked);
    });
    /**
     * 画像Toggle時
     */
    $('#image-toggle').on('change',function(event){
        const checked = $('#image-toggle').prop("checked");
        if (checked) {
            $('.canvas-image').hide();
        } else {
            $('.canvas-image').show();
        }
        popWinToggle("image", checked);
    });
    /**
     * 矩形Toggle時
     */
    $('#rect-toggle').on('change',function(event){
        const checked = $('#rect-toggle').prop("checked");
        if (checked) {
            $('.canvas-rect').hide();
        } else {
            $('.canvas-rect').show();
        }
        popWinToggle("rect", checked);
    });
    /**
     * 差分のないページToggle時
     */
    $('#diff-toggle').on('change',function(event){
        // まずは全表示
        $('.pages').show();

        const checked = $('#diff-toggle').prop("checked");
        // チェックがある場合、差分なし行をhide
        if (checked) {
            $.each($('.diff-tr'), function(idx, elm) {
                if (elm.getAttribute("data-diff") == "false") {
                    $('.pages[data-page=' + idx + ']').hide();
                }
            });
        }
    });
    /**
     * 自動比較Toggle時
     */
    $('#auto-toggle').on('change',function(event){
        const checked = $('#auto-toggle').prop("checked");
        if (checked) {
            $('#diff-btn').show();
        } else {
            $('#diff-btn').hide();
        }
    });

    /**
     * 画像クリック時
     */
    $('body').on('click', '.cell-top', function(event){
        var $listTop = $(event.target).closest('.image-top');
        $canvasImage = $(event.target).siblings('.canvas-image');

        var kbn = $listTop.attr("data-kbn");
        var no = $canvasImage.attr("data-image-no");
        popWin = window.open("./imagepopup.html?kbn=" + kbn + "&no=" + no, "pop", "width=0,height=0,scrollbars=yes,resizable=no");
    });
});
