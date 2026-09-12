# 消防作战信息卡制作工具

标准化数字作战卡系统：支持村落与单体建筑模板、地图战术标绘、双页 A4 横版制式输出、多格式导出。纯静态前端，无需后端。

## 在线访问

GitHub Pages 部署：`https://admi333.github.io/fire-battle-card/`

## 功能特性

- **第 1 页**：基本信息表单 + 战备水源图（消火栓、消防通道、水池码头、重点部位等）
- **第 2 页**：独立全幅总平面图，规范 A4 横向排版
- **多格式导出**：双页 A4 PDF（297mm × 210mm）、高清 PNG、双页 Word (.docx)
- **工程管理**：导出/导入 JSON 备份工程，随时归档交接

## 技术栈

纯前端：Tailwind CSS (CDN)、FontAwesome 6 (CDN)、Leaflet 1.9.4、Fabric.js、html2canvas、jsPDF、docx.js

## 文件结构

```
index.html          - 首页与编辑器（模板选择、历史工程、地图标绘、导出）
assets/style.css    - 页面样式
assets/app.js       - 应用逻辑
```

## 本地运行

直接双击 `index.html`，或在目录下启动任意静态服务器：

```bash
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 部署

本仓库通过 GitHub Actions 自动部署到 Pages，推送 `main` 分支即触发。
