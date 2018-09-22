function updateContent(container, newContent) {
	$(container).html(newContent); 
	
	// Only resize containers marked as resizable
	if ($(container).hasClass("resizable")){
		resize(container);
	}
}

function updateContentFadeDelayed(container, newContent, delay, time){	
	$(container).transition(
		{opacity: "0"},
		time
	)
	.queue(function(){
		updateContent(container, newContent);
		$(container).dequeue();
		})
	.transition({opacity: '1'}, time);
	
}