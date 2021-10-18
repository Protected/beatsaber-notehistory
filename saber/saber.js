const ALLOWED_PARAMS = {
    saber: ["A", "B", ""]
};

class Saber {

    constructor(params) {
        this._params = params;
        this._saber = document.getElementById("saber");

        this._hand = this.setParam("saber", "B");
        this._testmode = this.setParam("test", false);
        this._scale = this.setParam("scale", 1.0);


        this._saber.addEventListener("animationend", () => {
            this._saber.classList.remove("flash");
        });
    }

    setParam(name, def) {
        if (!this._params){
            return undefined;
        }
        if (ALLOWED_PARAMS[name] && ALLOWED_PARAMS[name].indexOf(this._params.get(name)) < 0) {
            return def;
        }
        if (this._params.get(name) == null) {
            return def;
        }
        let val = this._params.get(name);
        if (typeof val == "number") val = parseFloat(val);
        if (typeof val == "boolean") val = (val == true || val == "true");
        return val;
    }

    /* Saber control */

    showSaber() {
        this._saber.innerHTML = '<div class="sticker"></div>';

        this._saber.classList.add("saber" + this._hand.toLowerCase());

        this.addSticker("base");
        this.addSticker("glow");
        this.addSticker("color");

        this._saber.classList.add("on");
    }

    hideSaber() {
        this._saber.innerHTML = "";
        this._saber.className = "saber";
    }

    addSticker(classname, title) {
        if (!classname) return null;
        let extra = document.createElement("div");
        extra.className = classname;
        if (title) extra.title = title;
        this._saber.firstElementChild.appendChild(extra);
        return extra;
    }

    setMapStyleFromData(data) {
        document.getElementById("mapstyle").innerHTML = `
            .saber {
                --sabera-color: rgb(` + data.beatmap.color.saberA.join(",") + `);
                --saberb-color: rgb(` + data.beatmap.color.saberB.join(",") + `);
            }
        `;
    }

    setScaleStyle() {
        this._saber.style.setProperty("--scale", this._scale);
    }

    flash() {
        if (this._saber.classList.contains("flash")) {
            this._saber.classList.remove("flash");
            this._saber.offsetWidth;
        }
        this._saber.classList.add("flash");
    }

}
