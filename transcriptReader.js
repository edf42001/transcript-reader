function readFile() {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';

    fileInput.onchange = function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();

        reader.onload = function() {
            document.getElementById('inputText').value = parseAndShortenTranscript(reader.result);
        }

        reader.readAsText(file);
    }

    fileInput.click();
}

var lines;

function parseAndShortenTranscript(transcript) {
    // Takes text in the form of 
    // [00:00.000 --> 00:29.640] Hello
    // [01:00:29.640 --> 00:39.080] There
    // and converts it to
    // [00:00] Hello
    // [01:00:29] There

    // First, split into lines
    lines = transcript.split("\n");

    let newTranscript = ""

    // For each line, modify the line by extract the bit before and after the `]`
    // Then, extract the timestamp from the left bit, cutting off the decimal points
    // Stich in all back together
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let timestampSplit = line.split("]");

        if (line.length == 0) {  // Sometimes the line is empty at the end of the file
            continue;
        }

        let timeStamp = timestampSplit[0];
        let sentence = timestampSplit[1].substring(1); // Remove space at index 0
        let timeStampLeft = timeStamp.split("-->")[0];
        timeStampLeft = timeStampLeft.substring(1, timeStampLeft.indexOf('.'));

        let newLine = "[" + timeStampLeft + "] " + sentence + "\n";
        newTranscript += newLine;
    }

    return newTranscript.substring(0, newTranscript.length - 1); // Remove newline
}
        
document.addEventListener('contextmenu', function(event) {
    var selectedText = window.getSelection().toString();
    if (selectedText) {
        event.preventDefault();
        var url = "https://jisho.org/search/" + encodeURIComponent(selectedText);
        var iframe = document.getElementById("jisho-iframe");
        iframe.src = url;
    }
});
        
var player;
var timestamps; // Store float time in seconds for each line in the transcript

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '540',
        width: '960',
        videoId: 'XnY2CD4cCPk',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0,
            'showinfo': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // do something when player is ready
    console.log("Ready");
}

function onPlayerStateChange(event) {
    // do something when player state changes
    console.log("State changed");
    scrollToTime();
}

function scrollToTime() {
    // Get the current time of the video
    var currentTime = player.getCurrentTime();

    var transcript = document.getElementById('inputText').value;
    const lines = transcript.split("\n");
    timestamps = Array(lines.length);
    for (let i = 0; i < lines.length; i++) {
        const timestamp = lines[i].substring(1, 6);
        let minutes = parseInt(timestamp.split(":")[0]);
        let seconds = parseInt(timestamp.split(":")[1]);
        timestamps[i] = minutes * 60 + seconds;
    }

    // find current time line
    line = 0;
    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] > currentTime) {
            line = i;
            break;
        }
    }

    const textArea = document.getElementById('inputText');
    // Calculate the pixel height of each line
    const lineHeight = parseInt(window.getComputedStyle(textArea).lineHeight);
    // Set the scrollTop property to scroll to the specified line
    textArea.scrollTop = ((line - 1) - 1) * lineHeight;
}

function highlightCurrentText() {
    // Moves a transparent div onto the screen to highlight the current words that are being said
    var currentTime = player.getCurrentTime();

    // Get top left corner of textarea
    // const textLeft = $('#inputText').position().left;
    // const textTop = $('#inputText').position().top;
    
    // Hardcode for now
    const textLeft = 10;
    const textTop = 555;

    const highlightDiv = document.getElementById('textHighlight');

    // find current time line
    lineNumber = 0;
    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] > currentTime) {
            lineNumber = i;
            break;
        }
    }

    const textArea = document.getElementById('inputText');
    const lineHeight = parseInt(window.getComputedStyle(textArea).lineHeight);
    const currentScroll = textArea.scrollTop;
    const desiredScroll = (lineNumber - 1) * lineHeight;

    // Interpolate horizontally as well. Looks like there is an off by one error (subtract 1?)
    let xOffset = (currentTime - timestamps[lineNumber-1]) / (timestamps[lineNumber] - timestamps[lineNumber-1])
    xOffset = 100 + xOffset * (lines[lineNumber-1].length * 12 - 100); // TODO What is this?
    console.log(xOffset, lines[lineNumber-1].length);
    const yOffset =  desiredScroll -  currentScroll + 19; // Plus to put it at the bottom
    highlightDiv.style.left = (textLeft + xOffset) + 'px';
    highlightDiv.style.top = (textTop + yOffset) + 'px';

}

setInterval(scrollToTime, 7500);
setInterval(highlightCurrentText, 250);


window.addEventListener('keydown', function(event) {
    // Check if the space bar is pressed (32). k = 75
    if (event.which === 32) {
        // If playing, pause, otherwise, play
        if (player.getPlayerState() == 1) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }
});
