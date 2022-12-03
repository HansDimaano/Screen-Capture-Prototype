/////// This video recorder API uses MediaDevices.getUserMedia() method, MediaRecorder() constructor, and MediaDevices.getDisplayMedia() method.

// Reference for MediaDevices.getUserMedia(): https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
// Reference for MediaRecorder(): https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
// Reference for MediaDevices.getDisplayMedia(): https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API

// Preview Video Variable
const previewVideo = document.getElementById("preview-video");

// Chunks Array for creating Video File
let chunks = [];

// Constraints for the Audio Recording
const audioConstraints = {

	// Set the audio to true and video to false
	audio: true,
	video: false,
};

// Constraints for the Screen Recording
const screenConstraints = {

	// Set video to Screen MediaSource and Cursor to being visible always
	video: {
		mediaSource: 'screen',
		cursor: 'always'
	},

	// Set audio to Echo Cancellation, Noise Suppression, and 44100 Sample Rate
	audio: {
		echoCancellation: true,
		noiseSuppression: true,
		sampleRate: 44100
	}
};

// Function for starting the Screen Recording (get the start record and stop records buttons)
function startRecord(startRecBtn, stopRecBtn) {

	// DETAILED EXPLANATION:
	
	// Get the User's Audio Media first using getUserMedia() method.
	// Then, get the Screen Capture Media using getDisplayMedia() method.
	// Create a new Media Stream ang combine the two Tracks, the audio and the screen capture.

	// The reason why I get the audio first is to make the "allow mic" prompt go first before the "share screen" prompt.
	// Because when you get the screen capture first, it will first show the "share screen" prompt before the "allow mic" prompt.
	// After finishing the "share screen" prompt, it will automatically capture the screen before you allow the microphone access.
	// This will give users unnecesarry frustration so I get the user's audio first before the screen capture for better user experience.

	// Use the getUserMedia function for getting the access of User's Microphone
	// Pass in the AudioConstraints value
	navigator.mediaDevices.getUserMedia(audioConstraints)

		// If it works, pass the stream value
		.then(async(audioStream) => {

			// Use the getDisplayMedia function for getting the access of User's Screen Media
			// Pass in the ScreenConstraints value
			// Initialize the promise returned to the screenCapture variable
			let screenCapture = await navigator.mediaDevices.getDisplayMedia(screenConstraints);

			// Define a combinedStream Variable to create a new combined Mediastream of Audio Stream and Screen Capture Stream
			let combinedStream = new MediaStream([...audioStream.getTracks(), ...screenCapture.getTracks()]);

			// Define a new MediaRecorder instance with the combinedStream value
			const mediaRecorder = new MediaRecorder(combinedStream);

			// Make the stream and the new media recorder global
			window.mediaStream = combinedStream;
			window.mediaRecorder = mediaRecorder;

			// Initialize the source of the preview video to the current combinedStream
			previewVideo.srcObject = combinedStream;

			// Start the mediaRecorder (starts the recording)
			mediaRecorder.start();

			// Set the Record Status to Recording and set the text color to lightgreen
			document.getElementById("record-status").innerHTML = '<b>Status:</b> Recording';
			document.getElementById("record-status").style.color = 'lightgreen';

			// Disable the Start Record Button and enable the Stop Record Button
			startRecBtn.disabled = true;
			stopRecBtn.disabled = false;

			// Check for the data available in mediaRecorder
			// (When data is available, mediaRecorder releases a event with the recorded video data)
			mediaRecorder.ondataavailable = (event) => {

				// Push the event data to the chunks array
				chunks.push(event.data);
			};

			// When the mediaRecorder stops, it releases a stop event
			mediaRecorder.onstop = () => {

				// Check for the value of the user's selected video format (either mp4, webm, or ogg)
				var selectedVideoFormat = document.querySelector('input[name = video_file_format]:checked').value;

				// Create a new blob for creating the video file
				// Set the file type to the user's selected video format
				const blob = new Blob(
					chunks, {
						type: `video/${selectedVideoFormat}`
					});
				chunks = [];

				// Create a recordedVideo variable for storing the recorded video
				// Use the createElement method to create a video element
				const recordedVideo = document.createElement("video");

				// Set the video controls to true
				recordedVideo.controls = true;

				// Set the source of the recorded video to the blob created
				// Take note that you cannot directly link it to the blob, so I have used the createObjectURL for the blob
				recordedVideo.src = URL.createObjectURL(blob);

				// Create a download link element using createElement method
				const downloadLink = document.createElement("a");

				// Check if the file name input text has an input
				if (document.getElementById("file_name").value.length > 0){
					
					// Set the file name of the downloadable to the value of file name input
					downloadLink.download = document.getElementById("file_name").value;
				}

				// The file name input text must be empty
				else {

					// Set the file name of the downloadable to "Untitled"
					downloadLink.download = "Untitled";
				}

				// Set the href of the download link to the URL created for the blob
				downloadLink.href = URL.createObjectURL(blob);

				// Set the text of the download link to "Download Video"
				downloadLink.innerText = "Download Video";

				// When users click the download link
				downloadLink.onclick = () => {

					// Revoke the object URL of the recorded video
					URL.revokeObjectURL(recordedVideo);
				};

				// Add the Recorded Video and Download Link to the Recorded Videos DIV
				document.getElementById("recorded_videos").append(recordedVideo, downloadLink);
			};
		})
		
		// When the stream catches an error, an error event will emit
		.catch((err) => {
			
			// Set the record status to the error message from the error event and change the text color to red
			document.getElementById("record-status").innerHTML = `<b>Status:</b> ${err.message}`;
			document.getElementById("record-status").style.color = 'red';
		});
}

// Function for stopping the Video Recording (get the stop record and start records buttons)
function stopRecord(stopRecBtn, startRecBtn) {

	// Stop the recording by stopping the Global Media Recorder
	window.mediaRecorder.stop();

	// Stop every track in the Global Media Stream by using getTracks function and stopping it individually by stop() function
	window.mediaStream.getTracks()
	.forEach((track) => {
		track.stop();
	});

	// Set the record status to Recording Saved and change the text color to lightblue
	document.getElementById("record-status").innerHTML = "<b>Status:</b> Recording Saved!";
    document.getElementById("record-status").style.color = 'lightblue';

	// Set the preview video to null (to display the background of the video)
    previewVideo.srcObject = null;

	// Disable the Stop Record Button and enable the Start Record Button
	stopRecBtn.disabled = true;
	startRecBtn.disabled = false;

	// Display the "Videos Recorded" subheading by making the display to block
    document.getElementById("vids-recorded").style.display = 'block';
}