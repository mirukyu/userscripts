// ==UserScript==
// @name         Bulk Downloader for GIPHY: GIFs, Stickers & Clips
// @namespace    com.giphy.bulk.extended
// @version      1.0
// @description  Download all media from GIPHY category pages (GIFs, Stickers, Clips)
// @author       mirukyu
// @license      MIT
// @match        https://giphy.com/*
// @grant        GM.download
// @grant        GM.addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const slugify = (string) => {
        return string
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    const downloadMedia = (id, type, title, index) => {
        let ext = 'gif';
        if (type === 'clip') ext = 'mp4';

        const url = `https://i.giphy.com/media/${id}/giphy.${ext}`;
        const filename = `${slugify(title)}-${index}.${ext}`;

        GM.download({
            url: url,
            name: filename,
            saveAs: false
        });
    };

    const extractMediaIds = () => {
        const links = document.querySelectorAll('a[href*="/gifs/"], a[href*="/stickers/"], a[href*="/clips/"]');
        const media = [];

        links.forEach((el) => {
            const href = el.getAttribute('href');
            const match = href.match(/\/(gifs|stickers|clips)\/[^\/]+-([a-zA-Z0-9]+)$/);
            if (match) {
                const [, type, id] = match;
                media.push({ type: type === 'stickers' ? 'gif' : type, id });
            }
        });

        // Remove duplicates
        const unique = Array.from(new Map(media.map(m => [m.id, m])).values());
        return unique;
    };

    const createDownloadButton = () => {
        const btn = document.createElement('button');
        btn.innerText = '⬇️ Download All Media';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 15px',
            fontSize: '16px',
            backgroundColor: '#ff5a5f',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        });

        btn.onclick = () => {
            const media = extractMediaIds();
            const title = document.title.split('GIFs')[0] || 'giphy';

            media.forEach(({ id, type }, i) => {
                downloadMedia(id, type, title, i + 1);
            });

            alert(`${media.length} item(s) are being downloaded...`);
        };

        document.body.appendChild(btn);
    };

    setTimeout(() => {
        createDownloadButton();
    }, 3000);
})();
