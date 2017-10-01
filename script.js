const selectors = {
	track: '[typeof="MusicRecording"][property="hasPart"]',
	artist: '[property="byArtist"] [property="name"]',
	title: '[property="name"]:not(.artist)'
}

const extract = doc => (
	Array.from(doc.querySelectorAll(selectors.track))
		.map(item => ({
			artist: item.querySelector(selectors.artist),
			title: item.querySelector(selectors.title),
		}))
		.filter(item => item.artist && item.title)
		.map(item => ({
			artist: item.artist.textContent.trim(),
			title: item.title.textContent.trim()
		}))
)

const display = playlist => {
	const player = document.createElement('object')
	player.setAttribute('type', 'text/html')
	player.setAttribute('data', 'https://embed.spotify.com/?uri=' + encodeURIComponent(playlist.uri))
	player.style.width = '100%'
	player.style.height = '380px'
	player.style.margin = '10px 0'

	document.querySelector('.map__column--last .br-box-secondary:first-of-type').appendChild(player)
}

const parser = new DOMParser();

(async () => {
	const response = await fetch(location.pathname + '/segments.inc')
	const html = await response.text()
	const doc = parser.parseFromString(html, 'text/html')
	const items = extract(doc)

	chrome.runtime.sendMessage(items, display)
})()
