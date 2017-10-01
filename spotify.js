const SPOTIFY_CLIENT_ID = 'ba01a18f2a0c4e9fa3130fa8a140ef48'

const buildQueryString = params => Object.keys(params)
    .map(key => [key, params[key]].map(encodeURIComponent).join('='))
    .join('&').replace(/%20/g, '+')

const randomState = () => {
    let array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return String(array[0])
}

const getToken = () => new Promise((resolve, reject) => {
    chrome.storage.local.get('accessToken', result => {
        resolve(result.accessToken || authorize())
    })
})

const authorize = () => new Promise((resolve, reject) => {
    const state = randomState()

    chrome.identity.launchWebAuthFlow({
        url: 'https://accounts.spotify.com/authorize?' + buildQueryString({
            client_id: SPOTIFY_CLIENT_ID,
            redirect_uri: chrome.identity.getRedirectURL('oauth2'),
            response_type: 'token',
            scope: 'playlist-modify-private',
            state
        }),
        interactive: true,
     }, redirectURL => {
        const params = new URLSearchParams(redirectURL.split('#')[1])

        if (params.get('state') !== state) {
            throw new Error('Invalid state')
        }

        const accessToken = params.get('access_token')

        chrome.storage.local.set({ accessToken }, () => {
            resolve(accessToken)
        })

        // TODO: prevent infinite loops, catch rate limiting
    })
})

const api = async (url, options = {}) => {
    const accessToken = await getToken()

    options.headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + accessToken,
    }

    const response = await fetch('https://api.spotify.com/v1' + url, options)

    const data = await response.json()

    if (data.error) {
        console.error(data.error)

        if (data.error.status === 400) {
            authorize() // TODO: retry
        }

        return
    }

    return data
}

const createPlaylist = async (tracks, sendResponse) => {
    const user = await api('/me')

    const playlist = await api(`/users/${user.id}/playlists`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'BBC Radio',
            public: false,

        })
    })

    const uris = await Promise.all(tracks.map(async item => {
        const search = await api('/search?' + buildQueryString({
            q: 'artist:' + item.artist + ' track:' + item.title,
            type: 'track',
            limit: 1
        }))

        if (!search.tracks || !Array.isArray(search.tracks.items) || !search.tracks.items.length) {
            console.error('No tracks')
            return null
        }

        return search.tracks.items[0].uri
    }))

    await api(`/users/${user.id}/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
            uris: uris.filter(uri => uri)
        })
    })

    sendResponse(playlist)
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    createPlaylist(request, sendResponse)
    return true // needed for asynchronous responses
})
