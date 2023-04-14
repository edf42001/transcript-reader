// TODO: Is there any way of doing this?
// import parseAndShortenTranscript from "../transcript_reader.js";

let exampleText = "[00:00.000 --> 00:02.000] お願いします\n[00:02.000 --> 00:05.000] さあRTNJP続きましては\n[01:00:05.000 --> 00:07.000] ジオゲッサー日本マップのお時間です"
let newTranscript = parseAndShortenTranscript(exampleText);
console.log(newTranscript);