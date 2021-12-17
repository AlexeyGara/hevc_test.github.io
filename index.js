// HEVC (hight) converting example (see https://trac.ffmpeg.org/wiki/Encode/H.265):
// $ ffmpeg -i anim_11_1.mp4 -c:v libx265 -crf 12 -preset slow -vtag hvc1 anim_11_1_hevc.mp4
// HEVC (low) converting example:
// $ ffmpeg -i anim_11_1.mp4 -c:v libx265 -crf 28 -preset medium -vtag hvc1 anim_11_1_hevc.mp4

// MP4 (low) converting example:
// $ ffmpeg -i anim_11_1.mp4 -c:v libx264 -crf 23 -preset medium anim_11_1_low.mp4

const MediaError = window.MediaError || {
	MEDIA_ERR_ABORTED: 1,
	MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
	MEDIA_ERR_SRC_NOT_SUPPORTED: 4
};

const VideoType = {
	"stage_WEBM":      { basePath:"", ext:".webm" },
  "stage_MP4":       { basePath:"", ext:".mp4" },
  "github_MP4":      { basePath:"alexeygara.github.io/hevc_test.github.io/icons/h264_high", ext:".mp4" },
  "github_MP4_low":  { basePath:"alexeygara.github.io/hevc_test.github.io/icons/h264_low", ext:".mp4" },
  "github_HEVC":     { basePath:"alexeygara.github.io/hevc_test.github.io/icons/hevc_high", ext:"_hevc.mp4" },
  "github_HEVC_low": { basePath:"alexeygara.github.io/hevc_test.github.io/icons/hevc_low", ext:"_hevc.mp4" }
};

const baseSubPath = "480W/games/game497/slot/icons/5.14839.24153/en/";
let basePath = "https://" + document.getElementById("stages").value + baseSubPath;
const videos = [
	"anim_11_1.webm",
  "anim_9_1.webm",
  "anim_8_1.webm",
  "anim_7_1.webm",
  "anim_6_1.webm",
  "anim_5_1.webm",
  "anim_4_1.webm",
  "anim_3_1.webm",
  "anim_2_1.webm",
  "anim_1_1.webm",
  //"wrong_video_url.webm",/* 404 */
  //"wrong_video_url2.webm",/* 404 */
  //"wrong_video_url3.webm"/* 404 */
];

let USE_VIDEO_TYPE = VideoType["stage_WEBM"];
let SOURCES = false;
let PLAYS_INLINE = true;
let METADATA_ONLY = false;
let ADD_TO_DOM = false;
let MAX_VIDEOS_AUTOCREATE_COUNT = 32;

const videoElements = Array.from(document.getElementsByTagName("video"));
let activeMediaPlayersCount = 0;

console.clear();
console.log("static videos count: " + videoElements.length);

const loaded = [];
const playing = [];
let errorsCount = 0;
let networkErrorsCount = 0;
let cantPlayErrorsCount = 0;
function updateInfo() {
	var output = document.getElementById("output");
  if(output) {
  	var loadingCount = 0;
  	var loadedCount = 0;
    var metadaCount = 0;
    var playingCount = playing.length;
    for(let readyState of loaded) {
    	if(readyState === 0) {
      	loadingCount++;
      }
    	else if(readyState > 1) {
      	loadedCount++;
      }
      else {
      	metadaCount++;
      }
    }
  	output.value = "Created: " + videoElements.length;
    output.value += "\n";
    output.value += "Loading: " + loadingCount;
    output.value += "\n";
    output.value += "Metada: " + metadaCount;
    output.value += "\n";
    output.value += "Loaded: " + loadedCount;
    output.value += "\n";
    output.value += "Playing: " + playingCount;
    output.value += "\n";
  	output.value += "ERRORS: " + errorsCount;
    if(networkErrorsCount > 0) {
    	output.value += " (network errors: " + networkErrorsCount + ")";
    }
    output.value += "\n";
    if(cantPlayErrorsCount > 0) {
      output.value += "Can't play error: " + cantPlayErrorsCount;
      output.value += "\n";
    }
    output.value += "COMPLETED: " + ((loadedCount + metadaCount) - errorsCount);
    output.value += "\n";
    output.value += "(media players: " + activeMediaPlayersCount + ")";
  }
  if(errorsCount > 0 || cantPlayErrorsCount > 0) {
  	document.body.style.backgroundColor = "#770000";
  }
  else if(playingCount > 0) {
    document.body.style.backgroundColor = "#007700";
  }
  else {
    document.body.style.backgroundColor = "#777";
  }
}
function updateLoadingCount(videoIndex) {
	loaded[videoIndex] = 0;
	updateInfo();
}
function updateLoadedCount(videoIndex, readyState) {
	loaded[videoIndex] = readyState;
	updateInfo();
}
function updateErrorsCount(video) {
	var err = video.error;
  if(!err && source && source.error) {
  	err = source.error;
  }
  if(!err || err.code != MediaError.MEDIA_ERR_DECODE) {
  	networkErrorsCount++;
  }
  errorsCount++;
	updateInfo();
}
function updateMediaPlayerCount(decrease) {
	if(decrease) {
  	activeMediaPlayersCount = activeMediaPlayersCount > 0 ? activeMediaPlayersCount - 1 : 0;
  }
  else {
  	activeMediaPlayersCount++;
  }
  console.log("active media players: " + activeMediaPlayersCount);
  updateInfo();
}

function unhandleVideo(video) {
	video.onloadstart = null;
  video.onloadend = null;
	video.onloadeddata = null;
	video.onloadedmetadata = null;
  video.oncanplaythrough = null;
}

function cleanupVideo(video) {
	console.log("cleanup video: " + video.id);

  video.onerror = null;
	video.ontimeupdate = null;
	video.onseeked = null;
	video.oncanplay = null;
	video.oncanplaythrough = null;
	video.onloadedmetadata = null;
	video.onloadeddata = null;
	video.onload = null;
	video.onplay = null;
	video.onpause = null;
	video.onprogress = null;
	video.onended = null;
	video.onstalled = null;
	video.onsuspend = null;

  video.pause();

	while(video.firstChild != null) {
		var child = video.firstChild;
		video.removeChild(child);
	}

	video.autoplay = false;
	video.preload = "none";

  //delete video.src;
  //video.removeAttribute("src");

  if(video.parentNode) {
  	video.parentNode.removeChild(video);
  }

  video.src = "";
  //video.load();
}

function createVideo(src) {
	try {
		const video = document.createElement("video");
    const videoIndex = videoElements.length;
  	video.id = "#" + (videoIndex + 1);
    video.preload = METADATA_ONLY ? "metadata" : "auto";
    if(ADD_TO_DOM) {
    	video.hidden = true;
      document.body.appendChild(video);
    }

		function logError(video, source) {
    	var err = video.error;
      if(!err && source && source.error) {
      	err = source.error;
      }
      if(err) {
      	console.log("code:" + err.code + ", message:" + err.message);
      }
    };

		// handle 'error' event: {
		function _onError_() { console.log("ERROR: " + video.id); console.log("code:" + (video.error ? video.error.code : 0) + ", message:" + (video.error ? video.error.message : "<noerror>"));
    	console.error("ERROR| networkState:" + video.networkState + ", readyState:" + video.readyState);
      logError(video);
    	video.removeEventListener("error", _onError_);
      updateErrorsCount(video);
    };
    video.addEventListener("error", _onError_);
    //}

    video.onerror = function(e) { console.log("ON ERROR: " + video.id);//console.dir(e);
    	console.log("code:" + (video.error ? video.error.code : 0) + ", message:" + (video.error ? video.error.message : "<noerror>"));
      console.error("ON ERROR| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	if(video.error instanceof MediaError && !video._decodeError && !video._wmpError) {
        if(video.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          video._wmpError = true;
          console.log("wmp error: {");
          console.log(video.src);
          console.log(video.currentSrc);
          console.log("}");
          cleanupVideo(video);
        }
        else if(video.error.code === MediaError.MEDIA_ERR_DECODE) {
        	video._decodeError = true;
          console.log("decode error: {");
          console.log(video.src);
          console.log(video.currentSrc);
          console.log("}");
          cleanupVideo(video);
        }
      }
    };

    // handle 'abort' event: {
		function _onAbort_() { console.log("ABORT: " + video.id); console.log(video.error);
    	console.warn("ABORT| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("abort", _onAbort_);
    	updateMediaPlayerCount(true);
    };
    video.addEventListener("abort", _onAbort_);
    //}

    // handle 'error' event: {
    function _onStalled_() { console.log("STALLED: " + video.id);
    	console.log("STALLED| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("stalled", _onStalled_);
    };
    video.addEventListener("stalled", _onStalled_);
    //}

    // handle 'error' event: {
    function _onSuspend_() { console.log("SUSPEND: " + video.id); //console.dir(video);
    	console.log("SUSPEND| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	updateLoadedCount(videoIndex, video.readyState);
      if(video.readyState === 0) {
      	video.removeEventListener("suspend", _onSuspend_);
      	updateMediaPlayerCount(true);
      }
    };
    video.addEventListener("suspend", _onSuspend_);
    //}

    // handle 'error' event: {
    function _onLoadStart_() { console.log("load start: " + video.id); console.log(video.src); console.log(video.currentSrc);
    	console.log("LOAD START| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("loadstart", _onLoadStart_);
      updateLoadingCount(videoIndex);
    	updateMediaPlayerCount();
    };
    video.addEventListener("loadstart", _onLoadStart_);
    //}

    // handle 'loadedmetadata' event: {
    function _onLoadedMetadata_() { console.log("loaded metadata: " + video.id); console.log(video.src); console.log(video.currentSrc);
    	console.log("LOADED METADATA| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("loadedmetadata", _onLoadedMetadata_);
      updateLoadedCount(videoIndex, 1);
    };
    video.addEventListener("loadedmetadata", _onLoadedMetadata_);
    //}

    // handle 'loadeddata' event: {
    function _onLoadedData_() { console.log("loaded data: " + video.id); console.log(video.src); console.log(video.currentSrc);
    	console.log("LOADED DATA| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("loadeddata", _onLoadedData_);
      updateLoadedCount(videoIndex, video.readyState);
    };
    video.addEventListener("loadeddata", _onLoadedData_);
    //}

    // handle 'play' event: {
    function _onPlay_() { console.log("play: " + video.id); console.log(video.src); console.log(video.currentSrc);
    	console.log("PLAY| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("play", _onPlay_);
    };
    video.addEventListener("play", _onPlay_);
    //}

    // handle 'pause' event: {
    function _onPause_() { console.log("pause: " + video.id); console.log(video.src); console.log(video.currentSrc);
    	console.log("PAUSE| networkState:" + video.networkState + ", readyState:" + video.readyState);
    	video.removeEventListener("pause", _onPause_);
    };
    video.addEventListener("pause", _onPause_);
    //}

    if(SOURCES) {
    	function createSource(url, type) {
      	var source = document.createElement('source');
        source.type = type;
        source.src = url;
        source.onerror = function(e) { console.log("SOURCE ERROR: " + video.id + " " + type); //console.log(e);
        	console.log("type '" + type + "' " + url);
          console.warn("SOURCE ERROR| networkState:" + video.networkState + ", readyState:" + video.readyState);
          logError(video, source);
          if(video.error) {
          	updateErrorsCount();
          }
        };
        //source.addEventListener('error', function(e) { console.log("SOURCE ERROR Handler:"); });
        return source;
      }
      video.appendChild(createSource(src, "video/webm"));
      video.appendChild(createSource(src.split(".webm").join(".mp4"), "video/mp4"));
    }
    else {
    	video.src = src;
    }

    if(videoIndex == 0) { console.log(video); }
    return video;
  }
  catch(e) {
  	console.warn("Cannot create " + (videoElements.length + 1) + "video by reason: " + e);
  }
  return null;
}

let videoSrcIndex = 0;
function testCreate() {
	//for(const videoSrc of videos) {
  	let videoBasePath = basePath;
  	let videoSrc = videos[videoSrcIndex];
    const video = createVideo(videoBasePath + videoSrc);
    //console.log(video);
    videoElements.push(video);
    console.log("video " + video.id + " '" + video.src + "' created");
    //setTimeout(function() {
    //	video.play();
    //  console.log("video " + video.id + " '" + video.currentSrc + "' started");
    //}, (500 + 500 * Math.random()) | 0);
    video.load();
  //}
  videoSrcIndex++;
  if(videoSrcIndex >= videos.length) {
  	videoSrcIndex = 0;
  }
}

let videoPlayIndex = 0;
function testPlay() {
	if(videoPlayIndex < videoElements.length) {
		const video = videoElements[videoPlayIndex++];
    video.loop = true;
    if(PLAYS_INLINE) {
      video.setAttribute("webkit-playsinline", "true");// iOS <10
			video.setAttribute("playsinline", "true");// iOS 10+
    }
    video.controls = true;
    video.width = (video.videoWidth / 2) | 0;
    video.height = (video.videoHeight / 2) | 0;
    document.getElementById("playground").appendChild(video);
  	const playRes = video.play();
    playRes.then(function() {
      console.log("video " + video.id + " '" + video.currentSrc + "' started");
      if(playing.indexOf(video) < 0) {
        playing.push(video);
      }
      updateInfo();
    });
    playRes.catch(function(e) {
      cantPlayErrorsCount++;
      console.log("video " + video.id + " '" + video.currentSrc + "' connot be played");
      updateInfo();
    });
  }
  else {
  	//testCreate();
  }
}

let step = 0;
function runOrResumeTest() {
	if(step === 0) {
  	basePath = document.getElementById("basePath").value;
    basePath = basePath.split("\\").join("/");
    if(basePath.substring(basePath.length - 1) != "/") {
    	basePath += "/";
    }
    console.log("base path: '" + basePath + "'");
    let urls = document.getElementById("urls").value.split("\n");
    if(urls.length > 0) {
    	videos.length = 0;
      for(let url of urls) {
      	if(url && url.length > 0) {
      		videos.push(url);
        }
      }
    }
    MAX_VIDEOS_AUTOCREATE_COUNT = document.getElementById("input").value;
    SOURCES = document.getElementById("useSources").checked;
    PLAYS_INLINE = document.getElementById("playsInline").checked;
    METADATA_ONLY = document.getElementById("onlyMetadata").checked;
    ADD_TO_DOM = document.getElementById("addToDOM").checked;
	}

	step++;

  if(step === 1) {
  	document.getElementById("start").innerHTML = "Resume test (add video)";
    while(videoElements.length < MAX_VIDEOS_AUTOCREATE_COUNT) {
  		testCreate();
  	}
  }
  else if(step > 1) {
    testCreate();
  }
}

var onStartClick = function() {
	document.getElementById("start").onclick = null;
	runOrResumeTest();
  setTimeout(function() {
  	document.getElementById("start").onclick = onStartClick;
  }, 100);
};

var onPlayClick = function() {
  document.getElementById("play").onclick = null;
	testPlay();
  setTimeout(function() {
  	document.getElementById("play").onclick = onPlayClick;
  }, 100);
}

var onResetClick = function() {
	document.getElementById("start").innerHTML = "START TEST";
  for(const video of videoElements) {
  	video.removeAttribute("src");
  	//delete video.src;
    for(const child of video.children) {
    	try{child.removeAttribute('src');}catch(e){}
    	video.removeChild(child);
    }
    video.autoplay = false;
    video.preload = "none";
    if(video.parentNode) {
    	video.parentNode.removeChild(video);
    }
    video.load();
    //console.dir(video);
  }
  videoElements.length = 0;
  videoSrcIndex = 0;
  videoPlayIndex = 0;
  activeMediaPlayersCount = 0;

  console.clear();
  console.log("static videos count: " + videoElements.length);
  console.log("active media players count: " + activeMediaPlayersCount);

  loaded.length = 0;
  playing.length = 0;
  errorsCount = 0;
  networkErrorsCount = 0;
  cantPlayErrorsCount = 0;

  step = 0;

  updateInfo();
};

function updateUrls() {
	let urls = "";
	for(let url of videos) {
		urls += url.split("_hevc.")[0].split(".")[0] + USE_VIDEO_TYPE.ext + "\n";
	}
  if(urls.substring(urls.length - 1) == "\n") {
  	urls = urls.substring(0, urls.length - 1);
  }
	document.getElementById("urls").value = urls;
}
function updatePaths() {
	var selector = document.getElementById("stages");
  basePath = selector.value + baseSubPath;
  USE_VIDEO_TYPE = VideoType[document.getElementById("formats").value];
  //console.log(USE_VIDEO_TYPE);
  if(USE_VIDEO_TYPE.basePath && USE_VIDEO_TYPE.basePath.length > 0) {
    basePath = USE_VIDEO_TYPE.basePath;
  }
  basePath = "https://" + basePath;
  document.getElementById("basePath").value = basePath;
  updateUrls();
}
function updatePlaysInline() {
  PLAYS_INLINE = document.getElementById("playsInline").checked;
}

// handlers
document.getElementById("stages").onchange = updatePaths;
document.getElementById("formats").onchange = updatePaths;
document.getElementById("playsInline").onchange = updatePlaysInline;

// initialization
updatePaths();
document.getElementById("input").value = MAX_VIDEOS_AUTOCREATE_COUNT;
document.getElementById("useSources").checked = SOURCES;
document.getElementById("playsInline").checked = PLAYS_INLINE;
document.getElementById("start").onclick = onStartClick;
document.getElementById("play").onclick = onPlayClick;
document.getElementById("reset").onclick = onResetClick;
document.getElementById("onlyMetadata").checked = METADATA_ONLY;
document.getElementById("addToDOM").checked = ADD_TO_DOM;

window._videos_ = videos;
window._videoElements_ = videoElements;
