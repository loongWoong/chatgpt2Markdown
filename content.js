class MarkdownParser {
  constructor() {
    this.codeBlockCount = 0
  }

  parseElement(element) {
    if (!element) return ''

    const tagName = element.tagName?.toLowerCase()
    
    if (tagName === 'pre') {
      return this.parseCodeBlock(element)
    }
    
    if (tagName === 'code' && element.parentElement?.tagName?.toLowerCase() !== 'pre') {
      return `\`${this.escapeMarkdown(element.textContent)}\``
    }
    
    if (tagName === 'h1') return `# ${this.parseInline(element)}\n\n`
    if (tagName === 'h2') return `## ${this.parseInline(element)}\n\n`
    if (tagName === 'h3') return `### ${this.parseInline(element)}\n\n`
    if (tagName === 'h4') return `#### ${this.parseInline(element)}\n\n`
    if (tagName === 'h5') return `##### ${this.parseInline(element)}\n\n`
    if (tagName === 'h6') return `###### ${this.parseInline(element)}\n\n`
    
    if (tagName === 'strong' || tagName === 'b') {
      return `**${this.parseInline(element)}**`
    }
    
    if (tagName === 'em' || tagName === 'i') {
      return `*${this.parseInline(element)}*`
    }
    
    if (tagName === 'a') {
      const href = element.getAttribute('href') || ''
      const text = this.parseInline(element)
      return `[${text}](${href})`
    }
    
    if (tagName === 'ul') {
      return this.parseList(element, 'ul')
    }
    
    if (tagName === 'ol') {
      return this.parseList(element, 'ol')
    }
    
    if (tagName === 'blockquote') {
      const content = this.parseInline(element).trim()
      return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n'
    }
    
    if (tagName === 'hr') {
      return '---\n\n'
    }
    
    if (tagName === 'br') {
      return '\n'
    }
    
    if (tagName === 'p') {
      const content = this.parseInline(element).trim()
      return content ? content + '\n\n' : ''
    }
    
    if (tagName === 'div' || tagName === 'span' || tagName === 'section' || tagName === 'article') {
      return this.parseChildren(element)
    }
    
    return this.parseChildren(element)
  }

  parseChildren(element) {
    let result = ''
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += this.escapeMarkdown(child.textContent)
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        result += this.parseElement(child)
      }
    }
    return result
  }

  parseInline(element) {
    let result = ''
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += this.escapeMarkdown(child.textContent)
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tagName = child.tagName?.toLowerCase()
        
        if (tagName === 'code' && child.parentElement?.tagName?.toLowerCase() !== 'pre') {
          result += `\`${this.escapeMarkdown(child.textContent)}\``
        } else if (tagName === 'strong' || tagName === 'b') {
          result += `**${this.parseInline(child)}**`
        } else if (tagName === 'em' || tagName === 'i') {
          result += `*${this.parseInline(child)}*`
        } else if (tagName === 'a') {
          const href = child.getAttribute('href') || ''
          const text = this.parseInline(child)
          result += `[${text}](${href})`
        } else if (tagName === 'br') {
          result += '\n'
        } else if (tagName === 'span' || tagName === 'div') {
          result += this.parseInline(child)
        } else {
          result += this.parseInline(child)
        }
      }
    }
    return result
  }

  parseCodeBlock(preElement) {
    this.codeBlockCount++
    const codeElement = preElement.querySelector('code')
    const code = codeElement ? codeElement.textContent : preElement.textContent
    
    let language = ''
    if (codeElement) {
      const className = codeElement.className || ''
      const langMatch = className.match(/language-(\w+)/)
      if (langMatch) {
        language = langMatch[1]
      }
    }
    
    const lines = code.split('\n')
    const dedentedLines = this.dedentLines(lines)
    const dedentedCode = dedentedLines.join('\n')
    
    return `\`\`\`${language}\n${dedentedCode}\n\`\`\`\n\n`
  }

  dedentLines(lines) {
    if (lines.length === 0) return []
    
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)
    if (nonEmptyLines.length === 0) return lines
    
    const minIndent = Math.min(...nonEmptyLines.map(line => {
      const match = line.match(/^(\s*)/)
      return match ? match[1].length : 0
    }))
    
    return lines.map(line => {
      if (line.trim().length === 0) return line
      return line.substring(minIndent)
    })
  }

  parseList(listElement, listType) {
    let result = ''
    let index = 1
    
    for (const item of listElement.children) {
      if (item.tagName?.toLowerCase() !== 'li') continue
      
      const content = this.parseInline(item).trim()
      if (!content) continue
      
      if (listType === 'ul') {
        result += `- ${content}\n`
      } else {
        result += `${index}. ${content}\n`
        index++
      }
    }
    
    return result + '\n'
  }

  escapeMarkdown(text) {
    if (!text) return ''
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!')
  }
}

class ChatGPTExtractor {
  constructor() {
    this.parser = new MarkdownParser()
  }

  async extractConversation() {
    try {
      const messages = this.getDataFromDOM()
      
      if (!messages || messages.length === 0) {
        return { success: false, error: '未找到对话内容' }
      }

      return { success: true, data: messages }
    } catch (error) {
      console.error('Error extracting conversation:', error)
      return { success: false, error: error.message }
    }
  }

  getDataFromDOM() {
    const messages = []
    const messageElements = this.getMessageElements()

    messageElements.forEach(el => {
      const message = this.parseMessageElement(el)
      if (message) messages.push(message)
    })

    if (messages.length === 0) {
      const textContent = document.body.innerText
      if (textContent.trim()) {
        return this.parseFromTextContent(textContent)
      }
    }

    return messages
  }

  getMessageElements() {
    const messageElements = Array.from(document.querySelectorAll('[data-testid*="conversation-turn"]'))
    if (messageElements.length > 0) {
      return messageElements
    }

    const alternativeSelectors = [
      '.group\\/conversation-turn',
      '[class*="conversation-turn"]',
      '[class*="message"]',
      '[data-message-author-role]'
    ]

    for (const selector of alternativeSelectors) {
      const elements = Array.from(document.querySelectorAll(selector))
      if (elements.length > 0) {
        return elements
      }
    }

    return []
  }

  getRoleFromElement(element) {
    const roleElement = element.querySelector('[data-message-author-role]')
    const roleFromAttr = roleElement
      ? roleElement.getAttribute('data-message-author-role')
      : element.getAttribute('data-message-author-role')

    if (roleFromAttr) {
      return roleFromAttr
    }

    const avatarElement = element.querySelector('[data-testid*="user-avatar"], [data-testid*="assistant-avatar"]')
    if (avatarElement) {
      const roleText = avatarElement.getAttribute('data-testid') || ''
      if (roleText.includes('user')) {
        return 'user'
      }
      if (roleText.includes('assistant')) {
        return 'assistant'
      }
    }

    return 'unknown'
  }

  parseMessageElement(element) {
    try {
      const role = this.getRoleFromElement(element)
      let content = ''

      const contentSelectors = [
        '[data-message-author-role] ~ div',
        '.markdown',
        '.prose',
        '[class*="message-content"]',
        '[class*="text-message"]'
      ]

      for (const selector of contentSelectors) {
        const contentElement = element.querySelector(selector)
        if (contentElement) {
          content = this.parser.parseElement(contentElement).trim()
          if (content) break
        }
      }

      if (!content) {
        content = this.parser.parseElement(element).trim()
      }

      if (!content) {
        return null
      }

      return {
        role: role,
        content: content
      }
    } catch (error) {
      console.error('Error parsing message element:', error)
      return null
    }
  }

  parseFromTextContent(text) {
    const lines = text.split('\n').filter(line => line.trim())
    const messages = []
    
    let currentRole = null
    let currentContent = []

    lines.forEach(line => {
      if (line.toLowerCase().includes('you') || line.toLowerCase().includes('user')) {
        if (currentRole && currentContent.length > 0) {
          messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim()
          })
        }
        currentRole = 'user'
        currentContent = []
      } else if (line.toLowerCase().includes('chatgpt') || line.toLowerCase().includes('assistant')) {
        if (currentRole && currentContent.length > 0) {
          messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim()
          })
        }
        currentRole = 'assistant'
        currentContent = []
      } else {
        currentContent.push(line)
      }
    })

    if (currentRole && currentContent.length > 0) {
      messages.push({
        role: currentRole,
        content: currentContent.join('\n').trim()
      })
    }

    return messages
  }
}

class MarkdownConverter {
  constructor() {
    this.extractor = new ChatGPTExtractor()
  }

  async convertToMarkdown(selectedIndices = null) {
    const result = await this.extractor.extractConversation()
    
    if (!result.success) {
      return { success: false, error: result.error }
    }

    let messages = result.data
    
    if (selectedIndices && selectedIndices.length > 0) {
      messages = messages.filter((_, index) => selectedIndices.includes(index))
    }

    let markdown = ''
    let title = this.extractTitle()

    if (title) {
      markdown += `# ${title}\n\n`
    }

    markdown += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`
    markdown += '---\n\n'

    messages.forEach((message, index) => {
      const roleLabel = message.role === 'user' ? '👤 用户' : '🤖 ChatGPT'
      markdown += `**${roleLabel}:**\n\n`
      markdown += `${message.content}\n\n`
      
      if (index < messages.length - 1) {
        markdown += '---\n\n'
      }
    })

    return { success: true, markdown: markdown, title: title, messages: messages }
  }

  getMessageList() {
    const messageElements = this.extractor.getMessageElements()
    const messages = []
    
    messageElements.forEach((el, index) => {
      const role = this.extractor.getRoleFromElement(el)
      const content = this.extractor.parseMessageElement(el)
      
      if (content) {
        messages.push({
          index: index,
          role: role,
          preview: content.content.substring(0, 100).replace(/\n/g, ' ')
        })
      }
    })
    
    return { success: true, messages: messages }
  }

  extractTitle() {
    const titleElement = document.querySelector('h1, [class*="title"]')
    if (titleElement) {
      return titleElement.textContent.trim()
    }
    
    const url = window.location.href
    const match = url.match(/\/c\/([a-zA-Z0-9-]+)/)
    if (match) {
      return `ChatGPT 对话 - ${match[1].substring(0, 8)}`
    }
    
    return 'ChatGPT 对话'
  }
}

const markdownConverter = new MarkdownConverter()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertToMarkdown') {
    markdownConverter.convertToMarkdown(request.selectedIndices)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }))
  } else if (request.action === 'getMessageList') {
    const result = markdownConverter.getMessageList()
    sendResponse(result)
  }
  return true
})
