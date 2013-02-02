//------------------------------------
//
//	Javascript for Guitarras de Luna
//
//------------------------------------

$(document).ready(function() {
	loadMap();
}); 


// 	Contact form
function showContactForm() {

	loadMap();
	$("#map");
	

}; // end showContactForm
	
	
function loadMap() {

	var mapLatLang = new google.maps.LatLng(41.275017, -73.780961);

	var mapOptions = {
		panControl:		false,
		mapTypeControl:	false,
		center:			mapLatLang,
		zoom:			16,
		mapTypeId:		google.maps.MapTypeId.ROADMAP
	};

	var myMap = new google.maps.Map($contact.map[0], mapOptions);

	var marker = new google.maps.Marker({
		position:		mapLatLang,
		animation:		google.maps.Animation.DROP,
		map:			myMap,
		title:			'Guitarras de Luna'
	});

	var contentString = '<h4>Guitarras de Luna</h4>' +
					'<p>1940 Commerce Street<br>Yorktown Heights<br>New York<br><a href="https://maps.google.com/maps?q=1940+Commerce+Street,+Yorktown+Heights,+NY&hl=en&ll=41.275017,-73.780961&spn=0.007112,0.01281&sll=42.746632,-75.770041&sspn=3.557628,6.558838&oq=1940+Commerce+Street,+&hnear=1940+Commerce+St,+Yorktown+Heights,+Westchester,+New+York+10598&t=m&z=16">10598 - get directions</a></p><p>914 . 214 . 8662</p>';

	var infowindow = new google.maps.InfoWindow({
		content:		contentString,
		maxWidth:		200
	});

	google.maps.event.addListener(marker, 'click', function(){

		infowindow.open(myMap, marker);

	});

} // end loadMap()
