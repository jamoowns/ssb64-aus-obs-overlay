function Shrink(container) {
	var size = $(container).css('font-size');
  
	if ($(container)[0].scrollHeight >  $(container).innerHeight()){
		$(container).css('font-size', parseInt(size) - 1);
		Shrink(container);
	}
}

function resize(container) {
	$(container).css('font-size', "60px");
	
	Shrink(container);
}