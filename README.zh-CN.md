# OpenC5 — N 度关系图生成器

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Demo: GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-informational)

一个单文件、零依赖的 Web 应用，把经典的「五度圈」泛化为可配置的 N 度环形关系图生成器。

## 简介

OpenC5 把五度圈的概念泛化为可配置的环形关系图。它不再局限于单一的音乐理论布局，而是允许你构建 1–99 个同心圆环、为每个环选择分段类型，并独立旋转每一个环。它适用于音乐理论、传统文化、天文学，以及其它循环或关系型可视化场景。

## 功能特性

- 多圈层：1–99 个同心圆环，各自独立配置。
- 11 种预设分段类型：手工输入、天干、地支、二十四节气、先天八卦、后天八卦、子午流注（经络时辰）、音乐大调（五度圈）、音乐小调、十二星座、十二生肖。
- 每个圈层两种显示模式：纯色或多色分段。
- 交互式旋转：点击拖拽圈层旋转，或使用角度滑块 / 数值输入。
- 实时 SVG 预览。
- 图例：显示开关，位置可选（右侧 / 右下）。
- 配置管理：导出 / 导入 JSON 配置。
- 导出：复制 SVG 源码到剪贴板，或下载 SVG 文件（仅 SVG，无 PNG）。
- 国际化：中 / 英双语切换。
- 主题：浅色 / 暗色 / 跟随系统。
- 响应式布局，支持移动端触摸。
- 设置持久化到 `localStorage`。

## 在线演示

https://fengdonglu.github.io/OpenC5/

## 快速开始

直接在浏览器中打开：

```text
用任意现代浏览器打开 index.html。
```

或用本地 HTTP 服务器托管（推荐，可让剪贴板与 `localStorage` 行为更一致）：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## 使用说明

### 基本参数

设置圈层数量（1–99），选择显示模式（纯色或多色分段），并调整整体角度。每个圈层独立配置。

### 圈层配置

为每个环选择预设分段类型、编辑分段标签、选择颜色，并设置旋转角度。

### 预设

使用 11 种内置预设分段类型之一（见下表），或输入完全自定义的分段列表。

### 旋转

在预览区点击拖拽圈层进行旋转，或使用角度滑块 / 数值输入。

### 导出

将生成的 SVG 源码复制到剪贴板，或下载为 `.svg` 文件。真实导出样张见 `examples/sample-export-zodiac.svg`。

### 配置导入 / 导出

把完整配置保存为 JSON，之后可导入以还原图表。

### 移动端

布局响应式，支持触摸交互。

## 预设分段类型

| 编号 | 预设分段类型 |
| --- | --- |
| 1 | 手工输入 |
| 2 | 天干 |
| 3 | 地支 |
| 4 | 二十四节气 |
| 5 | 先天八卦 |
| 6 | 后天八卦 |
| 7 | 子午流注 / 经络时辰 |
| 8 | 音乐大调（五度圈） |
| 9 | 音乐小调 |
| 10 | 十二星座 |
| 11 | 十二生肖 |

## 架构

OpenC5 是单文件应用。全部 HTML、CSS 与 JavaScript 都位于 `index.html`。它零依赖、无构建步骤。JavaScript 采用原生 JavaScript 的普通对象模块（object-literal modules）编写——没有框架（无 Vue）、没有类继承、没有打包器。图形直接渲染为 SVG，设置持久化到 `localStorage`。

## 浏览器兼容

OpenC5 面向现代常青浏览器（较新的 Chrome、Edge、Firefox、Safari）。它依赖标准 SVG 渲染、`localStorage`、Clipboard API，以及用于「跟随系统」主题的 `prefers-color-scheme`。在不支持这些特性的旧浏览器中，具体表现可能存在差异。

## RoadMap

以下内容均为 **Planned / Not yet implemented**：

- 音乐五度圈专用模式：起始调 / 方向 / 起始角度、调号数量、等音异名（F♯/G♭）、音名体系（英美 / 德式 H-B / 中文）、相对大小调连线、ii–V–I 进行路径、四度循环箭头（Planned / Not yet implemented）。
- 通用 N 节点环形模式：可配置步长 k、节点分组配色、有向 / 无向 / 加权连边（Planned / Not yet implemented）。
- PNG / PDF 导出（离屏 Canvas 渲染）（Planned / Not yet implemented）。
- 预设管理界面：重命名 / 删除 / 导入导出（Planned / Not yet implemented）。
- 无障碍完善：完整 ARIA、键盘导航、屏幕阅读器描述（Planned / Not yet implemented）。
- 单元测试 / 视觉回归 / 端到端测试（Planned / Not yet implemented）。
- 插件系统、PWA 离线、更多预设（行星、元素等）（Planned / Not yet implemented）。

## 许可证

MIT © 2025 fengdonglu。详见 [LICENSE](LICENSE)。

## Vibe Coding 说明

> 本项目基于 Vibe Coding 构建：作者未手工输入任何代码，全部代码均由自然语言驱动的智能体生成。

## 仓库

返回仓库：https://github.com/fengdonglu/OpenC5
