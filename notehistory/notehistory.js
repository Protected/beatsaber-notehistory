const ALLOWED_PARAMS = {
    saber: ["A", "B", ""],
    scrollDirection: ["down", "right", "up", "left"]
};

const RAD2DEG = 180.0 / Math.PI;

const NOTE_XT = 0.25;  //Note extent in game units
const SLICE_ARROW_MIN = 0.2;

const MAX_INITIAL_SCORE = 85;
const MAX_FINAL_SCORE = 115;

class NoteHistory {

    constructor(params) {
        this._params = params;
        this._track = document.getElementById("track");
        this._wraptrack = document.getElementById("wraptrack");  //For scrolling

        this._hand = this.setParam("saber", "");
        this._testmode = this.setParam("test", false);
        this._scale = this.setParam("scale", 1.0);
        this._max = this.setParam("max", 100);
        this._subBeatResolution = this.setParam("subBeatResolution", 1);
        this._subBeatClasses = this.setParam("subBeatStyle", "bg-line-used").replace(/[ .{}]/g, "").trim();

        this._showCuts = this.setParam("showCuts", true);
        this._showCutBacks = this.setParam("showCutBacks", false);
        this._showCutSides = this.setParam("showCutSides", false);
        this._showCenters = this.setParam("showCenters", false);
        this._showAvoidedBombs = this.setParam("showAvoidedBombs", false);
        this._badScoreMax = this.setParam("badScoreMax", 0.4);
        this._goodScoreMin = this.setParam("goodScoreMin", 0.9);
        
        this._scrollDirection = this.setParam("scrollDirection", "down");
        this._trackFromSpawn = this.setParam("trackFromSpawn", true);
        this._addEmptyBeats = this.setParam("addEmptyBeats", false) || this._trackFromSpawn;
        this._cutAreaPlacement = this.setParam("cutAreaPlacement", 0.3);

        this._subBeatClasses = (this._subBeatClasses ? this._subBeatClasses.split(",") : []);
        this._track.classList.add("saber" + (this._hand || "both").toLowerCase());

        this._songStart = null;
        this._songBPM = null;
        this._songJumpSpeed = null;
        this._songJumpBeatOffset = null;
        this._songPause = null;
        this._songPauseTime = null;
        this._realBeats = 0;

        this._containerTrack = [];
        this._noteTrack = [];
        this._notes = {};
        this._subBeatTimer = null;
    }

    setParam(name, def) {
        if (!this._params){
            return def;
        }
        if (ALLOWED_PARAMS[name] && ALLOWED_PARAMS[name].indexOf(this._params.get(name)) < 0) {
            return def;
        }
        if (this._params.get(name) == null) {
            return def;
        }
        let val = this._params.get(name);
        if (typeof def == "number") val = parseFloat(val);
        if (typeof def == "boolean") val = (val == "on"|| val == "true" || val == "yes" || val == "1");
        return val;
    }

    /* Note tracker control */

    clear() {
        this._containerTrack = [];
        this._noteTrack = [];
        this._notes = {};
        this._track.innerHTML = "";
        this._wraptrack.classList.remove("on");
    }

    getSubBeatElement(subbeat) {
        let element = document.getElementById("subbeat" + subbeat);

        if (!element) {
            element = document.createElement("div");
            element.id = "subbeat" + subbeat;
            element.innerHTML = '<div class="zoomer"></div>';
            element.className = "subbeat";

            for (let anotherclass of this._subBeatClasses) {
                element.classList.add(anotherclass);
            }

            if (this._scrollDirection != "up" && this._scrollDirection != "left" && this._track.firstElementChild) {
                this._track.insertBefore(element, this._track.firstElementChild);
            } else {
                this._track.appendChild(element);
            }

            this._containerTrack.push(element);
            this._realBeats += 1;
        }

        return element;
    }

    addNoteFromData(data, time, missed, spawn) {
        if (!data) return;
        
        //Reject notes on spawn if those are disabled.
        if (spawn && !this._trackFromSpawn) {
            return;
        }

        //If adding a note when it was spawned, add all notes with the color of this saber and bombs on this saber's side.
        if (spawn && this._hand && data.noteType != "Note" + this._hand && (data.noteType != "Bomb" || !this.correctSide(data))) {
            return;
        }

        //If adding or updating a cut note, add things cut by this saber, missed notes meant for this saber, and bombs on this saber's side.
        if (!spawn && this._hand && data.saberType != "Saber" + this._hand
                && (data.saberType || data.noteType != "Note" + this._hand)
                && (data.saberType || data.noteType != "Bomb" || !this.correctSide(data))) {
            return;
        }

        //Reject uncut bombs if those are disabled.
        if (!this._showAvoidedBombs && data.noteType == "Bomb" && (missed || spawn)) {
            return;
        }

        if (!time) time = Date.now();
        data.time = time;
        data.missed = missed;
        data.spawn = spawn;
    
        this.addNoteToTrack(data);
        if (!spawn && this._noteTrack.length > this._max) {
            this.removeNoteFromTrack();
        }
    }

    updateNoteFromData(data) {
        if (!data || !data.noteID || !this._notes[data.noteID]) return;
        this.updateNoteInTrack(data.noteID, data);
    }

    correctSide(data) {
        if (!data) return false;
        return !this._hand
            || this._hand == "A" && (data.noteLine == 0 || data.noteLine == 1)
            || this._hand == "B" && (data.noteLine == 2 || data.noteLine == 3)
        ;
    }

    wrongSaber(data) {
        if (!data) return false;
        return data.saberType == "SaberA" && data.noteType == "NoteB"
                || data.saberType == "SaberB" && data.noteType == "NoteA"
        ;
    }

    addNoteToTrack(data) {
        let subbeat, container, element;

        let existing = this._notes[data.noteID];

        //Create note or retrieve existing note

        if (existing) {
            subbeat = existing.subbeat;
            container = existing.container;
            element = existing.element;
        } else {
            subbeat = this.currentSubBeat(data.time);
            container = this.getSubBeatElement(subbeat);

            element = document.createElement("div");
            element.id = "note" + data.noteID;
            element.innerHTML = '<div class="sticker"></div>';

            element.classList.add("note");
            element.classList.add(data.noteType.toLowerCase());
            element.classList.add(data.noteCutDirection.toLowerCase());
            element.classList.add("line" + data.noteLine);
            element.classList.add("layer" + data.noteLayer);

            if (data.noteType != "Bomb") {
                this.addStickerToNote(element, "color");
            }
        }

        //Stickers 'n stuff

        if (data.missed) {
            this.addStickerToNote(element, "missed");
        }

        if (data.noteType != "Bomb" && !data.spawn) {
            let scoreNormalized = data.initialScore * 1.0 / MAX_INITIAL_SCORE;
            if (scoreNormalized < this._badScoreMax) {
                element.classList.add("bad");
                this.addStickerToNote(element, "bad", "Bad cut!");
            }
            if (scoreNormalized > this._goodScoreMin) {
                element.classList.add("good");
                this.addStickerToNote(element, "good", "Good cut!");
            }
        }

        let slice, sliceback, slicesidea, slicesideb;
        let colorsource = "goodsaber", backsource = "goodback";
        if (data.saberType && this._showCuts) {

            if (this._showCutBacks) {
                sliceback = this.addSliceToNote(element, "aux back");
            }

            if (this._showCutSides) {
                slicesidea = this.addSliceToNote(element, "aux sidea");
                slicesideb = this.addSliceToNote(element, "aux sideb");
            }

            slice = this.addSliceToNote(element, "front", true);
        }

        if (this._showCenters) {
            let ch = this.addStickerToNote(element, "crosshair");
            ch.innerHTML = '<div class="chleft"></div><div class="chright"></div>';
        }

        if (data.noteType != "Bomb" && data.saberType && !data.directionOK) {
            this.addStickerToNote(element, "reversed", "Wrong direction");
        }

        if (data.noteType == "Bomb" && !data.missed || this.wrongSaber(data)) {
            this.addStickerToNote(element, "wrong", "Shouldn't have cut");
            colorsource = backsource = data.saberType.toLowerCase();
        }

        if (data.saberType && this._showCuts) try {
            //Try to draw the slice but give up if it's outside the note

            let [nearStart, nearEnd] = this.calculateNoteSlicePoints(data, -1);

            if (!this.setSliceStyle(slice, this.noteCutToCssSlice(nearStart, nearEnd), colorsource)) {
                this.removeStickerFromNote(element, "slice");
            } else if (this._showCutBacks || this._showCutSides) {

                let [farStart, farEnd] = this.calculateNoteSlicePoints(data, 1);

                if (this._showCutBacks) {
                    if (!this.setSliceStyle(sliceback, this.noteCutToCssSlice(farStart, farEnd), backsource, 0.03)) {
                        this.removeStickerFromNote(element, "slice back");
                    } else if (this._showCutSides) {
                        if (!this.setSliceStyle(slicesidea, this.noteCutToCssSlice(nearStart, farStart), backsource, 0.02)) {
                            this.removeStickerFromNote(element, "slice sidea");
                        }
                        if (!this.setSliceStyle(slicesideb, this.noteCutToCssSlice(nearEnd, farEnd), backsource, 0.02)) {
                            this.removeStickerFromNote(element, "slice sideb");
                        }
                    }
                }
            }
        } catch (e) { console.warn(e); }

        //Store or update note

        if (existing) {

            existing.note = data;

        } else {

            if (container.firstElementChild.firstElementChild) {
                element.classList.add("stacking");
            } else {
                container.classList.add("used");
            }
            container.firstElementChild.appendChild(element);

            let note = {
                note: data,
                element: element,
                subbeat: subbeat,
                container: container
            };
            this._noteTrack.push(note);
            this._notes[note.note.noteID] = note;
        }

        //Update scroll

        if (!data.spawn) {
            this.scrollToCutArea();
        }
    }

    updateNoteInTrack(noteID, data) {
        let note = this._notes[noteID];
        for (let key in data) {
            note.note[key] = key;
        }
        
        note.element.classList.remove("bad");
        note.element.classList.remove("good");

        let scoreNormalized = data.finalScore * 1.0 / MAX_FINAL_SCORE;

        if (scoreNormalized < this._badScoreMax) {
            note.element.classList.add("bad");
            if (!note.element.classList.contains("bad")) {
                this.addStickerToNote(note.element, "bad", "Bad cut!");
            }
        } else {
            this.removeStickerFromNote(note.element, "bad");
        }

        if (scoreNormalized > this._goodScoreMin) {
            note.element.classList.add("good");
            if (!note.element.classList.contains("good")) {
                this.addStickerToNote(note.element, "good", "Good cut!");
            }
        } else {
            this.removeStickerFromNote(note.element, "good");
        }

        if (data.finalScore == MAX_FINAL_SCORE) {
            this.addStickerToNote(note.element, "perfect", "Perfect!");
        }
    }

    addStickerToNote(element, classname, title) {
        if (!element || !classname) return null;
        let extra = document.createElement("div");
        extra.className = classname;
        if (title) extra.title = title;
        element.firstElementChild.appendChild(extra);
        return extra;
    }

    removeStickerFromNote(element, classname) {
        if (!element || !classname) return;

        if (Array.isArray(classname)) {
            for (let actualclassname of classname) {
                this.removeStickerFromNote(element, actualclassname);
            }
            return;
        }

        let sticker, stickers = Array.from(element.getElementsByClassName("sticker")[0].getElementsByClassName(classname));
        while (sticker = stickers.shift()) {
            sticker.remove();
        }
    }

    addSliceToNote(element, extraclass, haspoint) {
        let slice = this.addStickerToNote(element, "slice" + (extraclass ? " " + extraclass : ""));
        slice.innerHTML = '<div class="anchor"><div class="trunk"></div>' + (haspoint ? '<div class="tri"></div>' : '') + '</div>';
        return slice;
    }

    setSliceStyle(element, slicedata, colorsource, linewidth) {
        if (!element || !slicedata) return false;
        if (!colorsource) colorsource = "slash";

        let x = slicedata.x;
        let y = slicedata.y;
        if (x < 0 || x > 1 || y < 0 || y > 1) { /*console.log("Out of bounds", slicedata);*/ return false; }

        let length = slicedata.length;
        if (!linewidth) length = Math.max(length, SLICE_ARROW_MIN);
        if (length > Math.SQRT2) return false;

        element.style.setProperty("--slice-x", x);
        element.style.setProperty("--slice-y", y);
        element.style.setProperty("--slice-length", length);
        element.style.setProperty("--slice-angle", slicedata.angle + "deg");
        element.style.setProperty("--slice-color", "var(--" + colorsource + "-color)");

        if (linewidth) {
            element.style.setProperty("--slice-width", (linewidth * 100) + "%");
            element.style.setProperty("--slice-trigap", "0px");
        }
        return true;
    }

    removeNoteFromTrack() {
        if (!this._noteTrack.length) return;
        let note = this._noteTrack.shift();
        delete this._notes[note.note.noteID];
        note.element.remove();

        if (!note.container.childElementCount) {
            while (this._containerTrack[0] != note.container) {
                this._containerTrack.shift().remove();
                this._realBeats -= 1;
            }
            note.container.remove();
        }
    }

    /* Slice calculations */
    
    dot(a, b) {
        return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    }

    vecSum(a, b) {
        return a.map((x, i) => a[i] + b[i]);
    }

    vecSub(a, b) {
        return a.map((x, i) => a[i] - b[i]);
    }

    vecProd(a, n) {
        return a.map(x => x * n);
    }

    swap(a, b) {
        return [b, a];
    }

    rayPlaneIntersect(rayStart, rayDir, planePoint, planeNormal) {
        let x = this.dot(rayDir, planeNormal);
        if (!x) throw {m: "Parallel", rayStart, rayDir, planePoint, planeNormal};
        let t = this.dot(planeNormal, this.vecSub(rayStart, planePoint)) / -x;
        return this.vecSum(this.vecProd(rayDir, t), rayStart);
    }

    calculateNoteSlicePoints(data, zoffset) {
        let yflip = data.cutNormal[0] < 0 ? 1 : -1;
        let start = this.rayPlaneIntersect([-NOTE_XT, NOTE_XT * yflip, NOTE_XT * zoffset], [1, 0, 0], data.cutPoint, data.cutNormal);
        let end = this.rayPlaneIntersect([-NOTE_XT, -NOTE_XT * yflip, NOTE_XT * zoffset], [1, 0, 0], data.cutPoint, data.cutNormal);

        if (Math.abs(start[0]) > NOTE_XT) {
            start = this.rayPlaneIntersect([NOTE_XT * Math.sign(start[0]), -NOTE_XT, NOTE_XT * zoffset], [0, 1, 0], data.cutPoint, data.cutNormal);
        } 
        if (Math.abs(end[0]) > NOTE_XT) {
            end = this.rayPlaneIntersect([NOTE_XT * Math.sign(end[0]), -NOTE_XT, NOTE_XT * zoffset], [0, 1, 0], data.cutPoint, data.cutNormal);
        }

        return [start, end];
    }

    noteCutToCssSlice(start, end) {
        let cut = this.vecSub(end.slice(0, 2), start.slice(0, 2));

        return {
            x: (start[0] + NOTE_XT) / (2 * NOTE_XT),
            y: 1 - (start[1] + NOTE_XT) / (2 * NOTE_XT),
            angle: Math.atan2(cut[0], cut[1]) * RAD2DEG - 180,
            length: Math.sqrt(cut[0] * cut[0] + cut[1] * cut[1]) / (2 * NOTE_XT),
            /*
            absCut: cut,
            noteCut: this.vecProd(cut, 1 / (2 * NOTE_XT)),
            start: start,
            end: end
            */
        }
    }


    /* Scroll */

    get subbeatHeightInPixels() {
        if (!this._track.lastElementChild) return 0;
        let style = getComputedStyle(this._track.lastElementChild);
        return this._track.lastElementChild.clientHeight + Math.max(parseInt(style.marginTop), parseInt(style.marginBottom));
    }

    get subbeatWidthInPixels() {
        if (!this._track.lastElementChild) return 0;
        let style = getComputedStyle(this._track.lastElementChild);
        return this._track.lastElementChild.clientWidth + Math.max(parseInt(style.marginLeft), parseInt(style.marginRight));
    }

    get halfJumpDuration() {
        if (!this._songBPM) return null;
        
        let beatDurationInSeconds = 60.0 / this._songBPM;

        let halfJumpDuration = 4.0;
        while (this._songJumpSpeed * beatDurationInSeconds * halfJumpDuration > 18) {
            halfJumpDuration /= 2;
        }
        
        halfJumpDuration += this._songJumpBeatOffset;
        if (halfJumpDuration < 1) halfJumpDuration = 1;

        return halfJumpDuration;
    }

    spawnDistanceInPixels() {
        if (!this._songBPM) return null;
        if (!this._trackFromSpawn) return 0;

        let result = this.halfJumpDuration * 2.0 * this._subBeatResolution;
        if (this._scrollDirection == "left" || this._scrollDirection == "right") {
            result *= this.subbeatWidthInPixels;
         } else {
            result *= this.subbeatHeightInPixels;
         }

         return result;
    }

    scrollToBottom() {
        if (this._scrollDirection == "down") {
            this._track.style.top = this._wraptrack.clientHeight - this._track.clientHeight + "px";
        }
        if (this._scrollDirection == "right") {
            this._track.style.left = this._wraptrack.clientWidth - this._track.clientWidth + "px";
        }
    }

    scrollToCutArea() {
        if (!this._songBPM) return;
        if (this._scrollDirection == "up") {
            this._track.style.top = -(this._realBeats * this.subbeatHeightInPixels) + this.spawnDistanceInPixels() + this._wraptrack.clientHeight * this._cutAreaPlacement + "px";
        }
        if (this._scrollDirection == "down") {
            this._track.style.top = - this.spawnDistanceInPixels() + this._wraptrack.clientHeight * this._cutAreaPlacement + "px";
        }
        if (this._scrollDirection == "left") {
            this._track.style.top = -(this._realBeats * this.subbeatWidthInPixels) + this.spawnDistanceInPixels() + this._wraptrack.clientWidth * this._cutAreaPlacement + "px";
        }
        if (this._scrollDirection == "right") {
            this._track.style.left = - this.spawnDistanceInPixels() + this._wraptrack.clientWidth * this._cutAreaPlacement + "px";
        }
    }

    /* Setup */

    show() {
        this._wraptrack.classList.add("on");
    }

    setMapStyleFromData(data) {
        document.getElementById("mapstyle").innerHTML = `
            .track {
                --sabera-color: rgb(` + data.beatmap.color.saberA.join(",") + `);
                --saberb-color: rgb(` + data.beatmap.color.saberB.join(",") + `);
            }
        `;
    }

    setScaleStyle() {
        document.getElementById("track").style.setProperty("--scale", this._scale);
    }

    /* Song timer */

    songStart(data, starttime) {
        this._songStart = starttime || Date.now();
        this._songBPM = data.beatmap.songBPM;
        this._songJumpSpeed = data.beatmap.noteJumpSpeed || 10;
        this._songJumpBeatOffset = data.beatmap.noteJumpStartBeatOffset;
        this._songPause = 0;
        this._songPauseTime = null;
        this._realBeats = 0;

        if (this._addEmptyBeats && !this._testmode) {
            this._subBeatTimer = setInterval(function() {
                this.getSubBeatElement(this.currentSubBeat());
                this.scrollToCutArea();
            }.bind(this), 60000 / this._songBPM / this._subBeatResolution / 2);
        }
    }

    songStop() {
        this._songStart = null;
        this._songBPM = null;
        this._songJumpSpeed = null;
        this._songJumpBeatOffset = null;
        this._songPause = null;
        this._songPauseTime = null;
        this._realBeats = 0;
        if (this._subBeatTimer) {
            clearInterval(this._subBeatTimer);
            this._subBeatTimer = null;
        }
    }

    songPause(pausetime) {
        if (!this._songStart || this._songPause) return;
        this._songPause = pausetime || Date.now();
    }

    songResume() {
        if (!this._songStart || !this._songPause) return;
        this._songPauseTime += Date.now() - this._songPause;
        this._songPause = null;
    }

    currentSubBeat(now) {
        if (!this._songStart) return null;
        let songNow = (this._songPause || now || Date.now()) - this._songStart - this._songPauseTime;
        return Math.floor(songNow / 60000 * this._songBPM * this._subBeatResolution);
    }

}
