# Gululu Format Replacer

骨碌碌创作端带格式搜索替换工具。

这是一个用于骨碌碌创作端的 Tampermonkey / ScriptCat 用户脚本，为 Gululu 的 ProseMirror 编辑器增加带格式搜索替换功能。

## 功能

- 在骨碌碌创作端右侧添加一个 `🔎` 悬浮球
- 点击悬浮球打开搜索替换面板
- 左侧输入要搜索的文本
- 右侧粘贴替换内容，支持常见富文本格式
- 支持搜索结果计数
- 支持上一处 / 下一处跳转
- 支持单次替换
- 支持全部替换
- 搜索文本时忽略格式
- 对不同类型空格进行兼容处理
- 替换时尽量保留 Gululu 支持的格式

## 支持的格式

目前主要支持 Gululu 创作端 ProseMirror 编辑器中的以下格式：

- 文字颜色
- 加粗
- 斜体
- 下划线
- 删除线
- 正文
- 软换行

部分标题、复杂段落、多段富文本、外部网页复制的复杂样式可能无法完整保留，最终显示效果以 Gululu 编辑器实际支持为准。

## 安装

请先安装以下任意一个用户脚本管理器：

- [Tampermonkey](https://www.tampermonkey.net/)
- [ScriptCat](https://scriptcat.org/)

然后点击下面的安装链接：
[点击安装脚本](https://raw.githubusercontent.com/asasora/gululu-format-replacer/main/gululu-format-replacer.user.js)

## 使用方法

1. 打开骨碌碌创作端。
2. 点击页面右下角的 🔎 悬浮球。
3. 左侧输入要查找的内容
4. 将要替换的内容粘贴到右侧
5. 点击下一项，跳转到查找到的内容，并选择替换。


## 许可证

MIT License
