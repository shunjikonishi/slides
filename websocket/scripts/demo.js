function buildDemo() {
	var END_TIME = new Date(2014, 5, 2, 18, 0, 0).getTime();
	function makeTimer() {
		var $timer = $("<div class='timer'></div>");
		setInterval(function() {
			var text = "",
				t = END_TIME - new Date().getTime();
			if (t > 0) {
				var min = Math.floor(t / 60000),
					sec = Math.floor(t / 1000) % 60;
				min = min < 10 ? "0" + min : "" + min;
				sec = sec < 10 ? "0" + sec : "" + sec;
				$timer.text(min + ":" + sec);
			}
		}, 1000);
		$(".reveal").after($timer);
	}
	function embedVideo() {
		var $iframe = $("<iframe/>");
		$iframe.attr({
			"src" : "//www.youtube.com/embed/tWoEzYr3rps",
			"width" : 560,
			"height" : 315,
			"frameborder" : 0
		});
		$("#quizar-video").append($iframe);
	}
	function buildCanvas() {
		var wsUrl = "ws://room-sandbox.herokuapp.com/shunjikonishi/egokorogaarimasen",
			drawCanvas = new flect.html.DrawCanvas("#pad2", wsUrl);
		
		$("#btnClear").click(function() {
			drawCanvas.clear();
		});
	}

	makeTimer();
	embedVideo();
	buildCanvas();
}