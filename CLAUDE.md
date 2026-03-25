# Zenn Content Project

## Paperclip (ZennWriter Company)
- Paperclipダッシュボード: http://localhost:3100
- Company名: ZennWriter
- Company ID: 943181a2-e8bc-4962-a9fa-6bd0f2e90681

### エージェント構成
```
Editor (CEO): ワークフロー管理、最終レビュー
└── Writer: 記事執筆（日本語、Zenn形式）
    ├── Researcher: リサーチ・要点整理
    └── Coder: コード検証（記事ごとに /Users/koshun/projects/<slug>/ にリポジトリ作成）
```

### ワークフロー
1. GitHub Issue（またはPaperclip Issue）にトピックを追加
2. EditorがResearcher/Coderにサブタスク作成
3. Writerが記事執筆 → articles/<slug>.md に保存（published: false）
4. 人間がレビュー → published: true にしてpush

### Paperclip操作
- 起動: `cd /Users/koshun/infra/paperclip && ./refresh-token.sh && docker compose up -d`
- リビルド: `cd /Users/koshun/infra/paperclip && ./refresh-token.sh && docker compose up --build -d`
- OAuthトークン更新: launchdで4時間ごとに自動実行
- スキル: /budget, /role, /reorg（infra/paperclip/.claude/skills/）

### Agent Instruction Files
`.claude/agents/` にエージェントごとのinstruction fileを配置
- editor.md, researcher.md, coder.md, writer.md

## Zenn記事フォーマット
```yaml
---
title: "タイトル"
emoji: "🔥"
type: "tech"
topics: ["topic1", "topic2"]
published: false
---
```

## GitHub
- ユーザー名: koshun225
- リポジトリ: https://github.com/koshun225/zenn-content
