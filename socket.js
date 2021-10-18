const query = new URLSearchParams(document.location.search);

function include(file) {
    let script  = document.createElement('script');
    script.src  = file;
    script.type = 'text/javascript';
    script.defer = true;
    document.getElementsByTagName('head').item(0).appendChild(script);
}

function connect(events) {
    let ip = query.get("ip") || "localhost";
    let port = query.get("port") || 6557;

    let socket = new WebSocket(`ws://${ip}:${port}/socket`);

    socket.addEventListener("open", () => {
        console.log("WebSocket opened");
    });

    socket.addEventListener("message", (message) => {
        let data = JSON.parse(message.data);
        console.log ("-> " + data.event);
        let event = events[data.event];

        if (event) {
            event.call(events, data);
        }
    });

    socket.addEventListener("close", () => {
        console.log("Failed to connect to server, retrying in 5 seconds");
        setTimeout(() => { connect(events); }, 5000);
    });
}

let widget = null, events = null;

document.addEventListener("DOMContentLoaded", () => {
    let mode = query.get("prop");

    if (mode == "saber") {

        include("saber/saber.js");
        include("saber/events.js");

        setTimeout(function () {
            widget = new Saber(query);
            events = new Events(widget);

            widget.setScaleStyle();

            if (!query.get("test")) {
                connect(events);
            } else {
                widget.showSaber();
            }
        }, 100);

    } else {

        include("notehistory/notehistory.js");
        include("notehistory/events.js");
        if (query.get("test")) include("notehistory/example.js");

        setTimeout(function() {
            widget = new NoteHistory(query);
            events = new Events(widget);

            widget.setScaleStyle();

            if (!query.get("test")) {
                connect(events);
            } else {
                for (let data of example) {
                    let event = events[data.event];
                    if (event) {
                        event.call(events, data);
                    }
                }
            }

        }, 100);
    }
});
