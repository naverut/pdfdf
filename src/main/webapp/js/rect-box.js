/**
 * 領域除外リスト追加
 */
function addRectDetail($detailTop, selPage) {
    var $pos = $detailTop.find('.rect-detail-pos');
    var $addTag = $($('#rect-detail-tag').render({page:selPage}));
    $addTag.insertBefore($pos);
}
/**
 * 領域除外リスト削除
 */
function removeRectDetail($detailTop, selPage) {
    var $rectDetailPages = $detailTop.find('.rect-detail-page');
    $.each($rectDetailPages, function(cnt, elm) {
        if ($(elm).val() == selPage) {
            $(elm).closest('.rect-detail-tr').remove();
        }
    });
}

/**
 * 領域内のチェック変更
 * @param $rectCheck rectのチェックボックスelement
 */
function changeRectCheck($rectCheck) {
    // rect側情報
    var rectId = $rectCheck.closest('.rect-row').attr("data-rect-id");
    var rectAllChecked = $rectCheck.prop("checked");
    var $excPages = $('.rect-detail-top[data-rect-id=' + rectId + ']').find('.rect-detail-page');

    // 各diffのページ毎にrect情報を反映する
    $.each($('.diff-tr'), function(cnt, elm) {
        var page = Number($(elm).attr("data-page")) + 1;
        var $diffCheckbox = $(elm).find('.diff-label-wrap[data-rect-id=' + rectId + '] .diff-check');

        // 基本的にはrectのallCheckに従う
        var pageChecked = rectAllChecked;
        // 除外リストにあったら反転
        $.each($excPages, function(cntDtl, elmDtl) {
            if ($(elmDtl).val() == page) {
                pageChecked = !pageChecked;
                return false; // break;
            }
        });

        $diffCheckbox.prop("checked", pageChecked);
    });
}
/**
 * 指定ページの差分のみ再計算
 */
function reCalcViewDiff($diffTr) {
    var page = Number($diffTr.attr("data-page"));

    // PDF画像列の取得
    var $orgTop = $('.image-top[data-kbn="org"]');
    var $dstTop = $('.image-top[data-kbn="dst"]');

    var $orgImageTr = $orgTop.find('.image-tr[data-page=' + page + ']');
    var $dstImageTr = $dstTop.find('.image-tr[data-page=' + page + ']');

    // 空行の場合は更新なし
    if (!$orgImageTr.get(0) || !$dstImageTr.get(0)) {
        return;
    }

    var $orgImageTd = $orgImageTr.find('.image-td');
    var $dstImageTd = $dstImageTr.find('.image-td');

    // チェック有のリスト作成
    var rectList = [];
    $.each($diffTr.find('.diff-label-wrap'), function(cnt, elm) {
        // rect側のx,y,width,heightを取得
        var rectId = $(elm).attr("data-rect-id");
        var $row = $('.rect-row[data-rect-id=' + rectId + ']');

        rectList.push({
            id : rectId
        ,   checked : $(elm).find('.diff-check').prop("checked")
        ,   label : $row.find('.rect-label').val()
        ,   x : Number($row.find('.rect-x').val())
        ,   y : Number($row.find('.rect-y').val())
        ,   width : Number($row.find('.rect-w').val())
        ,   height : Number($row.find('.rect-h').val())
        });
    });

    var eps = $('#eps-bar').val() / 100 * 195075; // 255^2 + 255^2 + 255^2=195075

    // 変更ページのみ再計算
    calcViewDiff($orgImageTd, $dstImageTd, $diffTr, eps, rectList);
}

$(function(){
    /**
     * 領域のリストの最小化／最大化
     */
    $('.rect-tab-mark').click(function(){
        $('.rect-tab-toggle').fadeToggle();
        $('#rect-table').fadeToggle();
    });

    /**
     * 領域内変更通知
     */
/*
    $('#rect-box').change(function(evt){
// ここに書いてしまうと子要素のeventが全てここに来る
        console.log('#rect-box');
    });
//*/

    /**
     * 領域行削除
     */
    $('body').on('click', '.rect-trash', function(event) {
        // 指定行取得
        var $rectRowTop = $(event.target).closest('.rect-row');
        var rectId = $rectRowTop.attr("data-rect-id");

        // 除外行取得
        var $rectDetailTop = $('.rect-detail-top[data-rect-id=' + rectId + ']');

        // 指定行を削除し、diff等に反映
        $rectRowTop.remove();
        $rectDetailTop.remove();

        // 全ページに影響するので再Diff
        viewDiff();
    });

    /**
     * 領域数値変更
     */
    $('body').on('change', '.rect-text', function(event) {
        // 全ページに影響するので再Diff
        viewDiff();
    });

    /**
     * 領域名変更
     */
    $('body').on('change', '.rect-label', function(event) {
        var $rectRowTop = $(event.target).closest('.rect-row');
        var label = $(event.target).val();
        var rectId = $rectRowTop.attr('data-rect-id');
        $('.rect-label-' + rectId + '').text(label);
    });

    /**
     * rect列の領域詳細チェックボックス
     */
    $('body').on('change', '.rect-check', function(event) {
        changeRectCheck($(event.target));

        // 全ページに影響するので再Diff
        viewDiff();
    });

    /**
     * rect列の除外リストのページ変更
     */
    $('body').on('change', '.rect-detail-page', function(event) {
        var rectId = $(event.target).closest('.rect-detail-top').attr("data-rect-id");
        var $rectCheck = $('.rect-row[data-rect-id=' + rectId + '] .rect-check');
        changeRectCheck($rectCheck);

        // 元ページと先ページで入れ替わるため全ページに影響するので再Diff
        viewDiff();
    });

    /**
     * 領域詳細Toggle
     */
    $('body').on('click', '.rect-detail-mark', function(event) {
        var $detailTop = $(event.target).closest('.rect-detail-top');
        $detailTop.find('.rect-detail-toggle').toggle();
        $detailTop.find('.rect-detail-table').fadeToggle();
    });

    /**
     * 領域詳細除外行追加
     */
    $('body').on('click', '.rect-detail-add', function(event) {
        var $detailTop = $(event.target).closest('.rect-detail-top');

        addRectDetail($detailTop, "");

        // 空で追加のため、diff変更なし
    });
    /**
     * 領域詳細除外行削除
     */
    $('body').on('click', '.rect-detail-remove', function(event) {
        // top取得
        var $detailTop = $(event.target).closest('.rect-detail-top');

        // 削除ページ取得（テキスト入力で重複チェックしないため複数考慮）
        var $detailTr = $(event.target).closest('.rect-detail-tr');
        var page = $detailTr.find('.rect-detail-page').val();

        // 削除実行
        removeRectDetail($detailTop, page);

        // 変更をdiffに通知
        var rectId = $detailTop.attr("data-rect-id");
        var $rectCheck = $('.rect-row[data-rect-id=' + rectId + '] .rect-check');
        changeRectCheck($rectCheck);

        // 全ページに影響するので再Diff
        viewDiff();
    });

    /**
     * diff列の領域詳細チェックボックス
     */
    $('body').on('change', '.diff-check', function(event) {
        // diff側情報
        var rectId = $(event.target).closest('.diff-label-wrap').attr("data-rect-id");
        var $diffTr = $(event.target).closest('.diff-tr');
        var page = Number($diffTr.attr("data-page")) + 1;
        var checked = $(event.target).prop("checked");

        // rect側情報
        var $rectTr = $('.rect-row[data-rect-id=' + rectId + ']');
        var allCheck = $rectTr.find('.rect-check').prop("checked");

        var $detailTop = $('.rect-detail-top[data-rect-id=' + rectId + ']');

        // diff側チェックと全体チェック状況によって除外リストを作成
        if (checked == allCheck) {
            // チェックがそろった場合は除外リストには不要なため削除
            removeRectDetail($detailTop, page);
        } else {
            // チェックが異なる場合は除外リストに追加
            addRectDetail($detailTop, page);
        }

        // insert等の後のため、setTimeout
        setTimeout(function() {
            reCalcViewDiff($diffTr);
        }, 1);
    });

    /**
     * rectのexportでファイルダウンロード
     */
    $('#export').on('click', function(event) {
        var rectList = getRectList();

        // 取得した画像リストをダウンロードできるようにする
        var link = getDownloadTag(JSON.stringify(rectList), (new Date()).getTime() + ".pdfrct");
        link.click();
    });

    /**
     * rectのimportでファイルロード
     */
    $('#import').on('change', function(event){
        var inputFiles = event.target.files || event.dataTransfer.files;

        if(!inputFiles.length) {
            return;
        }
        var file = inputFiles[0];

        // 領域初期化
        $('.rect-row').remove();
        $('.rect-detail-top').remove();

        // 領域設定
        getFileText(file).done(function(str){
            var json = JSON.parse(str);
            for (var idx = 0; idx < json.length; idx++) {
                addRectRow(json[idx]);

                var rectId = json[idx].id;
                var $detailTop = $('.rect-detail-top[data-rect-id=' + rectId + ']');
                var details = json[idx].details;
                for (var pg = 0; pg < details.length; pg++) {
                    addRectDetail($detailTop, details[pg] + 1);
                }
            }

            viewDiff();
        });

    });
});
