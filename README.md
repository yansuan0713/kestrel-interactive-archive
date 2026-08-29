# Kestrel Interactive Archive

一个伪装成失落独立游戏门户的浏览器元游戏选集。八款游戏都可以独立游玩，但会通过本地共享存档、URL、页面标题、焦点状态与隐藏文件逐步拼出同一个谜团。

界面支持 English / 简体中文。首次访问会跟随浏览器语言，也可以随时切换；选择会保存在本地。

> 建议不要先读剧透文件。直接从门户开始，按自己的顺序游玩。

## 八款游戏

- CLICK
- 404
- TERMS & CONDITIONS
- HUMAN TEST
- WINDOW
- DON'T LOOK AWAY
- THE QUIZ
- PATCH NOTES

项目包含共享状态机、成就、伪造评论与开发者资料、隐藏路径、可下载的叙事文件、跨游戏事件、三个可收集结局，以及最终隐藏的 ADMIN 体验。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

质量检查：

```bash
npm run lint
npm test
npm run build
```

## 隐私边界

游戏状态只保存在当前浏览器的 `localStorage`。项目不会访问摄像头、麦克风、浏览历史、联系人、账户信息或其他敏感数据。需要注意力与页面焦点的玩法只使用游戏区域内的指针位置，以及标准的页面可见性 / 焦点事件。

ADMIN 路由、成就、解锁条件与结局都是由客户端本地状态驱动的单机叙事机制，不是权限系统或安全边界；玩家可以使用浏览器开发者工具修改这些状态。

## 剧透与设定

完整英文设定、时间线与线索账本位于 [SPOILERS.md](./SPOILERS.md)。简体中文版位于 [SPOILERS.zh-CN.md](./SPOILERS.zh-CN.md)。

---

An experimental browser-game anthology disguised as a forgotten indie portal. Eight standalone games share a local state machine and gradually alter the archive around them. English and Simplified Chinese are fully supported.
