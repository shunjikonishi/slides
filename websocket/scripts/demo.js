function buildDemo() {
	var endTime = new Date(2014, 5, 3, 21, 30, 0).getTime();
	var slideCount = 32;

	function makeTimer() {
		var $timer = $("<div class='timer'><div class='clock'/><div class='perSlide'/></div>"),
			$clock = $timer.find("div:first"),
			$perSlide = $timer.find("div:last");
		$(".reveal").after($timer);

		setInterval(function() {
			var text = "",
				t = endTime - new Date().getTime();
			if (t > 0) {
				var min = Math.floor(t / 60000),
					sec = Math.floor(t / 1000) % 60;
				min = min < 10 ? "0" + min : "" + min;
				sec = sec < 10 ? "0" + sec : "" + sec;
				$clock.text(min + ":" + sec);
			}
		}, 1000);
		Reveal.addEventListener("slidechanged", function(event) {
			var text = "",
				t = endTime - new Date().getTime(),
				n = slideCount - event.indexh;
			if (t > 0 && n > 0) {
				text = Math.floor(t / n / 1000) + "秒／枚"
			}
			$perSlide.text(text);
		});
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
	function buildSequence() {
		$(".sequence").each(function() {
			var id = $(this).attr("id"),
				text = $("#" + id + "-src").text(),
				diagram = Diagram.parse(text);
			diagram.drawSVG(id, {
				"theme" : "simple"
			});
		});
	}
	function intervalDemo() {
		var time = new Date().getTime(),
			cnt = 0,
			$cntTimer = $("#cntTimer"),
			$timeTimer = $("#timeTimer");

		setInterval(function() {
			var t = new Date().getTime() - time;
			cnt++;
			$cntTimer.text(cnt);
			$timeTimer.text((Math.floor(t / 100) / 10));
		}, 100);
		$("#resetTimer").click(function() {
			time = new Date().getTime();
			cnt = 0;
		});
	}

	makeTimer();
	embedVideo();
	buildCanvas();
	buildSequence();
	intervalDemo();
}