
/**
 * Markdown 工具函数
 */
const MarkdownUtils = (function() {
    
    function parse(markdown) {
        if (!markdown) {
            return '';
        }
        
        if (typeof marked !== 'undefined' && marked.parse) {
            try {
                const html = marked.parse(markdown);
                if (typeof DOMPurify !== 'undefined') {
                    return DOMPurify.sanitize(html);
                }
                return html;
            } catch (e) {
                console.error('Markdown parse error:', e);
            }
        }
        
        return simpleParse(markdown);
    }
    
    function simpleParse(markdown) {
        if (!markdown) return '';
        
        let html = markdown;
        
        html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
        
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/___(.*?)___/g, '<u>$1</u>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
        
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        html = html.replace(/```([\s\S]*?)```/g, function(match) {
            const code = match.slice(3, -3).trim();
            return `<pre><code>${escapeHtml(code)}</code></pre>`;
        });
        
        html = html.replace(/^\> (.*)$/gm, '<blockquote>$1</blockquote>');
        
        html = html.replace(/^\- (.*)$/gm, '<li>$1</li>');
        html = html.replace(/^\* (.*)$/gm, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
        
        html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1">');
        
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        if (html) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function unescapeHtml(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }
    
    function htmlToMarkdown(html) {
        if (!html) {
            return '';
        }
        
        let markdown = html;
        
        markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
        markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
        markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
        markdown = markdown.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '#### $1\n\n');
        
        markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
        markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
        markdown = markdown.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '__$1__');
        markdown = markdown.replace(/<del[^>]*>([\s\S]*?)<\/del>/gi, '~~$1~~');
        
        markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
        markdown = markdown.replace(/<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, '\n```\n$1\n```\n');
        
        markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n');
        
        markdown = markdown.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
        
        markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
        markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
        markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]( $1 )');
        
        markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
        markdown = markdown.replace(/<p[^>]*>/gi, '');
        markdown = markdown.replace(/<\/p>/gi, '\n\n');
        markdown = markdown.replace(/<div[^>]*>/gi, '');
        markdown = markdown.replace(/<\/div>/gi, '\n');
        
        markdown = markdown.replace(/<[^>]*>/g, '');
        
        markdown = markdown.replace(/\n{3,}/g, '\n\n');
        markdown = markdown.trim();
        
        return markdown;
    }
    
    function getPlainText(html) {
        if (!html) {
            return '';
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        let text = tempDiv.textContent || tempDiv.innerText || '';
        
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }
    
    function insertMarkdown(text, insertion, selectionStart, selectionEnd) {
        if (selectionStart === undefined) {
            return text + insertion;
        }
        
        const before = text.substring(0, selectionStart);
        const selected = text.substring(selectionStart, selectionEnd);
        const after = text.substring(selectionEnd);
        
        if (selected) {
            return before + insertion + selected + insertion + after;
        }
        
        return before + insertion + after;
    }
    
    function insertLink(text, url, selectionStart, selectionEnd) {
        if (selectionStart === undefined) {
            return text + `[链接](${url})`;
        }
        
        const before = text.substring(0, selectionStart);
        const selected = text.substring(selectionStart, selectionEnd);
        const after = text.substring(selectionEnd);
        
        const linkText = selected || '链接';
        return before + `[${linkText}](${url})` + after;
    }
    
    function insertImage(text, url, alt, selectionStart, selectionEnd) {
        if (selectionStart === undefined) {
            return text + `![${alt || '图片'}](${url})`;
        }
        
        const before = text.substring(0, selectionStart);
        const selected = text.substring(selectionStart, selectionEnd);
        const after = text.substring(selectionEnd);
        
        const imageAlt = selected || alt || '图片';
        return before + `![${imageAlt}](${url})` + after;
    }
    
    return {
        parse,
        simpleParse,
        escapeHtml,
        unescapeHtml,
        htmlToMarkdown,
        getPlainText,
        insertMarkdown,
        insertLink,
        insertImage
    };
})();
