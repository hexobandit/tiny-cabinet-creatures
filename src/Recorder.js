/**
 * Records the game canvas straight to a video file, no screen-recording app needed.
 * Uses the browser's MediaRecorder. Prefers MP4 (what Instagram and X want);
 * falls back to WebM on browsers that cannot record MP4.
 */
const MIME_CANDIDATES = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
];

export class Recorder {
    constructor(canvas, badgeElement) {
        this.canvas = canvas;
        this.badge = badgeElement;
        this.mediaRecorder = null;
        this.chunks = [];
    }

    get isRecording() {
        return this.mediaRecorder !== null;
    }

    start(fileName) {
        const mimeType = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
        if (!mimeType) {
            console.warn('This browser cannot record the canvas.');
            return;
        }

        const stream = this.canvas.captureStream(60);
        this.chunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 12_000_000,
        });
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) this.chunks.push(event.data);
        };
        this.mediaRecorder.onstop = () => {
            const extension = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
            download(new Blob(this.chunks, { type: mimeType }), `${fileName}.${extension}`);
            stream.getTracks().forEach((track) => track.stop());
        };
        this.mediaRecorder.start();
        this.badge?.classList.add('on');
    }

    stop() {
        if (!this.mediaRecorder) return;
        this.mediaRecorder.stop();
        this.mediaRecorder = null;
        this.badge?.classList.remove('on');
    }
}

function download(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
