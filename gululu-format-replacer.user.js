// ==UserScript==
// @name         骨碌碌创作端搜索替换工具
// @namespace    https://github.com/asasora/gululu-format-replacer
// @version      0.1.0
// @description  为骨碌碌创作端 ProseMirror 编辑器添加带格式搜索替换功能
// @author       You
// @match        *://create.gululu.world/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const STYLE = `
        .gll-fr-ball {
            position: fixed;
            right: 72px;
            bottom: 92px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1px solid rgba(0, 0, 0, .12);
            background: #fff;
            box-shadow: 0 4px 18px rgba(0, 0, 0, .20);
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            user-select: none;
            transition: transform .15s ease, box-shadow .15s ease;
        }

        .gll-fr-ball:hover {
            transform: scale(1.06);
            box-shadow: 0 6px 24px rgba(0, 0, 0, .26);
        }

        .gll-fr-panel {
            position: fixed;
            right: 72px;
            bottom: 152px;
            width: 680px;
            max-width: calc(100vw - 120px);
            background: #fff;
            border: 1px solid #dcdfe6;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, .20);
            z-index: 999999;
            display: none;
            overflow: hidden;
            font-size: 14px;
            color: #333;
        }

        .gll-fr-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            background: #fafafa;
        }

        .gll-fr-title {
            font-weight: 600;
            font-size: 15px;
        }

        .gll-fr-close {
            border: none;
            background: transparent;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
            color: #666;
        }

        .gll-fr-body {
            padding: 12px;
        }

        .gll-fr-box-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .gll-fr-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
        }

        .gll-fr-label {
            font-size: 13px;
            color: #555;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .gll-fr-search {
            width: 100%;
            height: 130px;
            box-sizing: border-box;
            resize: vertical;
            border: 1px solid #dcdfe6;
            border-radius: 8px;
            padding: 8px;
            font-size: 14px;
            line-height: 1.5;
            outline: none;
            font-family: inherit;
        }

        .gll-fr-search:focus {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, .12);
        }

        .gll-fr-replace {
            width: 100%;
            height: 130px;
            box-sizing: border-box;
            overflow: auto;
            border: 1px solid #dcdfe6;
            border-radius: 8px;
            padding: 8px;
            font-size: 14px;
            line-height: 1.6;
            outline: none;
            background: #fff;
        }

        .gll-fr-replace:focus {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, .12);
        }

        .gll-fr-replace:empty::before {
            content: '在这里粘贴带格式文本';
            color: #aaa;
        }

        .gll-fr-warning {
            min-height: 18px;
            color: #d93025;
            font-size: 12px;
            line-height: 1.4;
        }

        .gll-fr-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 12px;
            border-top: 1px solid #f0f0f0;
            padding-top: 12px;
        }

        .gll-fr-status {
            margin-right: auto;
            color: #555;
            font-size: 13px;
        }

        .gll-fr-btn {
            border: 1px solid #dcdfe6;
            background: #fff;
            color: #333;
            border-radius: 7px;
            padding: 6px 12px;
            font-size: 13px;
            cursor: pointer;
            line-height: 1.3;
        }

        .gll-fr-btn:hover {
            background: #f5f7fa;
            border-color: #c6e2ff;
            color: #409eff;
        }

        .gll-fr-btn.primary {
            background: #409eff;
            border-color: #409eff;
            color: #fff;
        }

        .gll-fr-btn.primary:hover {
            background: #66b1ff;
            border-color: #66b1ff;
            color: #fff;
        }

        .gll-fr-btn.danger {
            background: #fff;
            border-color: #f5c2c7;
            color: #d93025;
        }

        .gll-fr-btn.danger:hover {
            background: #fff0f0;
        }

        .gll-fr-toast {
            position: fixed;
            left: 50%;
            bottom: 120px;
            transform: translateX(-50%);
            z-index: 1000000;
            background: rgba(0, 0, 0, .78);
            color: #fff;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 13px;
            display: none;
            pointer-events: none;
        }

        @media (max-width: 900px) {
            .gll-fr-panel {
                right: 16px;
                bottom: 140px;
                width: calc(100vw - 32px);
                max-width: calc(100vw - 32px);
            }

            .gll-fr-box-row {
                grid-template-columns: 1fr;
            }

            .gll-fr-ball {
                right: 16px;
                bottom: 80px;
            }
        }
    `;

    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    let ball = null;
    let panel = null;

    let searchInput = null;
    let replaceBox = null;
    let statusText = null;
    let warningText = null;

    let currentIndex = -1;
    let matches = [];
    let lastSearchText = '';

    function createBall() {
        if (ball) return ball;

        ball = document.createElement('div');
        ball.className = 'gll-fr-ball';
        ball.textContent = '🔎';
        ball.title = '带格式搜索替换';

        ball.addEventListener('click', function () {
            togglePanel();
        });

        document.body.appendChild(ball);
        return ball;
    }

    function createPanel() {
        if (panel) return panel;

        panel = document.createElement('div');
        panel.className = 'gll-fr-panel';

        const header = document.createElement('div');
        header.className = 'gll-fr-header';

        const title = document.createElement('div');
        title.className = 'gll-fr-title';
        title.textContent = '带格式搜索替换';

        const close = document.createElement('button');
        close.className = 'gll-fr-close';
        close.type = 'button';
        close.textContent = '×';
        close.title = '关闭';

        header.appendChild(title);
        header.appendChild(close);

        const body = document.createElement('div');
        body.className = 'gll-fr-body';

        const row = document.createElement('div');
        row.className = 'gll-fr-box-row';

        const searchField = document.createElement('div');
        searchField.className = 'gll-fr-field';

        const searchLabel = document.createElement('div');
        searchLabel.className = 'gll-fr-label';
        searchLabel.textContent = '搜索文本，忽略格式';

        searchInput = document.createElement('textarea');
        searchInput.className = 'gll-fr-search';
        searchInput.placeholder = '输入要搜索的文本。搜索时会忽略原文中的颜色、加粗、标题等格式。';

        searchField.appendChild(searchLabel);
        searchField.appendChild(searchInput);

        const replaceField = document.createElement('div');
        replaceField.className = 'gll-fr-field';

        const replaceLabel = document.createElement('div');
        replaceLabel.className = 'gll-fr-label';
        replaceLabel.textContent = '替换为，可粘贴带格式文本';

        replaceBox = document.createElement('div');
        replaceBox.className = 'gll-fr-replace';
        replaceBox.contentEditable = 'true';
        replaceBox.spellcheck = false;

        warningText = document.createElement('div');
        warningText.className = 'gll-fr-warning';
        warningText.textContent = '提示：替换会尽量保留粘贴内容中的常见格式，但最终效果以 Gululu 编辑器实际支持与保存结果为准。建议大量替换前先保存草稿。';

        replaceField.appendChild(replaceLabel);
        replaceField.appendChild(replaceBox);
        replaceField.appendChild(warningText);

        row.appendChild(searchField);
        row.appendChild(replaceField);

        const actions = document.createElement('div');
        actions.className = 'gll-fr-actions';

        statusText = document.createElement('div');
        statusText.className = 'gll-fr-status';
        statusText.textContent = '找到 0 处';

        const prevBtn = createButton('上一处');
        const nextBtn = createButton('下一处');
        const replaceBtn = createButton('替换', 'primary');
        const replaceAllBtn = createButton('全部替换', 'danger');

        prevBtn.addEventListener('click', goPrev);
        nextBtn.addEventListener('click', goNext);
        replaceBtn.addEventListener('click', replaceCurrent);
        replaceAllBtn.addEventListener('click', replaceAll);

        actions.appendChild(statusText);
        actions.appendChild(prevBtn);
        actions.appendChild(nextBtn);
        actions.appendChild(replaceBtn);
        actions.appendChild(replaceAllBtn);

        body.appendChild(row);
        body.appendChild(actions);

        panel.appendChild(header);
        panel.appendChild(body);
        document.body.appendChild(panel);

        close.addEventListener('click', hidePanel);

        searchInput.addEventListener('input', function () {
            refreshSearch(true);
        });

        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                goNext();
            }
        });
        /*
        replaceBox.addEventListener('input', function () {
            checkReplaceFormat();
        });

        replaceBox.addEventListener('paste', function () {
            setTimeout(checkReplaceFormat, 0);
        });
*/

        return panel;
    }

    function createButton(text, type) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gll-fr-btn' + (type ? ` ${type}` : '');
        btn.textContent = text;
        return btn;
    }

    function togglePanel() {
        const p = createPanel();
        if (p.style.display === 'block') {
            hidePanel();
        } else {
            showPanel();
        }
    }

    function showPanel() {
        const p = createPanel();
        p.style.display = 'block';
        setTimeout(() => searchInput && searchInput.focus(), 50);
        refreshSearch(true);
    }

    function hidePanel() {
        if (panel) panel.style.display = 'none';
    }

    function showToast(text) {
        let toast = document.querySelector('.gll-fr-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'gll-fr-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = text;
        toast.style.display = 'block';

        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => {
            toast.style.display = 'none';
        }, 1800);
    }

    function isPMView(obj) {
        return !!(
            obj &&
            typeof obj === 'object' &&
            obj.state &&
            obj.state.doc &&
            obj.state.schema &&
            typeof obj.dispatch === 'function' &&
            obj.dom instanceof HTMLElement
        );
    }

    function getCurrentPMRoot() {
        const candidates = Array.from(document.querySelectorAll(
            '.ProseMirror[contenteditable="true"], [contenteditable="true"].ProseMirror'
        ));

        let best = null;
        let bestScore = -1;

        for (const el of candidates) {
            if (!(el instanceof HTMLElement)) continue;

            // 排除插件自身面板
            if (panel && panel.contains(el)) continue;

            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);

            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                rect.width < 100 ||
                rect.height < 100
            ) {
                continue;
            }

            let score = rect.width * rect.height;

            if (el.contains(document.activeElement)) {
                score += 1e9;
            }

            const sel = window.getSelection();

            if (
                sel &&
                sel.rangeCount > 0 &&
                el.contains(sel.getRangeAt(0).commonAncestorContainer)
            ) {
                score += 1e9;
            }

            if (score > bestScore) {
                bestScore = score;
                best = el;
            }
        }

        return best;
    }

    function findPMViewFromReactFiber(root) {
        for (let el = root; el; el = el.parentElement) {
            for (const key of Object.keys(el)) {
                if (
                    key.includes('react') ||
                    key.includes('React') ||
                    key.includes('fiber') ||
                    key.includes('Fiber')
                ) {
                    let fiber;

                    try {
                        fiber = el[key];
                    } catch (e) {
                        continue;
                    }

                    let f = fiber;
                    let depth = 0;

                    while (f && depth < 50) {
                        const candidates = [
                            f.stateNode?.props?.editor?.view,
                            f.memoizedProps?.editor?.view,
                            f.pendingProps?.editor?.view,
                            f.stateNode?.editor?.view,
                            f.stateNode?.view
                        ];

                        for (const item of candidates) {
                            if (isPMView(item) && item.dom === root) {
                                return item;
                            }
                        }

                        f = f.return;
                        depth++;
                    }
                }
            }
        }

        return null;
    }

    function scanPMViewFromRoot(root) {
        function scan(obj, depth, seen) {
            if (!obj || typeof obj !== 'object') return null;
            if (seen.has(obj)) return null;
            seen.add(obj);

            if (isPMView(obj) && obj.dom === root) {
                return obj;
            }

            if (depth <= 0) return null;

            let keys = [];

            try {
                keys = Object.keys(obj).slice(0, 500);
            } catch (e) {
                return null;
            }

            for (const key of keys) {
                let value;

                try {
                    value = obj[key];
                } catch (e) {
                    continue;
                }

                if (!value || typeof value !== 'object') continue;
                if (value === window || value === document) continue;

                const found = scan(value, depth - 1, seen);

                if (found) return found;
            }

            return null;
        }

        const starts = [];

        for (let el = root; el; el = el.parentElement) {
            for (const key of Object.keys(el)) {
                if (
                    key.includes('vue') ||
                    key.includes('Vue') ||
                    key.includes('react') ||
                    key.includes('React') ||
                    key.includes('fiber') ||
                    key.includes('Fiber') ||
                    key === 'pmViewDesc'
                ) {
                    try {
                        starts.push(el[key]);
                    } catch (e) {}
                }
            }
        }

        if (root.pmViewDesc) {
            starts.push(root.pmViewDesc);
        }

        for (const obj of starts) {
            const found = scan(obj, 12, new WeakSet());

            if (found) {
                return found;
            }
        }

        return null;
    }

    function getPMView() {
        const root = getCurrentPMRoot();

        if (!root) {
            console.warn('[Gululu Format Replace] 未找到当前 ProseMirror 根节点');
            return null;
        }

        // 只有缓存 view 确实对应当前编辑器 root，才复用
        if (
            window.__gll_pm_view &&
            isPMView(window.__gll_pm_view) &&
            window.__gll_pm_view.dom === root &&
            document.body.contains(window.__gll_pm_view.dom)
        ) {
            return window.__gll_pm_view;
        }

        // 优先使用 Gululu 当前 React Fiber 结构找 view
        const directView = findPMViewFromReactFiber(root);

        if (directView) {
            window.__gll_pm_view = directView;
            return directView;
        }

        // 兜底扫描
        const scannedView = scanPMViewFromRoot(root);

        if (scannedView) {
            window.__gll_pm_view = scannedView;
            return scannedView;
        }

        console.warn('[Gululu Format Replace] 未能找到当前 EditorView');
        return null;
    }



    function getEditorRoot() {
        const candidates = Array.from(document.querySelectorAll(
            '.ProseMirror[contenteditable="true"], [contenteditable="true"].ProseMirror'
        ));

        for (const el of candidates) {
            if (!(el instanceof HTMLElement)) continue;
            if (panel && panel.contains(el)) continue;

            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);

            if (
                rect.width > 100 &&
                rect.height > 100 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden'
            ) {
                return el;
            }
        }

        return null;
    }

    function getTextNodes(root) {
        const result = [];

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
                    if (!node.nodeValue.length) return NodeFilter.FILTER_REJECT;

                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;

                    if (panel && panel.contains(parent)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    const tag = parent.tagName ? parent.tagName.toLowerCase() : '';

                    if (
                        tag === 'script' ||
                        tag === 'style' ||
                        tag === 'noscript'
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while ((node = walker.nextNode())) {
            result.push(node);
        }

        return result;
    }

    // Gululu / ProseMirror 中，肉眼看起来一样的空格，DOM 里可能是不同 Unicode 空白字符。
    // 搜索时统一把这些“横向空白”视为普通半角空格。
    function normalizeSpaceChar(ch) {
        if (
            ch === '\u00A0' || // no-break space，不换行空格，HTML 里的 &nbsp;
            ch === '\u1680' ||
            ch === '\u180E' ||
            ch === '\u2000' ||
            ch === '\u2001' ||
            ch === '\u2002' ||
            ch === '\u2003' ||
            ch === '\u2004' ||
            ch === '\u2005' ||
            ch === '\u2006' ||
            ch === '\u2007' ||
            ch === '\u2008' ||
            ch === '\u2009' ||
            ch === '\u200A' ||
            ch === '\u202F' ||
            ch === '\u205F' ||
            ch === '\u3000' || // 全角空格
            ch === '\uFEFF' ||
            ch === '\t'
        ) {
            return ' ';
        }

        return ch;
    }

    function normalizeTextForSearch(text) {
        return String(text || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
        // 去掉零宽字符
            .replace(/[\u200B\u200C\u200D\u2060]/g, '')
            .split('')
            .map(normalizeSpaceChar)
            .join('');
    }



    function buildTextIndex(root) {
        const nodes = getTextNodes(root);
        const segments = [];

        // 原始文本，用于最终定位 Range
        let text = '';

        // 搜索用文本，把各种空格统一成普通空格
        let normalizedText = '';

        // normalizedText 的每个位置，对应 text 中的哪个原始位置
        const normalizedToOriginal = [];

        for (const node of nodes) {
            const value = node.nodeValue || '';
            const start = text.length;
            const end = start + value.length;

            segments.push({
                node,
                start,
                end
            });

            for (let i = 0; i < value.length; i++) {
                normalizedText += normalizeSpaceChar(value[i]);
                normalizedToOriginal.push(start + i);
            }

            text += value;
        }

        return {
            text,
            normalizedText,
            normalizedToOriginal,
            segments
        };
    }

    function selectPMRange(match) {
        if (!match || !match.view) return false;

        const view = match.view;
        const { from, to } = match;

        try {
            const state = view.state;
            const SelectionCtor = state.selection.constructor;

            const selection = SelectionCtor.create(state.doc, from, to);
            const tr = state.tr.setSelection(selection).scrollIntoView();

            view.dispatch(tr);
            view.focus();

            scrollPMPosToCenter(view, from);

            setTimeout(() => {
                scrollPMPosToCenter(view, from);
            }, 80);

            setTimeout(() => {
                scrollPMPosToCenter(view, from);
            }, 200);

            return true;
        } catch (e) {
            console.error('[Gululu Format Replace] selectPMRange failed:', e);
            return false;
        }
    }

    function scrollPMPosToCenter(view, pos) {
        if (!view || typeof view.coordsAtPos !== 'function') return;

        let coords;

        try {
            coords = view.coordsAtPos(pos);
        } catch (e) {
            return;
        }

        if (!coords) return;

        const scrollers = getScrollableAncestors(view.dom);

        for (const scroller of scrollers) {
            if (scroller === window) {
                const viewportHeight = window.innerHeight;
                const targetY = coords.top + (coords.bottom - coords.top) / 2;
                const deltaY = targetY - viewportHeight / 2;

                if (Math.abs(deltaY) > 8) {
                    window.scrollBy({
                        top: deltaY,
                        behavior: 'smooth'
                    });
                }
            } else {
                const rect = scroller.getBoundingClientRect();
                const targetY = coords.top + (coords.bottom - coords.top) / 2;
                const containerY = rect.top + scroller.clientHeight / 2;
                const deltaY = targetY - containerY;

                if (Math.abs(deltaY) > 8) {
                    scroller.scrollBy({
                        top: deltaY,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }

    function isScrollableElement(el) {
        if (!el || !(el instanceof HTMLElement)) return false;

        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;

        return /(auto|scroll|overlay)/.test(overflowY) &&
            el.scrollHeight > el.clientHeight + 4;
    }

    function getScrollableAncestors(node) {
        const result = [];

        let el = node;

        while (
            el &&
            el instanceof HTMLElement &&
            el !== document.body &&
            el !== document.documentElement
        ) {
            if (isScrollableElement(el)) {
                result.push(el);
            }

            el = el.parentElement;
        }

        result.push(window);

        return result;
    }


    function buildPMTextIndex(view) {
        const doc = view.state.doc;

        let normalizedText = '';
        const map = [];

        doc.descendants(function (node, pos) {
            if (node.isText) {
                const text = node.text || '';

                for (let i = 0; i < text.length; i++) {
                    normalizedText += normalizeSpaceChar(text[i]);

                    map.push({
                        from: pos + i,
                        to: pos + i + 1,
                        type: 'text'
                    });
                }

                return false;
            }

            if (node.type && node.type.name === 'hardBreak') {
                normalizedText += '\n';

                map.push({
                    from: pos,
                    to: pos + node.nodeSize,
                    type: 'hardBreak'
                });

                return false;
            }

            return true;
        });

        return {
            normalizedText,
            map
        };
    }


    function findMatches(searchText) {
        const view = getPMView();

        if (!view) {
            console.warn('[Gululu Format Replace] findMatches: 没有 EditorView');
            return [];
        }

        const normalizedSearchText = normalizeTextForSearch(searchText);

        if (!normalizedSearchText) return [];

        const index = buildPMTextIndex(view);
        const result = [];

        console.debug('[Gululu Format Replace] search:', normalizedSearchText);
        console.debug('[Gululu Format Replace] doc preview:', index.normalizedText.slice(0, 800));
        console.debug('[Gululu Format Replace] doc includes:', index.normalizedText.includes(normalizedSearchText));

        let pos = 0;

        while (true) {
            const found = index.normalizedText.indexOf(normalizedSearchText, pos);

            if (found === -1) break;

            const first = index.map[found];
            const last = index.map[found + normalizedSearchText.length - 1];

            if (first && last) {
                result.push({
                    view,
                    from: first.from,
                    to: last.to,
                    searchText,
                    normalizedSearchText
                });
            }

            pos = found + Math.max(normalizedSearchText.length, 1);
        }

        console.debug('[Gululu Format Replace] matches:', result.length, result);

        return result;
    }




    function refreshSearch(resetIndex = false) {
        const searchText = searchInput ? searchInput.value : '';

        if (resetIndex || searchText !== lastSearchText) {
            currentIndex = -1;
        }

        lastSearchText = searchText;
        matches = findMatches(searchText);

        if (matches.length === 0) {
            currentIndex = -1;
        } else if (currentIndex >= matches.length) {
            currentIndex = matches.length - 1;
        }

        updateStatus();
    }

    function updateStatus() {
        if (!statusText) return;

        if (!searchInput || !searchInput.value) {
            statusText.textContent = '请输入搜索文本';
            return;
        }

        if (!matches.length) {
            statusText.textContent = '找到 0 处';
            return;
        }

        const current = currentIndex >= 0 ? currentIndex + 1 : 0;
        statusText.textContent = `找到 ${matches.length} 处，当前 ${current}/${matches.length}`;
    }

    function positionAt(indexData, globalIndex, preferEnd = false) {
        const { segments } = indexData;

        if (!segments.length) return null;

        for (const seg of segments) {
            if (globalIndex > seg.start && globalIndex < seg.end) {
                return {
                    node: seg.node,
                    offset: globalIndex - seg.start
                };
            }

            if (globalIndex === seg.start && !preferEnd) {
                return {
                    node: seg.node,
                    offset: 0
                };
            }

            if (globalIndex === seg.end && preferEnd) {
                return {
                    node: seg.node,
                    offset: seg.node.nodeValue.length
                };
            }
        }

        const last = segments[segments.length - 1];

        if (globalIndex === last.end) {
            return {
                node: last.node,
                offset: last.node.nodeValue.length
            };
        }

        return null;
    }

    function rangeFromMatch(match) {
        const root = match.root;
        if (!root || !document.body.contains(root)) return null;

        const indexData = buildTextIndex(root);

        const startPos = positionAt(indexData, match.start, false);
        const endPos = positionAt(indexData, match.end, true);

        if (!startPos || !endPos) return null;

        try {
            const range = document.createRange();
            range.setStart(startPos.node, startPos.offset);
            range.setEnd(endPos.node, endPos.offset);
            return range;
        } catch (e) {
            return null;
        }
    }

    function getRangeVisibleRect(range) {
        if (!range) return null;

        const rects = Array.from(range.getClientRects())
        .filter(rect => rect.width > 0 || rect.height > 0);

        if (rects.length > 0) {
            return rects[0];
        }

        const rect = range.getBoundingClientRect();

        if (rect && (rect.width > 0 || rect.height > 0)) {
            return rect;
        }

        return null;
    }

    function isScrollableElement(el) {
        if (!el || !(el instanceof HTMLElement)) return false;

        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;

        const canScrollY =
              /(auto|scroll|overlay)/.test(overflowY) &&
              el.scrollHeight > el.clientHeight + 4;

        const canScrollX =
              /(auto|scroll|overlay)/.test(overflowX) &&
              el.scrollWidth > el.clientWidth + 4;

        return canScrollY || canScrollX;
    }

    function getScrollableAncestors(node) {
        const result = [];

        let el = node;

        if (el && el.nodeType === Node.TEXT_NODE) {
            el = el.parentElement;
        }

        while (el && el instanceof HTMLElement && el !== document.body && el !== document.documentElement) {
            if (isScrollableElement(el)) {
                result.push(el);
            }

            el = el.parentElement;
        }

        // 最后把页面本身也加入，兼容普通页面滚动
        result.push(window);

        return result;
    }

    function scrollRangeToCenter(range) {
        if (!range) return false;

        let startNode = range.startContainer;

        if (startNode && startNode.nodeType === Node.TEXT_NODE) {
            startNode = startNode.parentElement;
        }

        if (!startNode) return false;

        const scrollers = getScrollableAncestors(startNode);

        let didScroll = false;

        for (const scroller of scrollers) {
            const rect = getRangeVisibleRect(range);

            if (!rect) continue;

            if (scroller === window) {
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

                const targetCenterY = rect.top + rect.height / 2;
                const targetCenterX = rect.left + rect.width / 2;

                const deltaY = targetCenterY - viewportHeight / 2;
                const deltaX = targetCenterX - viewportWidth / 2;

                if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) {
                    window.scrollBy({
                        top: deltaY,
                        left: deltaX,
                        behavior: 'smooth'
                    });

                    didScroll = true;
                }
            } else {
                const containerRect = scroller.getBoundingClientRect();

                const targetCenterY = rect.top + rect.height / 2;
                const containerCenterY = containerRect.top + scroller.clientHeight / 2;

                const targetCenterX = rect.left + rect.width / 2;
                const containerCenterX = containerRect.left + scroller.clientWidth / 2;

                const deltaY = targetCenterY - containerCenterY;
                const deltaX = targetCenterX - containerCenterX;

                if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) {
                    scroller.scrollBy({
                        top: deltaY,
                        left: deltaX,
                        behavior: 'smooth'
                    });

                    didScroll = true;
                }
            }
        }

        return didScroll;
    }


    function selectRange(range, root) {
        if (!range || !root) return false;

        try {
            // 防止 focus 的时候浏览器自己乱滚动
            try {
                root.focus({
                    preventScroll: true
                });
            } catch (e) {
                root.focus();
            }

            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            // 先立即滚动一次
            scrollRangeToCenter(range);

            // ProseMirror / 浏览器有时会在选区变化后再次调整滚动位置，
            // 所以延迟再滚动两次，保证目标尽量居中。
            setTimeout(() => {
                scrollRangeToCenter(range);
            }, 60);

            setTimeout(() => {
                scrollRangeToCenter(range);
            }, 180);

            return true;
        } catch (e) {
            console.error('[Gululu Format Replace] select range failed:', e);
            return false;
        }
    }


    function goNext() {
        refreshSearch(false);

        if (!matches.length) {
            showToast('没有找到匹配文本');
            return;
        }

        currentIndex = (currentIndex + 1) % matches.length;

        const match = matches[currentIndex];

        if (!selectPMRange(match)) {
            showToast('无法定位此处文本');
            return;
        }

        updateStatus();
    }


    function goPrev() {
        refreshSearch(false);

        if (!matches.length) {
            showToast('没有找到匹配文本');
            return;
        }

        currentIndex = currentIndex <= 0
            ? matches.length - 1
        : currentIndex - 1;

        const match = matches[currentIndex];

        if (!selectPMRange(match)) {
            showToast('无法定位此处文本');
            return;
        }

        updateStatus();
    }

    function getReplacementHTMLForPM(match) {
        if (!replaceBox) return '';

        let html = replaceBox.innerHTML || '';
        const plain = replaceBox.textContent || '';

        if (!plain.trim() && html.replace(/<br\s*\/?>/gi, '').trim() === '') {
            return '';
        }

        const temp = document.createElement('div');
        temp.innerHTML = html;

        cleanContentEditableJunk(temp);

        /**
     * 单行替换正文局部文字时，把 p/div 转成 span。
     * 注意：不是直接拆掉，而是转成 span 并保留属性，
     * 避免掉颜色、加粗等格式。
     */
        if (
            isSingleLineReplacement(replaceBox) &&
            !hasHeadingInReplacement(temp) &&
            isInlinePMReplaceRange(match)
        ) {
            convertParagraphLikeBlocksToInline(temp);
        }

        return temp.innerHTML;
    }

    function cleanContentEditableJunk(container) {
        if (!container) return;

        const brs = Array.from(container.querySelectorAll('br'));

        for (const br of brs) {
            const cls = br.getAttribute('class') || '';

            if (cls.includes('ProseMirror-trailingBreak')) {
                br.remove();
            }
        }
    }

    function isSingleLineReplacement(box) {
        if (!box) return true;

        const text = box.innerText || box.textContent || '';
        const normalized = text.replace(/\n+$/g, '');

        return !/[\r\n]/.test(normalized);
    }

    function hasHeadingInReplacement(container) {
        return !!(container && container.querySelector('h1, h2'));
    }

    function isInlinePMReplaceRange(match) {
        if (!match || !match.view) return false;

        try {
            const doc = match.view.state.doc;
            const $from = doc.resolve(match.from);
            const $to = doc.resolve(match.to);

            // 起止位置在同一个父节点内，一般就是替换一段正文中的局部文字
            return $from.sameParent($to);
        } catch (e) {
            return false;
        }
    }

    function convertParagraphLikeBlocksToInline(container) {
        if (!container) return;

        const blocks = Array.from(container.querySelectorAll('div, p')).reverse();

        for (const block of blocks) {
            const parent = block.parentNode;
            if (!parent) continue;

            const span = document.createElement('span');

            copyAllAttributes(block, span);

            while (block.firstChild) {
                span.appendChild(block.firstChild);
            }

            parent.replaceChild(span, block);
        }

        removeEdgeBr(container);
    }

    function copyAllAttributes(from, to) {
        if (!from || !to) return;

        for (const attr of Array.from(from.attributes)) {
            to.setAttribute(attr.name, attr.value);
        }
    }

    function removeEdgeBr(container) {
        if (!container) return;

        while (
            container.firstChild &&
            container.firstChild.nodeType === Node.ELEMENT_NODE &&
            container.firstChild.tagName === 'BR'
        ) {
            container.removeChild(container.firstChild);
        }

        while (
            container.lastChild &&
            container.lastChild.nodeType === Node.ELEMENT_NODE &&
            container.lastChild.tagName === 'BR'
        ) {
            container.removeChild(container.lastChild);
        }
    }

    function createReplacementSlice(match) {
        const view = match.view;
        const html = getReplacementHTMLForPM(match);

        if (!html) return null;

        const temp = document.createElement('div');
        temp.innerHTML = html;

        const parser =
              view.someProp &&
              (
                  view.someProp('clipboardParser') ||
                  view.someProp('domParser')
              );

        if (!parser || typeof parser.parseSlice !== 'function') {
            throw new Error('无法获取 ProseMirror DOMParser');
        }

        return parser.parseSlice(temp, {
            preserveWhitespace: true,
            context: view.state.doc.resolve(match.from)
        });
    }

    function getPMTextBetween(view, from, to) {
        return view.state.doc.textBetween(from, to, '\n', '\n');
    }

    function upsertPMMark(marks, mark) {
    if (!mark) return marks;

    const next = marks.filter(item => item.type !== mark.type);
    next.push(mark);

    return next;
}

function addPMMark(schema, marks, typeName, attrs) {
    if (!schema.marks[typeName]) return marks;

    try {
        const mark = schema.marks[typeName].create(attrs || null);
        return upsertPMMark(marks, mark);
    } catch (e) {
        console.warn('[Gululu Format Replace] create mark failed:', typeName, attrs, e);
        return marks;
    }
}

function getElementOwnMarks(el, schema, baseMarks) {
    let marks = baseMarks.slice();

    if (!(el instanceof HTMLElement)) {
        return marks;
    }

    const tag = el.tagName.toLowerCase();
    const style = el.style || {};

    let computedStyle = null;

    try {
        computedStyle = window.getComputedStyle(el);
    } catch (e) {
        computedStyle = null;
    }

    // =========================
    // 加粗
    // =========================
    const inlineFontWeight = style.fontWeight || '';
    const computedFontWeight = computedStyle ? computedStyle.fontWeight || '' : '';
    const attrFontWeight =
        el.getAttribute('font-weight') ||
        el.getAttribute('data-font-weight') ||
        '';

    if (
        tag === 'b' ||
        tag === 'strong' ||
        isBoldFontWeight(inlineFontWeight) ||
        isBoldFontWeight(computedFontWeight) ||
        isBoldFontWeight(attrFontWeight) ||
        /font-weight\s*:\s*(bold|bolder|[6-9]00|[1-9]\d{3,})/i.test(el.getAttribute('style') || '')
    ) {
        marks = addPMMark(schema, marks, 'bold');
    }

    // =========================
    // 斜体
    // =========================
    const inlineFontStyle = style.fontStyle || '';
    const computedFontStyle = computedStyle ? computedStyle.fontStyle || '' : '';

    if (
        tag === 'i' ||
        tag === 'em' ||
        inlineFontStyle === 'italic' ||
        computedFontStyle === 'italic'
    ) {
        marks = addPMMark(schema, marks, 'italic');
    }

    // =========================
    // 下划线 / 删除线
    // =========================
    const textDecoration = [
        style.textDecoration,
        style.textDecorationLine,
        computedStyle ? computedStyle.textDecoration : '',
        computedStyle ? computedStyle.textDecorationLine : ''
    ].join(' ');

    if (
        tag === 'u' ||
        /underline/i.test(textDecoration)
    ) {
        marks = addPMMark(schema, marks, 'underline');
    }

    if (
        tag === 's' ||
        tag === 'strike' ||
        tag === 'del' ||
        /line-through/i.test(textDecoration)
    ) {
        marks = addPMMark(schema, marks, 'strike');
    }

    // =========================
    // 颜色
    // =========================
    const inlineColor = style.color || '';
    const computedColor = computedStyle ? computedStyle.color || '' : '';
    const attrColor = el.getAttribute('color') || '';

    const color = inlineColor || attrColor || computedColor;

    if (
        color &&
        color !== 'inherit' &&
        color !== 'initial' &&
        color !== 'rgba(0, 0, 0, 0)'
    ) {
        marks = addPMMark(schema, marks, 'textStyle', {
            color
        });
    }

    return marks;
}

    function isBoldFontWeight(value) {
    if (value == null) return false;

    const text = String(value).trim().toLowerCase();

    if (!text) return false;

    if (text === 'bold' || text === 'bolder') {
        return true;
    }

    const num = parseInt(text, 10);

    return Number.isFinite(num) && num >= 600;
}


function createPMHardBreak(schema, marks) {
    if (!schema.nodes.hardBreak) return null;

    try {
        return schema.nodes.hardBreak.create(null, null, marks);
    } catch (e) {
        try {
            return schema.nodes.hardBreak.create();
        } catch (e2) {
            console.warn('[Gululu Format Replace] create hardBreak failed:', e2);
            return null;
        }
    }
}

function collectPMInlineNodesFromDOM(domNode, schema, inheritedMarks, out) {
    if (!domNode) return;

    // 文本节点
    if (domNode.nodeType === Node.TEXT_NODE) {
        const text = domNode.nodeValue || '';

        if (text) {
            try {
                out.push(schema.text(text, inheritedMarks));
            } catch (e) {
                console.warn('[Gululu Format Replace] create text node failed:', text, inheritedMarks, e);
            }
        }

        return;
    }

    // 非元素节点跳过
    if (domNode.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const el = domNode;
    const tag = el.tagName.toLowerCase();

    // br 转成 Gululu 的 hardBreak
    if (tag === 'br') {
        const br = createPMHardBreak(schema, inheritedMarks);

        if (br) {
            out.push(br);
        }

        return;
    }

    const marks = getElementOwnMarks(el, schema, inheritedMarks);

    // 对 div / p 做特殊处理：
    // 如果替换框里有多个 div/p，尽量用 hardBreak 连接，而不是制造 paragraph。
    // 这样在替换正文局部文字时不会把软换行变成换段。
    const isBlockLike = tag === 'div' || tag === 'p';

    if (isBlockLike && out.length > 0) {
        const br = createPMHardBreak(schema, marks);
        if (br) out.push(br);
    }

    for (const child of Array.from(el.childNodes)) {
        collectPMInlineNodesFromDOM(child, schema, marks, out);
    }
}

function createReplacementInlineNodes(match) {
    if (!match || !match.view || !replaceBox) return [];

    const view = match.view;
    const schema = view.state.schema;

    const plain = replaceBox.textContent || '';
    const html = replaceBox.innerHTML || '';

    if (!plain.trim() && html.replace(/<br\s*\/?>/gi, '').trim() === '') {
        return [];
    }

    /**
     * 关键修改：
     * 不再从 temp.innerHTML 里解析。
     * 直接读取页面上真实的 replaceBox 子节点。
     *
     * 这样 window.getComputedStyle(el) 才能拿到实际显示的 font-weight，
     * 避免加粗丢失。
     */
    const nodes = [];

    for (const child of Array.from(replaceBox.childNodes)) {
        collectPMInlineNodesFromDOM(child, schema, [], nodes);
    }

    // 清理开头多余 hardBreak
    while (
        nodes.length &&
        nodes[0].type &&
        nodes[0].type.name === 'hardBreak'
    ) {
        nodes.shift();
    }

    // 清理结尾多余 hardBreak
    while (
        nodes.length &&
        nodes[nodes.length - 1].type &&
        nodes[nodes.length - 1].type.name === 'hardBreak'
    ) {
        nodes.pop();
    }

    // 临时调试：确认生成的 ProseMirror 节点是否带 bold mark
    console.debug(
        '[Gululu Format Replace] replacement PM nodes:',
        nodes.map(node => ({
            type: node.type.name,
            text: node.text,
            marks: node.marks ? node.marks.map(mark => ({
                type: mark.type.name,
                attrs: mark.attrs
            })) : []
        }))
    );

    return nodes;
}



    function replacePMMatch(match) {
    if (!match || !match.view) return false;

    const view = match.view;

    try {
        const state = view.state;
        let tr = state.tr;

        const html = getReplacementHTMLForPM(match);

        if (!html) {
            tr = tr.delete(match.from, match.to);
        } else {
            const nodes = createReplacementInlineNodes(match);

            if (!nodes.length) {
                console.warn('[Gululu Format Replace] replacement nodes empty');
                return false;
            }

            /**
             * 关键修改：
             * 不再使用 parseSlice / replaceRange。
             * 直接用 ProseMirror schema 创建 inline nodes，然后 replaceWith。
             */
            tr = tr.replaceWith(match.from, match.to, nodes);
        }

        if (!tr.docChanged) {
            console.warn('[Gululu Format Replace] transaction did not change doc');
            return false;
        }

        tr = tr.scrollIntoView();

        view.dispatch(tr);
        view.focus();

        setTimeout(() => {
            scrollPMPosToCenter(view, match.from);
        }, 80);

        return true;
    } catch (e) {
        console.error('[Gululu Format Replace] replacePMMatch failed:', e);
        return false;
    }
}



    function cleanContentEditableJunk(container) {
        if (!container) return;

        // 去掉一些 contenteditable 里常见的无意义结尾 br
        const brs = Array.from(container.querySelectorAll('br'));

        for (const br of brs) {
            const cls = br.getAttribute('class') || '';

            // ProseMirror 或浏览器可能留下的占位 br
            if (cls.includes('ProseMirror-trailingBreak')) {
                br.remove();
            }
        }
    }

    function isSingleLineReplacement(box) {
        if (!box) return true;

        // innerText 比 textContent 更接近用户看到的换行
        const text = box.innerText || box.textContent || '';

        // 去掉末尾由 contenteditable 自动产生的换行
        const normalized = text.replace(/\n+$/g, '');

        return !/[\r\n]/.test(normalized);
    }

    function hasHeadingInReplacement(container) {
        if (!container) return false;

        return !!container.querySelector('h1, h2');
    }

    function isBlockElement(el) {
        if (!el || !(el instanceof HTMLElement)) return false;

        const blockTags = new Set([
            'P',
            'DIV',
            'LI',
            'UL',
            'OL',
            'BLOCKQUOTE',
            'PRE',
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6'
        ]);

        return blockTags.has(el.tagName);
    }

    function closestBlockElement(node, root) {
        let el = node;

        if (el && el.nodeType === Node.TEXT_NODE) {
            el = el.parentElement;
        }

        while (el && el instanceof HTMLElement && el !== root) {
            if (isBlockElement(el)) {
                return el;
            }

            el = el.parentElement;
        }

        return null;
    }

    function isInlineReplaceRange(range, root) {
        if (!range || !root) return false;

        const startBlock = closestBlockElement(range.startContainer, root);
        const endBlock = closestBlockElement(range.endContainer, root);

        // 起点和终点在同一个块里，说明大概率是在替换正文中的局部文字
        return !!startBlock && startBlock === endBlock;
    }

    function unwrapParagraphLikeBlocks(container) {
        if (!container) return;

        /**
     * 单行替换时，不能直接把 div / p 拆掉。
     * 因为浏览器或 ProseMirror 可能把颜色、加粗、下划线等格式挂在 div / p 上。
     *
     * 错误做法：
     * <div style="color:red">文本</div>
     * 直接拆成：
     * 文本
     * 这样 color 就丢了。
     *
     * 正确做法：
     * <div style="color:red">文本</div>
     * 转成：
     * <span style="color:red">文本</span>
     *
     * 这样既避免块级元素破坏软换行，又尽量保留格式。
     */
        const blocks = Array.from(container.querySelectorAll('div, p')).reverse();

        for (const block of blocks) {
            const parent = block.parentNode;
            if (!parent) continue;

            const span = document.createElement('span');

            copyUsefulAttributes(block, span);

            while (block.firstChild) {
                span.appendChild(block.firstChild);
            }

            parent.replaceChild(span, block);
        }

        removeEdgeBr(container);
    }

    function copyUsefulAttributes(from, to) {
        if (!from || !to) return;

        for (const attr of Array.from(from.attributes)) {
            const name = attr.name;
            const value = attr.value;

            if (!name) continue;

            /**
         * style 是最重要的：
         * color、font-weight、font-style、text-decoration 等通常都在这里。
         */
            if (name.toLowerCase() === 'style') {
                to.setAttribute('style', value);
                continue;
            }

            /**
         * class / data-* 等不一定会被 Gululu 保留，
         * 但根据你的需求：不要主动删除多余格式。
         * 所以这里也搬过去，让 ProseMirror 自己决定是否接受。
         */
            to.setAttribute(name, value);
        }
    }


    function removeEdgeBr(container) {
        if (!container) return;

        while (
            container.firstChild &&
            container.firstChild.nodeType === Node.ELEMENT_NODE &&
            container.firstChild.tagName === 'BR'
        ) {
            container.removeChild(container.firstChild);
        }

        while (
            container.lastChild &&
            container.lastChild.nodeType === Node.ELEMENT_NODE &&
            container.lastChild.tagName === 'BR'
        ) {
            container.removeChild(container.lastChild);
        }
    }


    function getReplacementHTML(range, root) {
        if (!replaceBox) return '';

        let html = replaceBox.innerHTML || '';
        const plain = replaceBox.textContent || '';

        // contenteditable 为空时，不同浏览器可能会留下 <br>
        if (!plain.trim() && html.replace(/<br\s*\/?>/gi, '').trim() === '') {
            return '';
        }

        const temp = document.createElement('div');
        temp.innerHTML = html;

        cleanContentEditableJunk(temp);

        /**
     * 关键处理：
     * 如果用户替换的是正文里的局部文字，
     * 并且替换框内容是单行，
     * 并且替换框里没有 H1 / H2，
     * 那么就把浏览器自动包出来的 div / p 去掉。
     *
     * 否则 ProseMirror 会把替换内容当成块级内容插入，
     * 导致原本的软换行变成真正换行。
     */
        const shouldInsertInline =
              isSingleLineReplacement(replaceBox) &&
              !hasHeadingInReplacement(temp) &&
              isInlineReplaceRange(range, root);

        if (shouldInsertInline) {
            unwrapParagraphLikeBlocks(temp);
        }

        return temp.innerHTML;
    }


    function dispatchEditorInput(root) {
        try {
            root.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertReplacementText',
                data: null
            }));
        } catch (e) {
            root.dispatchEvent(new Event('input', {
                bubbles: true
            }));
        }
    }

    function replaceRange(range, root) {
        if (!range || !root) return false;

        if (!root.contains(range.commonAncestorContainer)) {
            return false;
        }

        const html = getReplacementHTML(range, root);

        try {
            root.focus();

            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            let ok;

            if (!html) {
                ok = document.execCommand('delete', false, null);
            } else {
                ok = document.execCommand('insertHTML', false, html);
            }

            dispatchEditorInput(root);

            return ok !== false;
        } catch (e) {
            console.error('[Gululu Format Replace] replace failed:', e);
            return false;
        }
    }

    function replaceCurrent() {
        refreshSearch(false);

        if (!searchInput || !searchInput.value) {
            showToast('请先输入搜索文本');
            return;
        }

        if (!matches.length) {
            showToast('没有找到匹配文本');
            return;
        }

        if (currentIndex < 0) {
            currentIndex = 0;
        }

        const match = matches[currentIndex];
        const view = match.view;

        const actualText = getPMTextBetween(view, match.from, match.to);

        if (
            normalizeTextForSearch(actualText) !==
            normalizeTextForSearch(searchInput.value)
        ) {
            showToast('此处文本已变化，请重新搜索');
            refreshSearch(true);
            return;
        }

        const ok = replacePMMatch(match);

        if (!ok) {
            alert('有 1 处文本未能替换，可能是不可替换文本。');
        }

        setTimeout(() => {
            refreshSearch(true);

            if (matches.length) {
                currentIndex = Math.min(currentIndex, matches.length - 1);
                updateStatus();

                if (currentIndex >= 0) {
                    selectPMRange(matches[currentIndex]);
                }
            }
        }, 100);
    }


    async function replaceAll() {
        refreshSearch(true);

        if (!searchInput || !searchInput.value) {
            showToast('请先输入搜索文本');
            return;
        }

        if (!matches.length) {
            showToast('没有找到匹配文本');
            return;
        }

        const searchText = searchInput.value;

        // 倒序替换，避免前面的替换影响后面的 from/to 位置
        const snapshot = matches
        .slice()
        .sort((a, b) => b.from - a.from);

        let success = 0;
        let failed = 0;

        for (const match of snapshot) {
            const view = match.view;

            if (!view || !view.state || !view.state.doc) {
                failed++;
                continue;
            }

            const actualText = getPMTextBetween(view, match.from, match.to);

            if (
                normalizeTextForSearch(actualText) !==
                normalizeTextForSearch(searchText)
            ) {
                failed++;
                continue;
            }

            const ok = replacePMMatch(match);

            if (ok) {
                success++;
            } else {
                failed++;
            }

            await delay(30);
        }

        setTimeout(() => {
            refreshSearch(true);
        }, 120);

        if (failed > 0) {
            alert(`已替换 ${success} 处。\n有 ${failed} 处文本未能替换，可能是不可替换文本。`);
        } else {
            showToast(`已全部替换，共 ${success} 处`);
        }
    }


    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function checkReplaceFormat() {
        if (!replaceBox || !warningText) return;

        const unsupported = hasPossiblyUnsupportedFormat(replaceBox);

        if (unsupported) {
            warningText.textContent = '可能存在 Gululu 不支持的格式，替换后的显示效果可能不同。';
        } else {
            warningText.textContent = '';
        }
    }

    function hasPossiblyUnsupportedFormat(root) {
        const allowedTags = new Set([
            'B',
            'STRONG',
            'I',
            'EM',
            'U',
            'S',
            'STRIKE',
            'DEL',
            'SPAN',
            'H1',
            'H2',
            'P',
            'DIV',
            'BR'
        ]);

        const allowedStyleProps = new Set([
            'color',
            'font-weight',
            'font-style',
            'text-decoration',
            'text-decoration-line'
        ]);

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT,
            null
        );

        let node;

        while ((node = walker.nextNode())) {
            if (!(node instanceof HTMLElement)) continue;

            const tag = node.tagName;

            if (!allowedTags.has(tag)) {
                return true;
            }

            // h1 / h2 / p / div / br 这类结构本身允许
            // 但如果带了复杂 style，也提示风险
            const style = node.getAttribute('style') || '';

            if (style.trim()) {
                const parts = style.split(';')
                .map(s => s.trim())
                .filter(Boolean);

                for (const part of parts) {
                    const prop = part.split(':')[0]
                    .trim()
                    .toLowerCase();

                    if (!allowedStyleProps.has(prop)) {
                        return true;
                    }
                }
            }

            // class / data-* / id 等一般来自外部富文本，Gululu 未必支持
            // 不删除，只提示
            for (const attr of Array.from(node.attributes)) {
                const name = attr.name.toLowerCase();

                if (
                    name === 'style' ||
                    name === 'href'
                ) {
                    continue;
                }

                if (
                    name === 'class' ||
                    name === 'id' ||
                    name.startsWith('data-') ||
                    name.startsWith('aria-')
                ) {
                    return true;
                }
            }

            // a 标签本身不在 allowedTags，会在上面触发
            // img/table/code/pre 等也会触发
        }

        return false;
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            hidePanel();
        }
    });

    createBall();
})();
