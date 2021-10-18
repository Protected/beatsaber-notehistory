class Events {

    constructor(widget) {
        this._widget = widget;
    }

    hello(data) {
        if (data.status.beatmap && data.status.beatmap.start) {
            this._widget.setMapStyleFromData(data.status);
            this._widget.show();
            this._widget.songStart(data.status, data.status.beatmap.start);
            if (data.status.beatmap.paused) {
                this._widget.songPause(data.status.beatmap.paused);
            }
        }
    }

    songStart(data) {
        this._widget.setMapStyleFromData(data.status);
        this._widget.show();
        this._widget.songStart(data.status);
    }

    menu() {
        this._widget.songStop();
        this._widget.clear();
    }

    finished() {
        this._widget.songStop();
        this._widget.clear();
    }

    failed() {
        this._widget.songStop();
        this._widget.clear();
    }

    pause() {
        this._widget.songPause();
    }

    resume() {
        this._widget.songResume();
    }

    noteSpawned(data) {
        this._widget.addNoteFromData(data.noteCut, data.time, false, true);
    }

    noteCut(data) {
        this._widget.addNoteFromData(data.noteCut, data.time);
    }

    noteFullyCut(data) {
        this._widget.updateNoteFromData(data.noteCut, data.time);
    }

    noteMissed(data) {
        this._widget.addNoteFromData(data.noteCut, data.time, true);
    }

    bombCut(data) {
        this._widget.addNoteFromData(data.noteCut, data.time);
    }

    bombMissed(data) {
        this._widget.addNoteFromData(data.noteCut, data.time, true);
    }

}
