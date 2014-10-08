var tracks = [];
var uris = [];

var findTracks = function (node, selector) {
	var nodes = node.querySelectorAll(selector.track);

	console.log(selector, nodes.length)

	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];

		var track = {
			artist: node.querySelector(selector.artist).textContent.trim(),
			title: node.querySelector(selector.title).textContent.trim(),
		};

		tracks.push(track);

		var container = node.appendChild(document.createElement('div'));
		container.appendChild(tomahawkTrackLink(track));
	}

	fetchTrack();
}

var fetchTrack = function () {
	var track = tracks.shift();

	var query = 'artist:' + track.artist + ' track:' + track.title;

	var params = buildQueryString({
		q: query,
		type: 'track',
		limit: 1
	});

	var xhr = new XMLHttpRequest;
	xhr.open('GET', 'https://api.spotify.com/v1/search' + params);
	xhr.responseType = 'json';

	xhr.onload = function(){
		var data = this.response;

		if (data.tracks && data.tracks.items && data.tracks.items.length) {
			uris.push(data.tracks.items[0].id);
		} else {
			uris.push(null);
		}

		if (!tracks.length) {
			var uri = 'spotify:trackset:bbc:' + uris.join(',');

			var object = document.createElement('object');
			object.setAttribute('type', 'text/html');
			object.setAttribute('data', 'https://embed.spotify.com/' + buildQueryString({ uri: uri }));
			object.style.width = '300px';
			object.style.height = '380px';
			object.style.margin = '10px 0';

			var heading = document.querySelector('h1');
			heading.parentNode.insertBefore(object, heading.nextSibling);
		} else {
			fetchTrack();
		}
	};

	xhr.send();
}

var tomahawkTrackLink = function (track) {
	var link = document.createElement('a');
	link.href = 'tomahawk://open/track' + buildQueryString(track);
	link.style.background = 'url(http://www.tomahawk-player.org/assets/ico/favicon.ico) no-repeat right center';
	link.style.padding = '10px';
	link.style.display = 'inline-block';

	return link;
}

var buildQueryString = function (items) {
	var parts = [];

	var add = function(key, value) {
		parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
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

	return parts.length ? '?' + parts.join('&').replace(/%20/g, '+') : '';
}

var xhr = new XMLHttpRequest;
xhr.open('GET', location.href + '/segments.inc');
xhr.responseType = 'document';
xhr.onload = function() {
	findTracks(this.response, {
		track: '[typeof="MusicRecording"][property="track"]',
		artist: '[property="byArtist"] [property="name"]',
		title: 'p[property="name"]'
	});
}
xhr.send();





