findTracks({
	track: "[typeof='mo:Track'],[typeof='po:MusicSegment']",
	artist: "[rel='foaf:maker'] [property='foaf:name'],[rel='mo:performer'] [property='foaf:name']",
	title: "[property='dc:title']"
})

function findTracks(selector) {
	var nodes = document.querySelectorAll(selector.track);

	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];

		var artist = node.querySelectorAll(selector.artist).item(0).textContent.trim();
		var title = node.querySelectorAll(selector.title).item(0).textContent.trim();

		var spotify = node.appendChild(document.createElement("div"));
		addSpotifyTrackLink(spotify, artist, title);

		var links = node.appendChild(document.createElement("div"));
		addTomahawkTrackLink(links, artist, title);
		addRdioTrackLink(links, artist, title);
	}
}

function addTomahawkTrackLink(node, artist, title) {
	var link = document.createElement("a");
	//link.href = "tomahawk://open/track" + buildQueryString({ artist: artist, title: title });
	link.href = "http://toma.hk/" + buildQueryString({ artist: artist, title: title });
	//link.innerHTML = "▶";
	link.style.background = "url(http://www.tomahawk-player.org/assets/ico/favicon.ico) no-repeat right center";
	link.style.padding = "10px";
	link.style.display = "inline-block";

	link.addEventListener("click", openNewWindow, true);
	node.appendChild(link);
}

/*
function addTomahawkEmbed(node, artist, title) {
	var object = document.createElement("object");
	object.setAttribute("type", "text/html");
	object.setAttribute("data", "http://toma.hk/embed.php" + buildQueryString({ artist: artist, title: title }));
	object.style.width = "100%";
	object.style.height = "200px";
	object.style.margin = "10px 0";

	node.appendChild(object);
}
*/

function addSpotifyTrackLink(node, artist, title) {
	var query = 'artist:"' + artist + '" track:"' + title + '"';

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://ws.spotify.com/search/1/track.json" + buildQueryString({ q: query }), true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			var data = JSON.parse(xhr.responseText);
			if (!data.tracks || !data.tracks.length) return;

			var object = document.createElement("object");
			object.setAttribute("type", "text/html");
			object.setAttribute("data", "https://embed.spotify.com/" + buildQueryString({ uri: data.tracks[0].href }));
			object.style.width = "300px";
			object.style.height = "80px";
			object.style.margin = "10px 0";

			node.appendChild(object);
		}
	};
	xhr.send(null);
}

function addRdioTrackLink(node, artist, title) {
	var link = document.createElement("a");
	link.href = "http://alf.hubmed.org/2012/05/rdio-track-search/" + buildQueryString({ artist: artist, title: title });
	//link.innerHTML = "▶";
	link.style.background = "url(http://ak.rdio.com/media/favicon_20111219.ico) no-repeat right center";
	link.style.padding = "10px";
	link.style.display = "inline-block";

	link.addEventListener("click", openNewWindow, true);
	node.appendChild(link);
}

/*
function addRdioTrackLink(node, artist, title) {
	var params = {
		api_key: "D3JK5N3NLFII4K3HF",
		format: "json",
		results: 1,
		limit: "false",
		bucket: [
			//"id:spotify-WW",
			"id:rdio-us-streaming",
			"tracks"
		],
		artist: artist,
		title: title,
	}

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://developer.echonest.com/api/v4/song/search" + buildQueryString(params), true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			var data = JSON.parse(xhr.responseText);
			if (!data.response) return;

			console.log(data);

			var link = document.createElement("a");
			link.href = data.response.songs[0].foreign_ids[0].foreign_id;
			link.innerHTML = "▶";
			link.style.background = "url(http://www.tomahawk-player.org/sites/default/files/favicon.ico) no-repeat right center";
			link.style.paddingRight = "20px";
			node.appendChild(link);

			//node.appendChild(object);
		}
	};
	xhr.send(null);
}
*/

function buildQueryString(items) {
	var parts = [];

	var add = function(key, value) {
		parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
	}

	for (var key in items) {
		if (!items.hasOwnProperty(key)) continue;

   		var obj = items[key];

   		if (Array.isArray(obj)) {
   			obj.forEach(function(value) {
   				add(key, value);
   			});
   		}
   		else {
   			add(key, obj);
   		}
	}

	return parts.length ? "?" + parts.join("&").replace(/%20/g, "+") : "";
}

function openNewWindow(event) {
	event.preventDefault();
	event.stopPropagation();
	window.open(event.target.href, "Resolver", "menubar=no,toolbar=no,location=yes,height=500,width=800");
}