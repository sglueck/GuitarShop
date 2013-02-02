// Use jquery to get the most recent tweet from our status

$(document).ready(function() {
	loadLatestTweet();
}); 

//Twitter Parsers
String.prototype.parseURL = function() {
	return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
		return url.link(url);
	});
};
String.prototype.parseUsername = function() {
	return this.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
		var username = u.replace("@","")
		return u.link("http://twitter.com/"+username);
	});
};
String.prototype.parseHashtag = function() {
	return this.replace(/[#]+[A-Za-z0-9-_]+/g, function(t) {
		var tag = t.replace("#","%23")
		return t.link("http://search.twitter.com/search?q="+tag);
	});
};

function parseDate(str) {

	// Calculate the number of seconds that have passed since the tweet was created
	// Return a string with the appropriate "ago" amount
	var strTime = new Date((str||"").replace(/(\d{1,2}[:]\d{2}[:]\d{2}) (.*)/,"$2 $1").replace(/(\+\S+) (.*)/,"$2 $1").replace(/-/g,"/")),
		timeDiff = ( (new Date).getTime() - strTime.getTime() ) / 1e3,
		r = Math.floor(timeDiff/86400);
			
		return r == 0 && (timeDiff < 60 && "just now" ||
						  timeDiff < 120 && "1 minute ago" ||
						  timeDiff < 3600 && Math.floor(timeDiff/60) + " minutes ago" ||
						  timeDiff < 7200 && "1 hour ago"||
						  timeDiff < 86400 && Math.floor(timeDiff/3600) + " hours ago") ||
						  r == 1 && "Yesterday" || 
						  r < 7 && r + " days ago" ||
						  r < 31 && Math.ceil(r/7) + " weeks ago" ||
						  r < 365 && Math.ceil(r/30) + " months ago" ||
						  r >= 365 && Math.ceil(r/365) + " year" + (Math.ceil(r/365)>1 ? "s":"") + " ago";

}; // end parseDate function

function loadLatestTweet(){
	var numTweets = 2;
    var _url = 'https://api.twitter.com/1/statuses/user_timeline/guitarrasdelun1.json?callback=?&count=' + numTweets + '&include_rts=1';
    $.getJSON(_url,function(data){
    	for(var i = 0; i < data.length; i++){
            var tweet = data[i].text;
            var timePassed = parseDate(data[i].created_at);
            
            tweet = tweet.parseURL().parseUsername().parseHashtag();
            
            tweet += '<a href="https://twitter.com/#!/guitarrasdelun1" target="_blank"></a><br><time>' + timePassed + '</time></div></div>'
            $("#twitter-feed").append('<p>' + tweet + '</p>');
        }
    });
}