// playlist search

export interface SpotifyError {
  error: { status: number; message: string };
}

export interface PlaylistSearchOptions {
  q: string;
  limit: number;
  offset: number;
}

export interface PlaylistSearchResults {
  playlists: PlaylistSearchResultsData;
}

export interface PlaylistSearchResultsData {
  href: string;
  items: PlaylistItem[];
  limit: number;
  next: string;
  offset: number;
  previous: null;
  total: number;
}

export interface PlaylistItem {
  collaborative: boolean;
  description: string;
  external_urls: PlaylistExternalUrls;
  href: string;
  id: string;
  images: PlaylistImage[];
  name: string;
  owner: PlaylistOwner;
  primary_color: null;
  public: null;
  snapshot_id: string;
  tracks: PlaylistTracks;
  type: 'playlist';
  uri: string;
}

export interface PlaylistExternalUrls {
  spotify: string;
}

export interface PlaylistImage {
  height: number | null;
  url: string;
  width: number | null;
}

export interface PlaylistOwner {
  display_name: string;
  external_urls: PlaylistExternalUrls;
  href: string;
  id: string;
  type: PlaylistOwnerType;
  uri: string;
}

export enum PlaylistOwnerType {
  User = 'user',
}

export interface PlaylistTracks {
  href: string;
  total: number;
}

// playlist tracks

export interface PlaylistTracksOptions {
  playlist_id: string;
  limit: number;
  offset: number;
}

export interface PlaylistTracksResponse {
  href: string;
  items: PlaylistTracksResponseItem[];
  limit: number;
  next: null;
  offset: number;
  previous: null;
  total: number;
}

export interface PlaylistTracksResponseItem {
  added_at: string;
  added_by: PlaylistTracksResponseAddedBy;
  is_local: boolean;
  primary_color: null;
  track: PlaylistTracksResponseTrack;
  video_thumbnail: PlaylistTracksResponseVideoThumbnail;
}

export interface PlaylistTracksResponseAddedBy {
  external_urls: PlaylistTracksResponseExternalUrls;
  href: string;
  id: string;
  type: PlaylistTracksResponseType;
  uri: string;
  name?: string;
}

export interface PlaylistTracksResponseExternalUrls {
  spotify: string;
}

export enum PlaylistTracksResponseType {
  Artist = 'artist',
  User = 'user',
}

export interface PlaylistTracksResponseTrack {
  album: PlaylistTracksResponseAlbum;
  artists: PlaylistTracksResponseAddedBy[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  episode: boolean;
  explicit: boolean;
  external_ids: PlaylistTracksResponseExternalIDS;
  external_urls: PlaylistTracksResponseExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: null | string;
  track: boolean;
  track_number: number;
  type: string;
  uri: string;
}

export interface PlaylistTracksResponseAlbum {
  album_type: string;
  artists: PlaylistTracksResponseAddedBy[];
  available_markets: string[];
  external_urls: PlaylistTracksResponseExternalUrls;
  href: string;
  id: string;
  images: PlaylistTracksResponseImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}

export interface PlaylistTracksResponseImage {
  height: number;
  url: string;
  width: number;
}

export interface PlaylistTracksResponseExternalIDS {
  isrc: string;
}

export interface PlaylistTracksResponseVideoThumbnail {
  url: null;
}
