// ==UserScript==
// @name         X/Twitter FixupX
// @namespace    https://tampermonkey.net/
// @version      1.31
// @description  Replace x.com and twitter.com with fixupx.com for actual post links only
// @author       mirukyu
// @match        https://twitter.com/*
// @match        https://*.twitter.com/*
// @match        https://x.com/*
// @match        https://*.x.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const FROM_DOMAINS = ['x.com', 'twitter.com'];
    const TO_DOMAIN = 'fixupx.com';
    const POST_PATH = /^(\/[^/]+\/status\/\d+|\/i\/status\/\d+)/;

    function isActualPost(u) {
        return (
            FROM_DOMAINS.includes(u.hostname) &&
            POST_PATH.test(u.pathname)
        );
    }

    function fixUrl(raw) {
        try {
            const u = new URL(raw);
            if (isActualPost(u)) {
                u.hostname = TO_DOMAIN;
                return u.toString();
            }
        } catch {}
        return raw;
    }

    document.addEventListener(
        'click',
        e => {
            const a = e.target.closest('a[href]');
            if (!a) return;

            const fixed = fixUrl(a.href);
            if (fixed !== a.href) {
                e.preventDefault();
                e.stopPropagation();
                window.open(fixed, a.target || '_blank');
            }
        },
        true
    );

    document.addEventListener(
        'copy',
        e => {
            const sel = document.getSelection()?.toString();
            if (!sel) return;

            const fixed = fixUrl(sel);
            if (fixed !== sel) {
                e.preventDefault();
                e.clipboardData.setData('text/plain', fixed);
            }
        },
        true
    );

    function rewriteLinks(root = document) {
        root.querySelectorAll('a[href]').forEach(a => {
            const fixed = fixUrl(a.href);
            if (fixed !== a.href) {
                a.href = fixed;
            }
        });
    }

    rewriteLinks();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'A' && node.href) {
                        const fixed = fixUrl(node.href);
                        if (fixed !== node.href) node.href = fixed;
                    } else {
                        rewriteLinks(node);
                    }
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

document.addEventListener(
    "click",
    async e => {
        if (!e.shiftKey) return;

        const shareButton = e.target.closest('button[aria-label="Share post"]');
        if (!shareButton) return;

        const article = shareButton.closest("article");
        if (!article) return;

        const tweetLink = article.querySelector(
            'a[href*="/status/"], a[href*="/i/status/"]'
        );
        if (!tweetLink) return;

        const fixed = fixUrl(tweetLink.href);

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try {
            await navigator.clipboard.writeText(fixed);
            showFixupToast("Copied FixupX link!");
        } catch (err) {
            console.error(err);
            showFixupToast("Couldn't copy link");
        }
    },
    true
);

function showFixupToast(text) {
    document.querySelector("#fixupx-toast")?.remove();

    const toast = document.createElement("div");
    toast.id = "fixupx-toast";
    toast.textContent = text;

    Object.assign(toast.style, {
        position: "fixed",
        left: "50%",
        bottom: "32px",
        transform: "translateX(-50%)",
        background: "rgba(240, 155, 29, 0.95)", // X blue
        color: "#fff",
        padding: "10px 18px",
        borderRadius: "9999px",
        fontSize: "14px",
        fontWeight: "600",
        fontFamily: "TwitterChirp, system-ui, sans-serif",
        boxShadow: "0 6px 18px rgba(0,0,0,.25)",
        zIndex: "2147483647",
        opacity: "0",
        transition: "opacity .18s ease, transform .18s ease",
        pointerEvents: "none"
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(-6px)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%)";
        setTimeout(() => toast.remove(), 180);
    }, 1800);
}

})();
