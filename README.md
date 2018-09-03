# XPro RTP

## Connecting to the camera

1. Enable WiFi on your camera
1. Connect your Computer to the WiFi network of your Camera

## Streaming to VLC

1. Open the packaged sdp file with VLC
1. Start the Node.JS script using `node index.js`
1. The cameras preview will be visible in VLC

## Known limitations

1. Video playback in VLC is laggy as long as the image is not dark enough or moving enough. This could be the result of the very naive RTP implementation, playing the raw stream using ffplay works flawlessly. This could be fixed by the latest commit (Thanks to Alexander G.), but I do not own a camera to try the changes with.