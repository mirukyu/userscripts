// ==UserScript==
// @name         Bluesky FxBsky
// @namespace    https://tampermonkey.net/
// @version      1.1
// @description  Replace bsky.app with fxbsky.app for actual post links only
// @author       mirukyu
// @match        https://bsky.app/*
// @match        https://*.bsky.app/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const FROM_DOMAINS = ['bsky.app', 'main.bsky.app'];
    const TO_DOMAIN = 'fxbsky.app'; // Change to 'bskx.app' or 'fixbsky.net' if preferred
    const POST_PATH = /^\/profile\/[^/]+\/post\/[a-zA-Z0-9]+/;

    function isActualPost(u) {
        return (
            FROM_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d)) &&
            POST_PATH.test(u.pathname)
        );
    }

    function fixUrl(raw) {
        try {
            const u = new URL(raw, window.location.origin);
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
        'click',
        async e => {
            if (!e.shiftKey) return;

            // Bluesky share button selectors
            const shareButton = e.target.closest(
                'button[aria-label="Open share menu"], [aria-label="Open share menu"], button[data-testid="postShareBtn"], [data-testid="postShareBtn"], [aria-label*="share" i]'
            );
            if (!shareButton) return;

            // Bluesky post containers
            let postContainer = shareButton.closest(
                'article, [role="article"], [data-testid^="feedItem-"], [data-testid^="postThreadItem-"]'
            );

            // Fallback traversal in case feed/thread container selector changes
            if (!postContainer) {
                let curr = shareButton.parentElement;
                while (curr && curr !== document.body) {
                    if (curr.querySelector('a[href*="/post/"]')) {
                        postContainer = curr;
                        break;
                    }
                    curr = curr.parentElement;
                }
            }

            let postUrl = null;
            if (postContainer) {
                const postLink = postContainer.querySelector('a[href*="/post/"]');
                if (postLink) postUrl = postLink.href;
            }

            // Fallback to current URL if viewing a single post thread
            if (!postUrl && isActualPost(new URL(window.location.href))) {
                postUrl = window.location.href;
            }

            if (!postUrl) return;

            const fixed = fixUrl(postUrl);

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            try {
                await navigator.clipboard.writeText(fixed);
                showFixupToast('Copied FxBsky link!');
            } catch (err) {
                console.error(err);
                showFixupToast("Couldn't copy link");
            }
        },
        true
    );

    function showFixupToast(text) {
        document.querySelector('#fxbsky-toast')?.remove();

        const toast = document.createElement('div');
        toast.id = 'fxbsky-toast';
        toast.textContent = text;

        Object.assign(toast.style, {
            position: 'fixed',
            left: '50%',
            bottom: '32px',
            transform: 'translateX(-50%)',
            background: 'rgba(18, 133, 254, 0.95)', // Bluesky Blue
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            boxShadow: '0 6px 18px rgba(0,0,0,.25)',
            zIndex: '2147483647',
            opacity: '0',
            transition: 'opacity .18s ease, transform .18s ease',
            pointerEvents: 'none'
        });

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(-6px)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%)';
            setTimeout(() => toast.remove(), 180);
        }, 1800);
    }
})();