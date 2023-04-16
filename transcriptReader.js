var lines = Array(); // The raw lines of text from the audio transcript
var player;  // The youtube video player
var timestamps; // Store float time in seconds for each line in the transcript

var youtubeVideoID = "qy_jFczWM9s";  // Video ID of youtube video to load

function readFile() {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';

    fileInput.onchange = function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();

        reader.readAsText(file);

        reader.onload = function() {
            document.getElementById('inputText').value = parseAndShortenTranscript(reader.result);
        }
    }

    fileInput.click();
}


function parseAndShortenTranscript(transcript) {
    // Takes text in the form of
    // [00:00.000 --> 00:29.640] Hello
    // [01:00:29.640 --> 00:39.080] There
    // and converts it to
    // [00:00] Hello
    // [01:00:29] There

    // First, split into lines
    lines = transcript.split("\n");

    // Also calculate timestamps here
    timestamps = Array(lines.length);

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

        // The hour numbers get added only if the time is over an hour
        let timeSplits = timeStampLeft.split(":");
        let hourFormat = (timeSplits.length == 3);
        let hours = hourFormat ? parseInt(timeSplits[0]) : 0;
        let minutes = parseInt(hourFormat ? timeSplits[1] : timeSplits[0]);
        let seconds = parseInt(hourFormat ? timeSplits[2] : timeSplits[1]);

        timestamps[i] = hours * 3600 + minutes * 60 + seconds;

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

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '540',
        width: '960',
        videoId: youtubeVideoID,
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0,
            'showinfo': 0
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    // Whenever the state of the video changes (pause, time skip, etc, scroll to the right spot)
    scrollToTime();
}

function scrollToTime() {
    // Get the current time of the video
    var currentTime = player.getCurrentTime();

    // find current time line
    let line = 0;
    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] > currentTime) {
            line = i;
            break;
        }
    }

    const textArea = document.getElementById('inputText');
    // Calculate the pixel height of each line
    const lineHeight = parseInt(window.getComputedStyle(textArea).lineHeight);
    
    // Scroll to the specified line
    // Use this instead of scroll-behavior: smooth because that interferes with yomichan's ability to read apparetnly
    textArea.scroll({
      top: ((line - 1) - 1) * lineHeight, 
      left: 0, 
      behavior: 'smooth'
    });
}

function highlightCurrentText() {
    // Check if nothing has been loaded yet
    if (lines.length == 0) {
        return;
    }

    // Moves a transparent div onto the screen to highlight the current words that are being said
    var currentTime = player.getCurrentTime();

    // Get top left corner of textarea. Apparently, jquery returns an array
    const textLeft = $('#inputText')[0].offsetLeft;
    const textTop = $('#inputText')[0].offsetTop;

    const highlightDiv = document.getElementById('textHighlight');

    const timestampOffset = 100; // Offset from left of text area because timestamps take up space
    const underlineOffset = 22;  // To position the underline under the line

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
    xOffset = timestampOffset + xOffset * (lines[lineNumber-1].length * 12 - timestampOffset);

    const yOffset =  desiredScroll -  currentScroll + underlineOffset;
    highlightDiv.style.left = (textLeft + xOffset) + 'px';
    highlightDiv.style.top = (textTop + yOffset) + 'px';

}

// Make it so we can pause and unpause the youtube video with space
window.addEventListener('keydown', function(event) {
    // Check if the space bar is pressed (32). k = 75
    if (event.which === 32) {
        event.preventDefault(); // Disable the "space scrolls down" feature but only if spacebar is the key presse
        // If playing, pause, otherwise, play
        if (player.getPlayerState() == 1) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }
});

//  Automatically scroll to current position in the textarea
setInterval(scrollToTime, 7500);

// Highlight the current time in the video with a red underline (approximatley)
setInterval(highlightCurrentText, 250);
