class Events {

    constructor(widget) {
        this._widget = widget;
    }

    songStart(data) {
        this._widget.setMapStyleFromData(data.status);
        this._widget.showSaber();
    }

    menu() {
        this._widget.hideSaber();
    }

    finished() {
        this._widget.hideSaber();
    }

    failed() {
        this._widget.hideSaber();
    }

    noteCut(data) {
        this._widget.flash();
    }

    bombCut(data) {
        this._widget.flash();
    }

}
