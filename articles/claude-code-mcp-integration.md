---
title: "Claude CodeをMCPで拡張する実践ガイド"
emoji: "🔌"
type: "tech"
topics: ["claudecode", "mcp", "ai", "claude"]
published: false
---

Claude Codeは強力なAIコーディングアシスタントですが、デフォルトではローカルファイルシステムとシェルの操作に限定されています。「GitHubのPRをレビューして」「Sentryのエラーを調べて」といった操作は、そのままではできません。

そこで登場するのが **MCP（Model Context Protocol）** です。MCPを使えば、Claude Codeの能力を外部サービスへと大きく拡張できます。この記事では、MCPの概念から実際の設定、自作サーバーの作り方まで解説します。

## MCPとは何か

**Model Context Protocol** は、AnthropicがオープンソースとしてリリースしたAIツール統合の標準規格です。

USBを思い浮かべてください。USB以前は、デバイスごとに異なる接続方法が必要でした。USBという標準規格が登場したことで、どんなデバイスでも同じポートに差し込むだけで使えるようになりました。

MCPはまさにこれと同じ発想です。AIアシスタントと外部ツールを接続する「標準ポート」を定義することで、どんなサービスでもMCPサーバーを作れば、Claude Codeから使えるようになります。

## なぜClaude Codeで重要か

MCPを使うと、こんなことができるようになります。

```
「JIRAのissue ENG-4521を実装して、GitHubにPRを作成して」
「Sentryのエラーとこのコードの関係を調べて」
「PostgreSQLから先月のアクティブユーザー数を調べて」
```

これらはすべて、複数のシステムをまたぐ操作です。MCPなしでは、Claude Codeはコードを書くことしかできませんでした。MCPサーバーを接続することで、外部サービスとのシームレスなやり取りが可能になります。

また、MCPサーバーは**チャネル**としても機能します。Telegramのメッセージ、CIの実行結果などをリアルタイムでセッションに流し込むことも可能です。

## MCPサーバーの設定方法

### 4つのスコープ

MCPサーバーには4つのスコープ（適用範囲）があります。

| スコープ | 保存場所 | チーム共有 | 主な用途 |
|--------|---------|----------|--------|
| **Managed** | システムディレクトリ | Yes（IT管理） | 組織ポリシーの強制 |
| **Local** | `~/.claude.json` | No | 個人・実験的な用途 |
| **Project** | `.mcp.json`（プロジェクトルート） | Yes（git管理） | チーム全員で使うサーバー |
| **User** | `~/.claude.json` | No | すべてのプロジェクトで使う個人ツール |

:::message
**スコープ名の変更に注意**

古いドキュメントでは名称が異なります。混乱しやすいので注意してください。
- 旧「project」スコープ → 新「**local**」スコープ
- 旧「global」スコープ → 新「**user**」スコープ
:::

### CLIでの追加コマンド

```bash
# localスコープ（デフォルト）— 自分だけが使う、このプロジェクト専用
claude mcp add --transport http stripe https://mcp.stripe.com

# projectスコープ — チームで共有（.mcp.json に保存される）
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp

# userスコープ — すべてのプロジェクトで使う個人ツール
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### 管理コマンド

```bash
claude mcp list                    # 設定済みサーバー一覧
claude mcp get github              # 特定サーバーの詳細確認
claude mcp remove github           # サーバーの削除
claude mcp reset-project-choices   # .mcp.json の承認をリセット
```

## 実用的なMCPサーバーの例

よく使われるMCPサーバーをスコープ別に紹介します。

### HTTP型（クラウドサービス）

```bash
# GitHub — PR管理、コードレビュー
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# Sentry — エラー監視
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Notion — ドキュメント管理
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

### stdio型（ローカルツール）

```bash
# PostgreSQL — データベースアクセス（読み取り専用推奨）
claude mcp add --transport stdio db -- \
  npx -y @bytebase/dbhub --dsn "postgresql://readonly:pass@localhost:5432/mydb"

# 環境変数が必要なサービス（Airtableなど）
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY \
  airtable -- npx -y airtable-mcp-server
```

### Claude Desktopの設定をインポート

すでにClaude Desktopを使っている場合、設定をそのままインポートできます（macOS・WSLのみ）。

```bash
claude mcp add-from-claude-desktop
```

## 自作MCPサーバーを作ってみる

既存のサービスだけでなく、自分でMCPサーバーを作ることもできます。ここでは、TypeScriptで実装したシンプルなサンプルを見ていきましょう。

このサンプルは [`examples/mcp-server-sample/`](https://github.com/koshun225/zenn-content/tree/main/examples/mcp-server-sample) で公開しています。

### 必要なパッケージ

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.8.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0"
  }
}
```

### サーバーの実装（`src/index.ts`）

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// MCPサーバーのインスタンスを作成
const server = new Server(
  { name: "sample-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ツール一覧を返すハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_current_time",
        description: "現在の日時をISO 8601形式で返します",
        inputSchema: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              description: "タイムゾーン（例: Asia/Tokyo）",
            },
          },
        },
      },
      {
        name: "list_directory",
        description: "ディレクトリのファイル一覧を返します",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "ディレクトリのパス" },
          },
          required: ["path"],
        },
      },
    ],
  };
});

// ツール呼び出しのハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_current_time": {
      const timezone = (args?.timezone as string) || "UTC";
      const now = new Date();
      return {
        content: [{
          type: "text",
          text: `現在時刻 (${timezone}): ${now.toLocaleString("ja-JP", { timeZone: timezone })}\nISO 8601: ${now.toISOString()}`,
        }],
      };
    }

    case "list_directory": {
      const dirPath = args?.path as string;
      const entries = await fs.readdir(path.resolve(dirPath), { withFileTypes: true });
      const listing = entries.map(e => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`);
      return {
        content: [{ type: "text", text: listing.join("\n") }],
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `ツール "${name}" は存在しません`);
  }
});

// stdio transport でサーバーを起動
const transport = new StdioServerTransport();
await server.connect(transport);
// ログはstderrに出力（stdoutはMCPプロトコルが使用）
console.error("MCPサーバーが起動しました");
```

### ビルドと登録

```bash
# ビルド
npm install && npm run build

# Claude Codeに登録
claude mcp add --transport stdio my-sample -- \
  node /path/to/mcp-server-sample/dist/index.js
```

### `.mcp.json` でプロジェクトに設定（チーム共有）

プロジェクトルートに `.mcp.json` を作成すれば、チーム全員が同じサーバーを使えます。

```json
{
  "mcpServers": {
    "sample-server": {
      "command": "node",
      "args": ["./examples/mcp-server-sample/dist/index.js"],
      "env": {}
    }
  }
}
```

初回アクセス時に承認ダイアログが表示されます。これはセキュリティ上の仕様です。

## ハマりやすいポイント

### 1. stdioのオプション順序

stdioトランスポートでは、**オプションは必ずサーバー名の前に、実行コマンドは `--` の後に**書く必要があります。

```bash
# ✅ 正しい
claude mcp add --transport stdio --env KEY=value myserver -- python server.py --port 8080

# ❌ 間違い（オプションの位置が後ろ）
claude mcp add --transport stdio myserver --env KEY=value -- python server.py
```

### 2. Windowsネイティブでは `cmd /c` が必要

WSLではなくWindowsネイティブ環境で `npx` ベースのサーバーを使う場合は、`cmd /c` ラッパーが必要です。

```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/mcp-package
```

### 3. デバッグフラグの名前

`--mcp-debug` というフラグは**存在しません**。正しくは `--debug` に `"api,mcp"` を渡します。

```bash
# ✅ 正しい
claude --debug "api,mcp"

# ❌ 間違い（このフラグは存在しない）
claude --mcp-debug
```

### 4. コンテキスト消費に注意

MCPサーバーを大量に登録すると、ツール定義だけでコンテキストウィンドウを圧迫します。実際に使うサーバーだけを登録しましょう。

コンテキスト最適化には `ENABLE_TOOL_SEARCH=auto` が有効ですが、Claude Sonnet 4以降が必要です。

```bash
ENABLE_TOOL_SEARCH=auto claude
```

### 5. プロジェクトスコープの承認ダイアログ

`.mcp.json` を使うプロジェクトに初めて入ると、MCPサーバーの承認ダイアログが表示されます。これはセキュリティ上の意図的な動作です。

承認をリセットしたい場合は次のコマンドを実行します。

```bash
claude mcp reset-project-choices
```

## セキュリティ注意事項

MCPサーバーを使う際は、セキュリティリスクを理解しておく必要があります。

**サードパーティサーバーは自己責任**

Anthropicはサードパーティ製MCPサーバーの動作を保証しません。信頼できるソースのサーバーのみ使用し、APIキーなどの機密情報の取り扱いには注意してください。

**プロンプトインジェクションのリスク**

外部コンテンツ（Webページ、ドキュメントなど）を取得するMCPサーバーは、**プロンプトインジェクション攻撃**の経路になり得ます。悪意のあるコンテンツが「AIに特定の操作をさせる」指示を含んでいる可能性があります。

信頼できないコンテンツを扱うサーバーには特に注意が必要です。

## まとめ

Claude CodeとMCPの組み合わせで、できることが大幅に広がります。

- **MCPはAIとツールを繋ぐ標準規格** — USB規格のように、一度覚えれば汎用的に使える
- **4つのスコープで細かく管理** — チーム共有（project）か個人利用（local/user）かを意識する
- **スコープ名が変わった** — 旧「project」→「local」、旧「global」→「user」に注意
- **HTTP transportが推奨** — SSEは非推奨、stdioはローカルツール向け
- **自作もできる** — TypeScriptなら`@modelcontextprotocol/sdk`で簡単に実装可能

まずは `claude mcp add` でGitHubやSentryを繋いでみるところから始めてみてください。きっと開発体験が変わるはずです。
