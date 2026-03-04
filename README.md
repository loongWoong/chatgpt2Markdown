# ChatGPT to Markdown 浏览器插件

一个简单易用的浏览器插件，可以将 ChatGPT 对话内容导出为标准的 Markdown 格式文件。

## 功能特性

- 📝 一键导出 ChatGPT 对话为 Markdown 格式
- 📋 支持复制到剪贴板
- 🎨 美观的用户界面
- ⚡ 快速响应，无需等待
- 🔒 完全本地运行，保护隐私
- 🌐 支持 chatgpt.com 和 chat.openai.com

## 安装方法

### Chrome/Edge 浏览器

1. 下载或克隆此项目到本地
2. 打开浏览器，访问 `chrome://extensions/` (Chrome) 或 `edge://extensions/` (Edge)
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此项目的文件夹
6. 插件安装完成！

### Firefox 浏览器

1. 下载或克隆此项目到本地
2. 打开浏览器，访问 `about:debugging#/runtime/this-firefox`
3. 点击"临时载入附加组件"
4. 选择此项目中的 manifest.json 文件
5. 插件安装完成！

## 使用方法

1. 打开 [ChatGPT](https://chatgpt.com/) 网站
2. 进行你想要的对话
3. 点击浏览器工具栏中的插件图标
4. 选择"导出为 Markdown"或"复制到剪贴板"
5. 完成！

## 导出的 Markdown 格式

导出的文件包含以下内容：

- 对话标题（自动提取或生成）
- 导出时间戳
- 完整的对话历史，按用户和 ChatGPT 分组
- 清晰的分隔线

示例格式：

```markdown
# ChatGPT 对话

> 导出时间: 2026/3/3 14:30:00

---

**👤 用户:**

你好，请帮我写一个 Python 函数。

---

**🤖 ChatGPT:**

当然！这是一个简单的 Python 函数示例：

```python
def hello_world():
    print("Hello, World!")
    return True
```

这个函数会打印 "Hello, World!" 并返回 True。
```

## 项目结构

```
chatgpt2md/
├── manifest.json       # 插件配置文件
├── content.js          # 内容提取和转换逻辑
├── popup.html          # 弹出窗口界面
├── popup.js            # 弹出窗口逻辑
├── icon16.png          # 16x16 图标
├── icon48.png          # 48x48 图标
└── icon128.png         # 128x128 图标
```

## 技术栈

- Manifest V3
- Vanilla JavaScript
- Chrome Extension API

## 注意事项

- 插件仅在 ChatGPT 网站上可用
- 需要页面完全加载后才能正常工作
- 导出的文件会自动保存到默认下载目录

## 开发计划

- [x] 支持自定义文件名模板
- [ ] 添加批量导出功能
- [ ] 添加导出历史记录
- [ ] 支持导出特定对话片段

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。