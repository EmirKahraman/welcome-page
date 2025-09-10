export async function loadBackground(arrayBuffer, positionOverride) {
    const bgVideo = document.getElementById('bgVideo');
    const bgImage = document.getElementById('bgImage');

    function parseIni(iniText) {
        const lines = iniText.split(/\r?\n/);
        const result = {};
        let currentSection = null;
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith(';') || line.startsWith('#')) continue;
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.slice(1, -1);
                result[currentSection] = {};
            } else if (currentSection && line.includes('=')) {
                const [key, ...rest] = line.split('=');
                result[currentSection][key.trim()] = rest.join('=').trim();
            }
        }
        return result;
    }

    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const iniFile = Object.keys(zip.files).find(f => f.endsWith('.ini'));
        if (!iniFile) return;
        const iniText = await zip.files[iniFile].async('text');
        const ini = parseIni(iniText);
        const startPage = ini['Start Page'];
        if (!startPage?.background) return;

        const background = startPage.background;
        const position = positionOverride || startPage.position || 'center center';
        const firstFrame = startPage['first frame image'];
        const bgFile = zip.files[background];
        if (!bgFile) return;

        const blob = await bgFile.async('blob');

        if (background.endsWith('.webm') || background.endsWith('.mp4')) {
            bgImage.style.display = 'none';
            bgVideo.style.display = 'block';
            bgVideo.src = URL.createObjectURL(blob);
            bgVideo.load();
            if (firstFrame && zip.files[firstFrame]) {
                const frameBlob = await zip.files[firstFrame].async('blob');
                bgVideo.poster = URL.createObjectURL(frameBlob);
            }
            bgVideo.play().catch(console.error);
        } else {
            bgVideo.style.display = 'none';
            bgImage.style.display = 'block';
            bgImage.src = URL.createObjectURL(blob);
        }

        bgVideo.style.objectPosition = position;
        bgImage.style.objectPosition = position;

    } catch (err) {
        console.error('Error loading background:', err);
    }
}
