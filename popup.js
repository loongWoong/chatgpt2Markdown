class PopupController {
  constructor() {
    this.exportBtn = document.getElementById('exportBtn')
    this.copyBtn = document.getElementById('copyBtn')
    this.selectiveExportBtn = document.getElementById('selectiveExportBtn')
    this.status = document.getElementById('status')
    this.exportBtnText = document.getElementById('exportBtnText')
    this.copyBtnText = document.getElementById('copyBtnText')
    this.selectiveExportBtnText = document.getElementById('selectiveExportBtnText')
    this.filenameTemplateInput = document.getElementById('filenameTemplate')
    this.historyList = document.getElementById('historyList')
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn')
    
    this.currentMarkdown = ''
    this.exportHistory = []
    this.selectedMessages = []
    this.init()
  }

  init() {
    this.setupTabs()
    this.setupEventListeners()
    this.loadSettings()
    this.loadExportHistory()
    this.checkCurrentTab()
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tab')
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab)
      })
    })
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName)
    })
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`)
    })
    
    if (tabName === 'history') {
      this.loadExportHistory()
    }
  }

  setupEventListeners() {
    this.exportBtn.addEventListener('click', () => this.handleExport())
    this.copyBtn.addEventListener('click', () => this.handleCopy())
    this.selectiveExportBtn.addEventListener('click', () => this.handleSelectiveExport())
    this.clearHistoryBtn.addEventListener('click', () => this.clearExportHistory())
    
    this.filenameTemplateInput.addEventListener('change', () => {
      const template = this.filenameTemplateInput.value.trim()
      if (template && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ filenameTemplate: template })
      }
    })
  }

  loadSettings() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['filenameTemplate'], (result) => {
        if (result.filenameTemplate) {
          this.filenameTemplateInput.value = result.filenameTemplate
        }
      })
    }
  }

  checkCurrentTab() {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          this.checkTabSupport(tabs[0])
        }
      })
    }
  }

  checkTabSupport(tab) {
    const supportedUrls = [
      'https://chatgpt.com/',
      'https://chat.openai.com/'
    ]
    
    const isSupported = supportedUrls.some(url => tab.url.startsWith(url))
    
    if (!isSupported) {
      this.showStatus('请在 ChatGPT 页面使用此插件', 'error')
      this.setButtonsDisabled(true)
    }
  }

  setButtonsDisabled(disabled) {
    this.exportBtn.disabled = disabled
    this.copyBtn.disabled = disabled
    this.selectiveExportBtn.disabled = disabled
  }

  showStatus(message, type = 'info') {
    this.status.className = `status ${type}`
    this.status.textContent = message
    this.status.style.display = 'block'
    
    if (type === 'success') {
      setTimeout(() => {
        this.status.style.display = 'none'
      }, 3000)
    }
  }

  setLoading(loading, button = null) {
    if (loading) {
      this.setButtonsDisabled(true)
      if (button) {
        const textSpan = button.querySelector('span:last-child')
        textSpan.innerHTML = '<span class="loading"></span> 处理中...'
      }
    } else {
      this.setButtonsDisabled(false)
      this.exportBtnText.textContent = '导出为 Markdown'
      this.copyBtnText.textContent = '复制到剪贴板'
      this.selectiveExportBtnText.textContent = '选择导出片段'
    }
  }

  async handleExport() {
    this.setLoading(true, this.exportBtn)
    this.status.style.display = 'none'

    try {
      if (!chrome.tabs || !chrome.tabs.query) {
        throw new Error('Chrome API 不可用')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab) {
        throw new Error('无法获取当前标签页')
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'convertToMarkdown' })
      
      if (!response.success) {
        throw new Error(response.error || '转换失败')
      }

      this.currentMarkdown = response.markdown
      await this.downloadFile(this.currentMarkdown, response.title, 'md', 'text/markdown;charset=utf-8')
      this.addToExportHistory(response.title, response.markdown)
      this.showStatus('✅ 导出成功！', 'success')
      
    } catch (error) {
      console.error('Export error:', error)
      this.showStatus(`❌ ${error.message}`, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async handleCopy() {
    this.setLoading(true, this.copyBtn)
    this.status.style.display = 'none'

    try {
      if (!chrome.tabs || !chrome.tabs.query) {
        throw new Error('Chrome API 不可用')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab) {
               throw new Error('无法获取当前标签页')
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'convertToMarkdown' })
      
      if (!response.success) {
        throw new Error(response.error || '转换失败')
      }

      await this.copyToClipboard(response.markdown)
      this.addToExportHistory(response.title, response.markdown)
      this.showStatus('✅ 已复制 Markdown 到剪贴板！', 'success')
      
    } catch (error) {
      console.error('Copy error:', error)
      this.showStatus(`❌ ${error.message}`, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async handleSelectiveExport() {
    this.setLoading(true, this.selectiveExportBtn)
    this.status.style.display = 'none'

    try {
      if (!chrome.tabs || !chrome.tabs.query) {
        throw new Error('Chrome API 不可用')
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab) {
        throw new Error('无法获取当前标签页')
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getMessageList' })
      
      if (!response.success) {
        throw new Error(response.error || '获取消息列表失败')
      }

      this.showMessageSelector(response.messages)
      
    } catch (error) {
      console.error('Selective export error:', error)
      this.showStatus(`❌ ${error.message}`, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  showMessageSelector(messages) {
    const selector = document.createElement('div')
    selector.className = 'message-selector'
    
    const selectAll = document.createElement('div')
    selectAll.className = 'select-all'
    
    const selectAllCheckbox = document.createElement('input')
    selectAllCheckbox.type = 'checkbox'
    selectAllCheckbox.className = 'message-checkbox'
    selectAllCheckbox.addEventListener('change', (e) => {
      const checkboxes = selector.querySelectorAll('.message-checkbox:not(:first-child)')
      checkboxes.forEach(cb => cb.checked = e.target.checked)
    })
    
    const selectAllLabel = document.createElement('span')
    selectAllLabel.textContent = '全选'
    
    selectAll.appendChild(selectAllCheckbox)
    selectAll.appendChild(selectAllLabel)
    selector.appendChild(selectAll)
    
    messages.forEach(msg => {
      const item = document.createElement('div')
      item.className = 'message-item'
      
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'message-checkbox'
      checkbox.dataset.index = msg.index
      checkbox.checked = true
      
      const info = document.createElement('div')
      info.className = 'message-info'
      
      const role = document.createElement('div')
      role.className = 'message-role'
      role.textContent = msg.role === 'user' ? '👤 用户' : '🤖 ChatGPT'
      
      const preview = document.createElement('div')
      preview.className = 'message-preview'
      preview.textContent = msg.preview
      
      info.appendChild(role)
      info.appendChild(preview)
      
      item.appendChild(checkbox)
      item.appendChild(info)
      selector.appendChild(item)
    })
    
    const buttonGroup = document.createElement('div')
    buttonGroup.className = 'button-group'
    buttonGroup.style.marginTop = '10px'
    
    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'btn btn-primary'
    confirmBtn.innerHTML = '<span class="icon">✅</span><span>确认导出</span>'
    confirmBtn.addEventListener('click', () => {
      const selectedIndices = []
      selector.querySelectorAll('.message-checkbox:not(:first-child)').forEach(cb => {
        if (cb.checked) {
          selectedIndices.push(parseInt(cb.dataset.index))
        }
      })
      
      if (selectedIndices.length === 0) {
        this.showStatus('请至少选择一条消息', 'error')
        return
      }
      
      this.exportSelectedMessages(selectedIndices)
      selector.remove()
    })
    
    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn-secondary'
    cancelBtn.innerHTML = '<span class="icon">❌</span><span>取消</span>'
    cancelBtn.addEventListener('click', () => {
      selector.remove()
    })
    
    buttonGroup.appendChild(confirmBtn)
    buttonGroup.appendChild(cancelBtn)
    
    const exportTab = document.getElementById('exportTab')
    exportTab.appendChild(selector)
    exportTab.appendChild(buttonGroup)
  }

  async exportSelectedMessages(selectedIndices) {
    this.setLoading(true)
    this.status.style.display = 'none'

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab) {
        throw new Error('无法获取当前标签页')
      }

      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'convertToMarkdown',
        selectedIndices: selectedIndices
      })
      
      if (!response.success) {
        throw new Error(response.error || '转换失败')
      }

      this.currentMarkdown = response.markdown
      await this.downloadFile(this.currentMarkdown, response.title, 'md', 'text/markdown;charset=utf-8')
      this.addToExportHistory(response.title, response.markdown)
      this.showStatus('✅ 导出成功！', 'success')
      
    } catch (error) {
      console.error('Export selected error:', error)
      this.showStatus(`❌ ${error.message}`, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async downloadFile(content, title, extension, mimeType) {
    const filename = await this.generateFilename(title, extension)
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    if (chrome.downloads) {
      try {
        const downloadId = await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        })
        
        console.log('Download started, ID:', downloadId)
        
        await new Promise((resolve, reject) => {
          const onChanged = (delta) => {
            if (delta.id === downloadId) {
              console.log('Download state changed:', delta.state?.current)
              
              if (delta.state && delta.state.current === 'complete') {
                chrome.downloads.onChanged.removeListener(onChanged)
                console.log('Download completed successfully')
                resolve()
              } else if (delta.state && delta.state.current === 'interrupted') {
                chrome.downloads.onChanged.removeListener(onChanged)
                console.error('Download interrupted:', delta.error)
                reject(new Error(delta.error || '下载被中断'))
              } else if (delta.state && delta.state.current === 'canceled') {
                chrome.downloads.onChanged.removeListener(onChanged)
                console.error('Download canceled')
                reject(new Error('下载被取消'))
              }
            }
          }
          
          chrome.downloads.onChanged.addListener(onChanged)
          
          setTimeout(() => {
            chrome.downloads.onChanged.removeListener(onChanged)
            console.warn('Download timeout, assuming success')
            resolve()
          }, 10000)
        })
      } catch (error) {
        console.error('Download error:', error)
        throw error
      } finally {
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 2000)
      }
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      throw new Error('复制失败，请手动复制')
    }
  }

  async generateFilename(title, extension = 'md') {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    const getTemplate = () => new Promise(resolve => {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['filenameTemplate'], (result) => {
          resolve(result.filenameTemplate || 'chatgpt-{date}-{time}')
        })
      } else {
        resolve('chatgpt-{date}-{time}')
      }
    })

    const template = await getTemplate()

    const safeTitle = (title || 'conversation').replace(/[\\/:*?"<>|]/g, '_').trim()
    
    let filename = template
      .replace('{title}', safeTitle)
      .replace('{date}', `${year}${month}${day}`)
      .replace('{time}', `${hours}${minutes}${seconds}`)
      .replace('{year}', year)
      .replace('{month}', month)
      .replace('{day}', day)
      .replace('{hours}', hours)
      .replace('{minutes}', minutes)
      .replace('{seconds}', seconds)

    if (!filename.toLowerCase().endsWith(`.${extension}`)) {
      filename += `.${extension}`
    }
    
    return filename
  }

  addToExportHistory(title, markdown) {
    const historyItem = {
      id: Date.now(),
      title: title,
      markdown: markdown,
      timestamp: new Date().toISOString()
    }
    
    this.exportHistory.unshift(historyItem)
    
    if (this.exportHistory.length > 50) {
      this.exportHistory = this.exportHistory.slice(0, 50)
    }
    
    this.saveExportHistory()
  }

  loadExportHistory() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['exportHistory'], (result) => {
        this.exportHistory = result.exportHistory || []
        this.renderExportHistory()
      })
    }
  }

  saveExportHistory() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ exportHistory: this.exportHistory })
    }
  }

  renderExportHistory() {
    this.historyList.innerHTML = ''
    
    if (this.exportHistory.length === 0) {
      this.historyList.innerHTML = '<div class="history-empty">暂无导出历史</div>'
      return
    }
    
    this.exportHistory.forEach(item => {
      const historyItem = document.createElement('div')
      historyItem.className = 'historyItem'
      
      const title = document.createElement('div')
      title.className = 'history-title'
      title.textContent = item.title
      
      const time = document.createElement('div')
      time.className = 'history-time'
      time.textContent = new Date(item.timestamp).toLocaleString('zh-CN')
      
      historyItem.appendChild(title)
      historyItem.appendChild(time)
      
      historyItem.addEventListener('click', () => {
        this.exportFromHistory(item)
      })
      
      this.historyList.appendChild(historyItem)
    })
  }

  async exportFromHistory(item) {
    this.setLoading(true)
    this.status.style.display = 'none'

    try {
      await this.downloadFile(item.markdown, item.title, 'md', 'text/markdown;charset=utf-8')
      this.showStatus('✅ 导出成功！', 'success')
    } catch (error) {
      console.error('Export from history error:', error)
      this.showStatus(`❌ ${error.message}`, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  clearExportHistory() {
    if (confirm('确定要清空所有导出历史吗？')) {
      this.exportHistory = []
      this.saveExportHistory()
      this.renderExportHistory()
      this.showStatus('✅ 历史记录已清空', 'success')
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController()
})
