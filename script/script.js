function musicDashboard() {
  return {
    rawData: [],
    tracks: [],
    albums: [],
    searchQuery: '',
    selectedAlbum: null,
    selectedTrack: null,

    async init() {
      await this.loadData();
      this.renderArtistsChart();
      this.renderGenresChart();
    },

    async loadData() {
      try {
        const response = await fetch('data/data_spotistat.json');
        this.rawData = await response.json();

        this.tracks = this.rawData.map(track => ({
          id: track.id,
          title: track.name,
          artist: (track.artists || []).map(a => a.name).join(', ') || 'Inconnu',
          artists: track.artists || [],
          album: track.album?.name || 'Inconnu',
          albumId: track.album?.id || '',
          albumCover: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || '',
          albumDate: track.album?.release_date || '',
          albumTotalTracks: track.album?.total_tracks || 0,
          genres: this.getTrackGenres(track),
          duration: track.duration_ms || 0,
          popularity: track.popularity || 0,
          explicit: track.explicit || false,
          trackNumber: track.track_number || 0,
          previewUrl: track.preview_url || '',
          spotify: track.external_urls?.spotify || '#',
        }));

        this.albums = this.buildAlbumList(this.rawData);
      } catch (error) {
        console.error('Erreur chargement JSON :', error);
      }
    },

    buildAlbumList(data) {
      const albumsMap = {};

      data.forEach(track => {
        const album = track.album || {};
        if (!album.id) return;

        if (!albumsMap[album.id]) {
          albumsMap[album.id] = {
            id: album.id,
            nom: album.name || 'Inconnu',
            artiste: (track.artists || []).map(a => a.name).join(', ') || 'Inconnu',
            date: album.release_date ? album.release_date.slice(0, 4) : 'Inconnu',
            totalTracks: album.total_tracks || 0,
            pochette: album.images?.[1]?.url || album.images?.[0]?.url || '',
            popularite: track.popularity || 0,
            spotifyUrl: track.external_urls?.spotify || '#',
          };
        } else {
          albumsMap[album.id].popularite = Math.max(albumsMap[album.id].popularite, track.popularity || 0);
        }
      });

      return Object.values(albumsMap)
        .sort((a, b) => b.popularite - a.popularite)
        .slice(0, 6);
    },

    filteredTracks() {
      const query = this.searchQuery.trim().toLowerCase();
      if (!query) return this.tracks;
      return this.tracks.filter(track =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
      );
    },

    openAlbum(album) {
      this.selectedAlbum = album;
      bootstrap.Modal.getOrCreateInstance(this.$refs.albumModal).show();
    },

    closeAlbum() {
      bootstrap.Modal.getInstance(this.$refs.albumModal)?.hide();
      this.selectedAlbum = null;
    },

    openTrackDetails(track) {
      this.selectedTrack = track;
      bootstrap.Modal.getOrCreateInstance(this.$refs.trackModal).show();
    },

    closeTrackDetails() {
      bootstrap.Modal.getInstance(this.$refs.trackModal)?.hide();
      this.selectedTrack = null;
    },

    formatDuration(ms) {
      if (!ms) return '0:00';
      const total = Math.floor(ms / 1000);
      const min = Math.floor(total / 60);
      const sec = String(total % 60).padStart(2, '0');
      return `${min}:${sec}`;
    },

    getArtistName(track) {
      return track.artists?.[0]?.name || 'Inconnu';
    },

    getTrackGenres(track) {
      const genres = (track.artists || []).flatMap(a => a.genres || []);
      return genres.length ? [...new Set(genres)] : ['Inconnu'];
    },

    renderArtistsChart() {
      const artistCount = {};
      this.rawData.forEach(track => {
        const name = this.getArtistName(track);
        artistCount[name] = (artistCount[name] || 0) + 1;
      });

      const sorted = Object.entries(artistCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      new Chart(this.$refs.artistsChart, {
        type: 'bar',
        data: {
          labels: sorted.map(e => e[0]),
          datasets: [{
            label: 'Nombre de morceaux',
            data: sorted.map(e => e[1]),
            backgroundColor: '#9ec5fe',
            borderColor: '#0d6efd',
            borderWidth: 1,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top 10 des artistes (nombre de morceaux)' },
          },
          scales: { x: { beginAtZero: true } },
        },
      });
    },

    renderGenresChart() {
      const genreCount = {};
      this.rawData.forEach(track => {
        this.getTrackGenres(track).forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      });

      const sorted = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);

      new Chart(this.$refs.genresChart, {
        type: 'pie',
        data: {
          labels: sorted.map(e => e[0]),
          datasets: [{
            data: sorted.map(e => e[1]),
            backgroundColor: [
              '#f78fb3','#63cdda','#f7d794','#778beb','#cf6a87',
              '#f8a5c2','#596275','#82ccdd','#d1ccc0','#a29bfe',
            ],
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Distribution des genres musicaux' },
            legend: { position: 'right' },
          },
        },
      });
    },
  };
}