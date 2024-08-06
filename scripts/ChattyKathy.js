/*! ChattyKathy 1.0.1
 * ©2016 Elliott Beaty
 * Modified by Kyle Diederich
 */

/**
 * @summary	 ChattyKathy
 * @description Wrapper for Amazon's AWS Polly Javascript SDK
 * @version	 1.0.1
 * @file		ChattyKathy.js
 * @author	  Elliott Beaty
 * @contact	 elliott@elliottbeaty.com
 * @copyright   Copyright 2016 Elliott Beaty
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 */

function ChattyKathy() {
	// Add audio node to html
	var elementId = "audioElement" + new Date().valueOf().toString();
	var audioElement = document.createElement('audio');
    var voice = "Ivy";
	audioElement.setAttribute("id", elementId);
	document.body.appendChild(audioElement);

	var isSpeaking = false;

	var kathy = {
		self: this,
		playlist:[],
		// Speak
		Speak: function (msg, speaker) {
			voice = speaker;
            if (isSpeaking) {
				this.playlist.push(msg);
			} else {
				say(msg).then(sayNext);
			}
		},

		// Quit speaking, clear playlist
		ShutUp: function(){
			shutUp();
		},
		// Speak & return promise
		SpeakWithPromise: function (msg) {
			return say(msg);
		},

		IsSpeaking: function () {
			return isSpeaking;
		},

		ForgetCachedSpeech: function () {
			localStorage.removeItem("chattyKathyDictionary");
		}

	}

	// Quit talking
	function shutUp() {
		audioElement.pause();
		playlist = [];
	}

	// Speak the message
	function say(message) {
		return new Promise(function (successCallback, errorCallback) {
			isSpeaking = true;
			getAudio(message)
				.then(playAudio)
				.then(successCallback);
		});
	}

	// Say next
	function sayNext() {
		var list = kathy.playlist;
		if (list.length > 0) {
			var msg = list[0];
			list.splice(0, 1);
			say(msg).then(sayNext);
		}
	}

	// Get Audio
	function getAudio(message) {
        var response = requestSpeechFromAWS(message);
            return response;
	}

	// Make request to Amazon polly
	function requestSpeechFromAWS(message) {
		// encode message as hex
        var arr1 = [];
        for (var n = 0, l = message.length; n < l; n ++) 
         {
            // newline and return characters break Polly, so do not encode those
            if(message[n] != "\n" && message[n] != "\r"){
                var hex = Number(message.charCodeAt(n)).toString(16);
                arr1.push(hex);
            }
         }
        var encodedMessage = arr1.join('');
        
        return new Promise(function (successCallback, errorCallback) {
            $.post('/polly', {message:encodedMessage, voice:voice}, function(data, status) {
                saveSpeechToLocalCache(message, data.AudioStream);
                successCallback(data.AudioStream);
			});
		});
	}

	// Save to local cache
	function saveSpeechToLocalCache(message, audioStream) {
		var record = {
			Message: message,
			AudioStream: JSON.stringify(audioStream)
		};
		var localPlaylist = JSON.parse(localStorage.getItem("chattyKathyDictionary"));

		if (localPlaylist === null) {
			localPlaylist = [];
			localPlaylist.push(record);
		}else{
			localPlaylist.push(record);

		}
		localStorage.setItem("chattyKathyDictionary", JSON.stringify(localPlaylist));
	}

	// Check local cache for audio clip
	function requestSpeechFromLocalCache(message) {
		
		var audioDictionary = localStorage.getItem("chattyKathyDictionary");
		if (audioDictionary === null) {
			return null;
		}
		var audioStreamArray = JSON.parse(audioDictionary);
		var audioStream = audioStreamArray.filter(function (record) {
			
			return record.Message === message;
		})[0];;
	
		if (audioStream === null || typeof audioStream === 'undefined') {
			return null;
		} else {
			return new Promise(function (successCallback, errorCallback) {
				successCallback(JSON.parse(audioStream.AudioStream).data);
			});
		}
	}

	// Play audio
	function playAudio(audioStream) {
		return new Promise(function (success, error) {
			try{
                var uInt8Array = Uint8Array.from(audioStream.data);
            }
            catch{
                var uInt8Array = new Uint8Array(audioStream);    
            }
			var arrayBuffer = uInt8Array.buffer;
			
			// Safari: When creating the blob, the content type MUST be specified:
			var blob = new Blob([arrayBuffer], {type: 'audio/mpeg'});
			//var url = webkitURL.createObjectURL(blob);
			var url = URL.createObjectURL(blob);  // Allows code to work with FireFox only - looks to required allowing cookies
			/*
			Mobile: The above must be true, plus playback needs to be initiated 
			by a user touch event. Note: Older iOS versions seem to require that 
			playback be initiated in the same thread as the touch event, so a touch 
			event that initiates a promise chain that eventually calls audio.play() 
			will fail. Later iOS versions seem to be smarter about this.
			*/

			audioElement.src = url;
			audioElement.addEventListener("ended", function () {
				isSpeaking = false;
				success();
			});
			audioElement.play();
		});
	}
	return kathy;
}