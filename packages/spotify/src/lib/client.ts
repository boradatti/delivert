import type {
  PlaylistSearchOptions,
  PlaylistSearchResults,
  PlaylistTracksOptions,
  PlaylistTracksResponse,
} from './types';
import { getImageDataUrl } from './utils';


type QueryPath = `/search` | `/playlists/${string}` | `/users/${string}/playlists`;

export type SpotifyInitOptions = {
  accessToken: string;
  refreshToken: string;
};

type SearchedPlaylist = {
  id: string;
  name: string;
  cover: string;
};

const INITIAL_PLAYLISTS = ['release radar', 'discover weekly'];

export class SpotifyClient {
  baseUrl = 'https://api.spotify.com/v1';
  accessToken: string;
  refreshToken: string;

  constructor(options: SpotifyInitOptions) {
    this.accessToken = options.accessToken;
    this.refreshToken = options.refreshToken;
  }

  static async refreshAccessToken(options: {
    refresh_token: string;
    client_id: string;
    client_secret: string;
  }): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
  }> {
    const url = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: options.refresh_token,
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${options.client_id}:${options.client_secret}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    console.log(res);
    const data = await res.json();
    return data;
  }

  private getQueryParamString(params: Record<any, any>) {
    const query = new URLSearchParams(params);
    return query.toString();
  }

  private getQueryUrl(path: QueryPath, params: Record<any, any> = {}) {
    const query = this.getQueryParamString(params);
    return `${this.baseUrl}${path}?${query}`;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  async searchPlaylists(
    options: PlaylistSearchOptions
  ): Promise<PlaylistSearchResults> {
    // implementation of the search method goes here
    const type = 'playlist';
    const { q, limit, offset } = options;
    const params = { q, type, limit, offset };
    const url = this.getQueryUrl('/search', params);
    const res = await fetch(url, {
      headers: this.headers,
    });
    return await res.json();
  }

  async getSearchedPlaylist(
    options: PlaylistSearchOptions
  ): Promise<SearchedPlaylist> {
    const res = await this.searchPlaylists(options);
    const item = res.playlists.items[0];
    return {
      id: item.id,
      name: item.name,
      cover: item.images[0].url,
    };
  }

  async getInitialPlaylists() {
    const playlists = [];
    for (const playlistName of INITIAL_PLAYLISTS) {
      const playlist = await this.getSearchedPlaylist({
        q: playlistName,
        limit: 1,
        offset: 0,
      });
      playlists.push(playlist);
    }
    return playlists;
  }

  async getPlaylistTracks(
    options: PlaylistTracksOptions
  ): Promise<PlaylistTracksResponse> {
    const url = this.getQueryUrl(`/playlists/${options.playlist_id}/tracks`, {
      limit: options.limit,
      offset: options.offset,
    });
    const res = await fetch(url, {
      headers: this.headers,
    });
    return await res.json();
  }

  async getAllPlaylistTracks(playlist_id: string) {
    const [limit, offset] = [100, 0];
    const tracks = [];
    let needsMore = true;
    while (needsMore) {
      const res = await this.getPlaylistTracks({
        playlist_id,
        limit,
        offset: offset + tracks.length,
      });
      console.log(res);
      needsMore = res.next !== null;
      tracks.push(...res.items);
    }
    return tracks;
  }

  parseIdentifier(identifier: string) {
    // need to extract ID from identifier
    // the idedntifier may have the form of a URL, uri, or just the ID
    // url: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=8e9e9e9e9e9e9e9e
    // uri: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
    // id: 37i9dQZF1DXcBWIGoYBM5M
    let result = identifier;
    
    if (identifier.includes('spotify.com/playlist')) {
      const parts = identifier.split('/');
      result = parts[parts.length - 1];
    } else if (identifier.includes('spotify:playlist')) {
      const parts = identifier.split(':');
      result = parts[parts.length - 1];
    }

    return result.split('?')[0].trim();
  }

  async getPlaylistById(
    id: string
  ): Promise<
    PlaylistSearchResults['playlists']['items'][number]> {
    const url = this.getQueryUrl(`/playlists/${id}`);
    const res = await fetch(url, {
      headers: this.headers,
    });
    return await res.json();
  }

  async unfollowPlaylist(id: string) {
    const url = this.getQueryUrl(`/playlists/${id}/followers`);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers,
    });
    return await res.json();
  }

  async uploadPlaylistCover(options: {
    playlist_id: string;
    cover_url: string;
  }) {
    const dataUrl = await getImageDataUrl(options.cover_url);
    console.log(dataUrl.slice(0, 100));
    const url = this.getQueryUrl(`/playlists/${options.playlist_id}/images`);
    await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'image/jpeg',
      },
      body: dataUrl.split(',')[1],
    });
  }

  async createPlaylist(options: {
    user_id: string;
    name: string;
    description: string;
    cover?: string
  }): Promise<string> {
    const url = this.getQueryUrl(`/users/${options.user_id}/playlists`);
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: options.name,
        description: options.description,
        public: true,
      }),
    });
    const data = await res.json();
    if (options.cover && options.cover.length > 0) {
      await this.uploadPlaylistCover({
        playlist_id: data.id,
        cover_url: options.cover,
      });
    }
    return data.id;
  }

  async addTracksToPlaylist(options: {
    playlist_id: string;
    track_ids: string[];
  }) {
    const url = this.getQueryUrl(`/playlists/${options.playlist_id}/tracks`);
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        uris: options.track_ids.map((id) => `spotify:track:${id}`),
      }),
    });
    return await res.json();
  }
}
