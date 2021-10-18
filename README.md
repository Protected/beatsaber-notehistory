# Note History

A widget that tracks Beat Saber notes in a 2D interface in real time. It can be used as a local display or added as a Browser source in OBS for videos and streams.

Created by [Protected](https://github.com/Protected/). Contains cut intersection algorithms and vector math by [opl-](https://github.com/opl-/).

**Requires:** The [Beat Saber HTTP Status](https://github.com/opl-/beatsaber-http-status/releases) mod for Beat Saber. It's usually available on Mod Assistant, and when it isn't it's usually because there was an update and the previous version still works.

**Source URL:** `https://protected.github.io/beatsaber-notehistory` (or set up your own!)

**[Quick OBS Setup](#quick-obs-setup)** - It's the same as every other widget!

**[Settings](#settings)** - We have many settings you can use without setting up your own copy of NH.

**[Styles and customization](#styles-and-customization)** - How the widget is structured so you can change its look and feel.

**[Reporting issues and getting help](#reporting-issues-and-getting-help)**

![Some schmuck using the widget](example.png)

## Quick OBS Setup

Note that you may want to use multiple instances of this widget at the same time. That's fine! These instructions are for setting up one instance of the widget.

1. Add a new **Browser source** to your Scene.
2. Fill in the **Source URL** (from the top of this page) including the settings you want (read below).
3. Set the width and height. By default, the width should be __144 times SCALE__ where SCALE is the value of your `scale` setting (by default it's 1) and the height is whatever you want.

If you want to adjust the position of the source, add the `test=1` setting to the URL, position the source, then go to properties and remove it.

## Settings

Settings can be added to the end of the Source URL in the format `?key=value&key=value&...`

### `ip` and `port`

Listen to events from another IP and/or port. Changing the IP is only needed if the computer running Beat Saber is not the same as the client computer accessing Note History.

Point the `ip` setting to the IP address of the computer running Beat Saber.

If you need to change the `port`, make sure you also change it in the settings of Beat Saber HTTP Status.

### `saber`

Can be **A**, **B** or empty. The default is empty.

Sets which saber is being tracked by the widget. Everything sliced by that saber will be displayed, as well as missed notes with the color of that saber. If showAvoidedBombs is on, missed bombs on the side of that saber are also added.

If set to empty, the widget will track both sabers at the same time and display everything.

### `test`

Set to true to display test data for setup purposes. In test mode the widget doesn't connect to the game.

### `scale`

Use this setting to scale the entire widget. The default is **1.0**; multiples will "zoom in" and fractions will "zoom out".

Note that scaling will change the width of the widget.

### `max`

The maximum number of notes kept in memory before the older ones are deleted. Set to a number greater than what fits on your screen during a dense map.

Default is **100** (which should be enough for most players). Increase if you play very densely packed maps and decrease if you have a very small display.

### `subBeatResolution`

How to aggregate together notes that were played close in time.

Note History displays notes together in **subbeats** in order to pack more information on the screen at the same time. A subbeat is a subdivision of a beat.

Default value for the parameter is **1**, meaning all notes cut in the same beat will be displayed together. Increasing the value further subdivides the beat - for example, 4 means every subbeat is a quarter beat.

### `showCuts`

Whether to show an arrow on each cut note/bomb representing how the cut intersected with the note's closest face.

This setting is on by default, so set it to false to disable all cut information.

### `showCutBacks`

Set to true to show a thin line on a cut note/bomb representing how the cut intersected with the note's farthest face.

Requires `showCuts`.

### `showCutSides`

Set to true to draw thin lines on a cut note/bomb between the cut arrow and the back of the cut plane.

Requires `showCuts`.

### `showCenters`

Set to true to draw a small marker on the center of each note.

### `showAvoidedBombs`

Set to true so avoided bombs are added to the track of the saber they are closest to (saber A: lines 0 and 1; saber B: lines 2 and 3).

By default, avoided bombs are not displayed.

### `badScoreMax` and `goodScoreMin`

Values between 0 (minimum score) and 1 (maximum score).

If a cut fails or has a score between 0 and badScoreMax, the note will have a grey halo around it (default style) signifying it was a bad cut.

If a cut has a score between goodScoreMin and 1, the note will have a larger halo of the color of the note around it, signifying it was a good cut. A further highlight is applied if the cut is deemed perfect after you complete the swing.

Default badScoreMax is **0.4** and goodScoreMin is **0.9**.

### `scrollDirection`

Can be **down**, **right**, **up** or **left**. The default is **down**.

Controls how to scroll the track and where to add subbeats in the track:

- If set to **down**, subbeats will be prepended at the top of the track and notes will scroll down vertically.
- If set to **right**, subbeats will be prepended at the top of the track and the track will scroll right horizontally.
- If set to **up**, subbeats will be appended at the bottom of the track and notes will scroll up vertically.
- If set to **left**, subbeats will be appended at the bottom of the track and the track will scroll left horizontally.

Note that changes in this setting may have to be complemented with changes in the stylesheet for the widget to work the way you want.

### `trackFromSpawn`

The default is true, meaning notes are tracked from the moment they are created in the game world and updated when they are cut and when the saber swing is completed.

Set to false to only track notes from the moment of the cut. 

### `addEmptyBeats`

If set to true a timer is run during the song that adds every subbeat to the track, even if no notes were cut, making notes scroll away during breaks in the map (consistent scrolling).

By default subbeats are only added when a note is cut or missed.

### `cutAreaPlacement`

A value between 0 (top of the track) and 1 (botton of the track). It represents roughly how far down the track incoming notes will be when the player cuts or misses them.

The default is **0.3**, meaning cuts will appear roughly 30% down the track. This is calibrated for 1920x1080. If you play at very high resolutions you can probably decrease this value. It may be possible to increase it if you play at lower resolutions.

You can set this value to 0 if you don't want to use `trackFromSpawn`.

### `prop`

Set to **saber** to show a representation of a saber instead of the note track. 

Use in conjunction with the `saber` setting. The sabers are colored in the colors of the current map and flash when they hit something. If no map is playing and `test` mode is off, the saber will be hidden.

## Styles and customization

The widget is styled in `style.css`. You can create your own style if you run your own copy of the widget instead of using the public URL above.

If you're using **OBS Studio**, you can instead add custom styles by opening the Properties of the Browser source and using the Custom CSS field.

> **Warning:** Note History leverages the CSS `mask` property when coloring the notes using map-provided saber colors. However, due to a known bug in Chrome and other major browsers, this property will not work if the mask is being loaded from a local file. To ensure proper note rendering, if you are running a local copy of Note History, make sure all `mask`s are be loaded from the web.

While a map is being played, the widget's content is structured like this:

```
.track
    .subbeat
        ...
            .note
                .sticker
                    ...
            .note
            .note
            ...
    .subbeat
    .subbeat
    ...
```

New `.subbeat` containers are appended or prepended when notes are spawned/cut/missed according to `scrollDirection`, and by `addEmptyBeats`. The subbeat depends on the time since start of the map; if the current subbeat already has a container, notes are appended to it.

Notes are discarded in accordance with the `max` setting. When the player is not in a map, `.track` is empty.

### `.subbeat` classes

* `.used`: Notes have been added to the container. If this class is missing, the container was added as an empty container.

### `.note` classes

All of these additional classes can appear in note block elements.

* `.notea`, `.noteb` and `.bomb`: The type of note.

* `.up`, `.down`, `.left`, `.right`, `.upleft`, etc.: The direction of the note.

* `.line0` - `.line3`: The line of the note. Lines are vertical and count from left (0) to right (3).

* `.layer0` - `.layer2`: The layer of the note. Layers are horizontal and go from bottom (0) to top (2).

* `.bad` and `.good`: The quality of the cut (if the note was cut) in accordance with `badScoreMax` and `goodScoreMin`.

* `.stacking`: Added if the note is not the first note in the subbeat.

### Stickers

Stickers are individual block elements optionally layered inside `.note > .sticker` when warranted.

* `.color`: Layer used for colorizing the note (not added to bombs). You can apply color-based styles to notes using `var(--sabera-color)` and `var(--saberb-color)`. By default a flat colored square, masked with the note picture.

* `.missed`: Layer added to all notes that were not cut. By default darkens the note.

* `.bad` and `.good`: Layer added depending on the quality of the cut (if the note was cut) in accordance with `badScoreMax` and `goodScoreMin`.

* `.slice`: Layers added to notes that were cut containing lines representing the cut slice. The lines are animated to `var(--slash-color)` if the cut was correct or to `var(--sabera-color)`/`var(--saberb-color)` if it was incorrect. Can be marked with the additional classes `.front`, `.back`, `.sidea`, `.sideb` and `.aux` (which applies to all lines except `.front` .)

* `.crosshair`: Contains the indicator of where the center of the note is.

* `.reversed`: Layer added to notes that were cut in the wrong direction. Unused by default.

* `.wrong`: Layer added to notes with an incorrect cut (wrong saber or slicing a bomb).

* `.perfect`: Layer added to notes with maximum score after the conclusion of the saber swing that cut them.

### Icons

Note History uses the images of notes, bombs and sabers found in the `icon/` folder in PNG format. You can edit them to customize the aspect of notes, bombs and sabers. Make sure you use shades of grey, so the images can be automatically colored with the current map's saber colors.

If you want to resize the icons, you will have to edit the stylesheet to account for the new sizes. The default sizes are fairly large and should render nicely even if you are upscaling the widget, though.

The `svg/` folder contains the SVG originals for all the icons. You can use these to produce higher quality PNGs or to make changes. All images were created for this project and are covered under this project's license unless otherwise specified.

## Reporting issues and getting help

**If you found a bug or have a sensible feature suggestion**, please open a ticket in the github repository where you found the widget. No other communication methods will be accepted. 

Always communicate your issue clearly and explain in detail what steps can be taken to reproduce it and what exactly is going wrong.

**You can open pull requests** with changes and styles you made. Please mind the contributing guidelines.

**If you need help, Discord is the best place to get it**. Be patient, don't ask for permission to ask your question, don't bump/repeat your message.
