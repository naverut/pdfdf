/**
 * Loading表示
 */
function dispLoading(msg){
	// メッセージなし
	if(!msg){
		msg = "";
	}
	// 画面表示メッセージ
	var dispMsg = "<div class='loadingMsg'>" + msg + "</div>";
	// ローディング画像が表示されていない場合のみ出力
	if($("#loading").length == 0){
		$("body").append("<div id='loading'>" + dispMsg + "</div>");
	}
}
/**
 * Loading削除
 */
function removeLoading(){
	$("#loading").remove();
}

