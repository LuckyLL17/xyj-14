
/**
 * 编辑器组件
 * 处理富文本编辑器和Markdown编辑器的交互
 */
const EditorComponent = (function() {
    let currentMode = 'rich';
    let weatherData = null;
    let debounceTimer = null;
    let savedSelection = null;
    let savedTextareaSelection = null;
    
    function init() {
        bindEvents();
        loadWeatherData();
    }
    
    function bindEvents() {
        const editorModeSelect = document.getElementById('editor-mode');
        if (editorModeSelect) {
            editorModeSelect.addEventListener('change', function(e) {
                switchMode(e.target.value);
            });
        }
        
        const toolbarButtons = document.querySelectorAll('[data-action]');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.getAttribute('data-action');
                handleToolbarAction(action, this);
            });
            btn.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });
        });
        
        const markdownToolbarButtons = document.querySelectorAll('[data-markdown]');
        markdownToolbarButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const markdown = this.getAttribute('data-markdown');
                insertMarkdownText(markdown);
            });
        });
        
        const richContent = document.getElementById('rich-content');
        if (richContent) {
            richContent.addEventListener('input', debounce(handleContentChange, 300));
            richContent.addEventListener('keyup', handleKeyUp);
            richContent.addEventListener('paste', handlePaste);
            richContent.addEventListener('focus', function() {
                savedSelection = null;
            });
            richContent.addEventListener('blur', function() {
                saveSelection();
            });
            richContent.addEventListener('click', handleLinkClick);
            richContent.addEventListener('mouseover', handleLinkMouseOver);
            richContent.addEventListener('mouseout', handleLinkMouseOut);
        }
        
        const markdownContent = document.getElementById('markdown-content');
        if (markdownContent) {
            markdownContent.addEventListener('input', debounce(handleMarkdownChange, 300));
            markdownContent.addEventListener('keyup', handleMarkdownKeyUp);
            markdownContent.addEventListener('blur', function() {
                savedTextareaSelection = {
                    start: this.selectionStart,
                    end: this.selectionEnd
                };
            });
        }
        
        document.addEventListener('selectionchange', handleSelectionChange);
        
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        const quickItems = document.querySelectorAll('.quick-item[data-text]');
        quickItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const text = this.getAttribute('data-text');
                insertTextAtCursor(text);
            });
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });
        });
        
        const closeQuickPanel = document.getElementById('close-quick-panel');
        if (closeQuickPanel) {
            closeQuickPanel.addEventListener('click', function() {
                hideQuickPanel();
            });
        }
        
        const imageUploadInput = document.getElementById('image-upload-input');
        if (imageUploadInput) {
            imageUploadInput.addEventListener('change', handleImageUpload);
        }
    }
    
    function saveSelection() {
        if (currentMode === 'rich') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                savedSelection = selection.getRangeAt(0).cloneRange();
            }
        }
    }
    
    function restoreSelection() {
        if (currentMode === 'rich') {
            if (savedSelection) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                try {
                    selection.addRange(savedSelection);
                } catch (e) {
                    console.warn('Could not restore selection:', e);
                }
            }
            
            const richContent = document.getElementById('rich-content');
            if (richContent) {
                richContent.focus();
            }
        } else {
            const textarea = document.getElementById('markdown-content');
            if (textarea && savedTextareaSelection) {
                textarea.focus();
                textarea.setSelectionRange(savedTextareaSelection.start, savedTextareaSelection.end);
            }
        }
    }
    
    function handleSelectionChange() {
        if (currentMode === 'rich') {
            const richContent = document.getElementById('rich-content');
            if (richContent && richContent.contains(document.activeElement)) {
                updateToolbarState();
            }
        }
    }
    
    function updateToolbarState() {
        const states = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikethrough'),
            h1: document.queryCommandValue('formatBlock') === 'h1',
            h2: document.queryCommandValue('formatBlock') === 'h2',
            h3: document.queryCommandValue('formatBlock') === 'h3',
            ul: document.queryCommandState('insertUnorderedList'),
            ol: document.queryCommandState('insertOrderedList')
        };
        
        const toolbarButtons = document.querySelectorAll('[data-action]');
        toolbarButtons.forEach(btn => {
            const action = btn.getAttribute('data-action');
            if (states[action] !== undefined) {
                if (states[action]) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }
    
    async function loadWeatherData() {
        try {
            weatherData = await WeatherService.getCurrentWeather();
            updateWeatherDisplay();
        } catch (e) {
            console.error('Load weather data failed:', e);
        }
    }
    
    function updateWeatherDisplay() {
        const metaWeather = document.getElementById('meta-weather');
        if (metaWeather && weatherData) {
            metaWeather.textContent = `${weatherData.emoji} ${weatherData.weather} ${weatherData.temperature?.current || ''}°C`;
        }
    }
    
    function switchMode(mode) {
        currentMode = mode;
        
        const richEditor = document.getElementById('rich-editor');
        const markdownEditor = document.getElementById('markdown-editor');
        const richToolbar = document.getElementById('rich-toolbar');
        const markdownToolbar = document.getElementById('markdown-toolbar');
        
        if (mode === 'rich') {
            if (richEditor) richEditor.style.display = 'flex';
            if (markdownEditor) markdownEditor.style.display = 'none';
            if (richToolbar) richToolbar.style.display = 'flex';
            if (markdownToolbar) markdownToolbar.style.display = 'none';
            
            const markdownContent = document.getElementById('markdown-content');
            const richContent = document.getElementById('rich-content');
            if (markdownContent && richContent && markdownContent.value) {
                richContent.innerHTML = MarkdownUtils.parse(markdownContent.value);
            }
        } else {
            if (richEditor) richEditor.style.display = 'none';
            if (markdownEditor) markdownEditor.style.display = 'flex';
            if (richToolbar) richToolbar.style.display = 'none';
            if (markdownToolbar) markdownToolbar.style.display = 'flex';
            
            const richContent = document.getElementById('rich-content');
            const markdownContent = document.getElementById('markdown-content');
            if (richContent && markdownContent && richContent.innerHTML) {
                markdownContent.value = MarkdownUtils.htmlToMarkdown(richContent.innerHTML);
                updateMarkdownPreview();
            }
        }
        
        const editorModeSelect = document.getElementById('editor-mode');
        if (editorModeSelect) {
            editorModeSelect.value = mode;
        }
    }
    
    function getCurrentMode() {
        return currentMode;
    }
    
    function handleToolbarAction(action, button) {
        restoreSelection();
        
        switch (action) {
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'underline':
                document.execCommand('underline', false, null);
                break;
            case 'strikethrough':
                document.execCommand('strikethrough', false, null);
                break;
            case 'h1':
                document.execCommand('formatBlock', false, 'h1');
                break;
            case 'h2':
                document.execCommand('formatBlock', false, 'h2');
                break;
            case 'h3':
                document.execCommand('formatBlock', false, 'h3');
                break;
            case 'ul':
                document.execCommand('insertUnorderedList', false, null);
                break;
            case 'ol':
                document.execCommand('insertOrderedList', false, null);
                break;
            case 'link':
                handleInsertLink();
                break;
            case 'image':
                handleInsertImage();
                break;
            case 'insert-date':
                insertTextAtCursor(DateUtils.getCurrentDateString());
                break;
            case 'insert-time':
                insertTextAtCursor(DateUtils.getCurrentTimeString());
                break;
            case 'insert-weather':
                insertWeatherText();
                break;
            case 'insert-emotion':
                saveSelection();
                toggleQuickPanel();
                break;
            default:
                break;
        }
        
        updateToolbarState();
        handleContentChange();
    }
    
    function handleInsertLink() {
        const selection = window.getSelection();
        let selectedText = '';
        
        if (selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
        }
        
        let displayText, url;
        
        if (selectedText) {
            url = prompt('请输入链接地址:', 'https://');
            displayText = selectedText;
        } else {
            displayText = prompt('请输入链接显示文本:', '');
            if (displayText) {
                url = prompt('请输入链接地址:', 'https://');
            }
        }
        
        if (url && displayText) {
            if (currentMode === 'rich') {
                const link = `<a href="${url}" target="_blank">${displayText}</a>`;
                document.execCommand('insertHTML', false, link);
            } else {
                const markdown = `[${displayText}](${url})`;
                insertMarkdownTextAtCursor(markdown);
            }
        }
    }
    
    function handleInsertImage() {
        if (currentMode === 'rich') {
            const imageUploadInput = document.getElementById('image-upload-input');
            if (imageUploadInput) {
                saveSelection();
                imageUploadInput.click();
            }
        } else {
            const imageUploadInput = document.getElementById('image-upload-input');
            if (imageUploadInput) {
                saveSelection();
                imageUploadInput.click();
            }
        }
    }
    
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            
            restoreSelection();
            
            if (currentMode === 'rich') {
                const img = document.createElement('img');
                img.src = base64Image;
                img.alt = file.name;
                img.style.maxWidth = '100%';
                
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(img);
                    
                    range.setStartAfter(img);
                    range.setEndAfter(img);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else {
                const markdown = `![${file.name}](${base64Image})`;
                insertMarkdownTextAtCursor(markdown);
            }
            
            handleContentChange();
        };
        
        reader.readAsDataURL(file);
        
        event.target.value = '';
    }
    
    function insertMarkdownTextAtCursor(text) {
        const textarea = document.getElementById('markdown-content');
        if (!textarea) return;
        
        let start, end;
        if (savedTextareaSelection) {
            start = savedTextareaSelection.start;
            end = savedTextareaSelection.end;
        } else {
            start = textarea.selectionStart;
            end = textarea.selectionEnd;
        }
        
        const selectedText = textarea.value.substring(start, end);
        const newText = textarea.value.substring(0, start) + text + textarea.value.substring(end);
        
        textarea.value = newText;
        textarea.focus();
        
        const newPosition = start + text.length;
        textarea.setSelectionRange(newPosition, newPosition);
        
        handleMarkdownChange();
    }
    
    function insertMarkdownText(markdown) {
        const textarea = document.getElementById('markdown-content');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let newText;
        let newCursorPos;
        
        if (selectedText) {
            newText = textarea.value.substring(0, start) + markdown + selectedText + markdown + textarea.value.substring(end);
            newCursorPos = start + markdown.length + selectedText.length + markdown.length;
        } else {
            newText = textarea.value.substring(0, start) + markdown + textarea.value.substring(end);
            newCursorPos = start + markdown.length;
        }
        
        textarea.value = newText;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        handleMarkdownChange();
    }
    
    function insertTextAtCursor(text) {
        if (currentMode === 'rich') {
            restoreSelection();
            
            const richContent = document.getElementById('rich-content');
            if (richContent) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    richContent.innerHTML += text;
                }
                richContent.focus();
            }
        } else {
            const textarea = document.getElementById('markdown-content');
            if (textarea) {
                let start, end;
                if (savedTextareaSelection) {
                    start = savedTextareaSelection.start;
                    end = savedTextareaSelection.end;
                } else {
                    start = textarea.selectionStart;
                    end = textarea.selectionEnd;
                }
                
                textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
                textarea.focus();
                const newPosition = start + text.length;
                textarea.setSelectionRange(newPosition, newPosition);
            }
        }
        
        hideQuickPanel();
        handleContentChange();
    }
    
    function insertWeatherText() {
        if (weatherData) {
            const weatherText = WeatherService.getQuickWeatherText(weatherData);
            insertTextAtCursor(weatherText);
        } else {
            insertTextAtCursor('今天天气不错。');
        }
    }
    
    function handleContentChange() {
        updateWordCount();
        analyzeContent();
    }
    
    function handleMarkdownChange() {
        updateMarkdownPreview();
        updateWordCount();
        analyzeContent();
    }
    
    function updateMarkdownPreview() {
        const markdownContent = document.getElementById('markdown-content');
        const markdownPreview = document.getElementById('markdown-preview');
        
        if (markdownContent && markdownPreview) {
            markdownPreview.innerHTML = MarkdownUtils.parse(markdownContent.value);
        }
    }
    
    function updateWordCount() {
        const wordCountEl = document.getElementById('word-count');
        if (!wordCountEl) return;
        
        let content = '';
        if (currentMode === 'rich') {
            const richContent = document.getElementById('rich-content');
            if (richContent) {
                content = MarkdownUtils.getPlainText(richContent.innerHTML);
            }
        } else {
            const markdownContent = document.getElementById('markdown-content');
            if (markdownContent) {
                content = markdownContent.value;
            }
        }
        
        const count = StatsService.countWords(content);
        wordCountEl.textContent = `字数: ${count}`;
    }
    
    async function analyzeContent() {
        let content = '';
        if (currentMode === 'rich') {
            const richContent = document.getElementById('rich-content');
            if (richContent) {
                content = MarkdownUtils.getPlainText(richContent.innerHTML);
            }
        } else {
            const markdownContent = document.getElementById('markdown-content');
            if (markdownContent) {
                content = markdownContent.value;
            }
        }
        
        if (!content || content.trim().length < 5) {
            updateEmotionDisplay(null);
            return;
        }
        
        try {
            const result = await SentimentService.analyze(content);
            updateEmotionDisplay(result);
        } catch (e) {
            console.error('Sentiment analysis error:', e);
        }
    }
    
    function updateEmotionDisplay(analysis) {
        const positiveBar = document.getElementById('emotion-positive');
        const neutralBar = document.getElementById('emotion-neutral');
        const negativeBar = document.getElementById('emotion-negative');
        const positiveValue = document.getElementById('emotion-positive-value');
        const neutralValue = document.getElementById('emotion-neutral-value');
        const negativeValue = document.getElementById('emotion-negative-value');
        
        if (!analysis) {
            if (positiveBar) positiveBar.style.width = '0%';
            if (neutralBar) neutralBar.style.width = '0%';
            if (negativeBar) negativeBar.style.width = '0%';
            if (positiveValue) positiveValue.textContent = '0%';
            if (neutralValue) neutralValue.textContent = '0%';
            if (negativeValue) negativeValue.textContent = '0%';
            return;
        }
        
        const positive = Math.round(analysis.positive * 100);
        const neutral = Math.round(analysis.neutral * 100);
        const negative = Math.round(analysis.negative * 100);
        
        if (positiveBar) positiveBar.style.width = `${positive}%`;
        if (neutralBar) neutralBar.style.width = `${neutral}%`;
        if (negativeBar) negativeBar.style.width = `${negative}%`;
        if (positiveValue) positiveValue.textContent = `${positive}%`;
        if (neutralValue) neutralValue.textContent = `${neutral}%`;
        if (negativeValue) negativeValue.textContent = `${negative}%`;
    }
    
    function handleKeyUp(e) {
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const node = range.startContainer;
                if (node.nodeName === 'LI' || (node.parentNode && node.parentNode.nodeName === 'LI')) {
                }
            }
        }
        updateToolbarState();
    }
    
    function handleMarkdownKeyUp(e) {
        if (e.key === 'Enter') {
            updateMarkdownPreview();
        }
    }
    
    function handlePaste(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }
    
    function handleLinkClick(e) {
        const target = e.target;
        
        const link = target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;
        
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, '_blank');
            return;
        }
        
        e.preventDefault();
        
        const openLink = confirm(`是否在新窗口打开链接？\n\n${href}\n\n提示：按住 Ctrl/Cmd 键点击链接可直接打开`);
        if (openLink) {
            window.open(href, '_blank');
        }
    }
    
    function handleLinkMouseOver(e) {
        const target = e.target;
        const link = target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;
        
        link.title = `${href}\n按住 Ctrl/Cmd 键点击可直接在新窗口打开`;
        link.style.cursor = 'pointer';
    }
    
    function handleLinkMouseOut(e) {
        const target = e.target;
        const link = target.closest('a');
        
        if (!link) return;
        
        const originalTitle = link.getAttribute('data-original-title');
        if (originalTitle) {
            link.title = originalTitle;
        }
    }
    
    function handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    if (currentMode === 'rich') {
                        document.execCommand('bold', false, null);
                        updateToolbarState();
                        handleContentChange();
                    }
                    break;
                case 'i':
                    e.preventDefault();
                    if (currentMode === 'rich') {
                        document.execCommand('italic', false, null);
                        updateToolbarState();
                        handleContentChange();
                    }
                    break;
                case 'u':
                    e.preventDefault();
                    if (currentMode === 'rich') {
                        document.execCommand('underline', false, null);
                        updateToolbarState();
                        handleContentChange();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    const saveBtn = document.getElementById('save-diary-btn');
                    if (saveBtn) {
                        saveBtn.click();
                    }
                    break;
            }
        }
    }
    
    function toggleQuickPanel() {
        const panel = document.getElementById('quick-input-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }
    
    function hideQuickPanel() {
        const panel = document.getElementById('quick-input-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
        savedTextareaSelection = null;
    }
    
    function setContent(content, mode = 'rich') {
        if (mode === 'rich') {
            const richContent = document.getElementById('rich-content');
            if (richContent) {
                richContent.innerHTML = content || '';
            }
        } else {
            const markdownContent = document.getElementById('markdown-content');
            if (markdownContent) {
                markdownContent.value = content || '';
                updateMarkdownPreview();
            }
        }
        
        updateWordCount();
        analyzeContent();
    }
    
    function getContent() {
        if (currentMode === 'rich') {
            const richContent = document.getElementById('rich-content');
            return richContent ? richContent.innerHTML : '';
        } else {
            const markdownContent = document.getElementById('markdown-content');
            return markdownContent ? markdownContent.value : '';
        }
    }
    
    function setTitle(title) {
        const titleInput = document.getElementById('diary-title');
        if (titleInput) {
            titleInput.value = title || '';
        }
    }
    
    function getTitle() {
        const titleInput = document.getElementById('diary-title');
        return titleInput ? titleInput.value : '';
    }
    
    function updateMetaDisplay(diary) {
        const metaDate = document.getElementById('meta-date');
        const metaTime = document.getElementById('meta-time');
        const metaWeather = document.getElementById('meta-weather');
        
        if (metaDate) {
            metaDate.textContent = diary ? DateUtils.format(diary.createdAt, 'YYYY年MM月DD日') : DateUtils.getCurrentDateString();
        }
        
        if (metaTime) {
            metaTime.textContent = diary ? DateUtils.format(diary.createdAt, 'HH:mm') : DateUtils.getCurrentTimeString();
        }
        
        if (metaWeather && diary && diary.weather) {
            metaWeather.textContent = `${diary.weather.emoji} ${diary.weather.weather} ${diary.weather.temperature?.current || ''}°C`;
        } else if (weatherData) {
            metaWeather.textContent = `${weatherData.emoji} ${weatherData.weather} ${weatherData.temperature?.current || ''}°C`;
        }
    }
    
    function reset() {
        setTitle('');
        setContent('');
        currentMode = 'rich';
        switchMode('rich');
        updateEmotionDisplay(null);
        updateMetaDisplay(null);
        hideQuickPanel();
        savedSelection = null;
        savedTextareaSelection = null;
    }
    
    function debounce(func, wait) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    return {
        init,
        switchMode,
        getCurrentMode,
        setContent,
        getContent,
        setTitle,
        getTitle,
        updateMetaDisplay,
        reset,
        toggleQuickPanel,
        hideQuickPanel,
        loadWeatherData,
        saveSelection,
        restoreSelection,
        updateToolbarState
    };
})();
