# MCPサーバー サンプル

Claude Code MCP統合の記事で使用するサンプルMCPサーバーです。

## 提供するツール

| ツール名 | 説明 |
|---------|------|
| `get_current_time` | 現在時刻をタイムゾーン指定で取得 |
| `read_text_file` | テキストファイルを読み込む |
| `list_directory` | ディレクトリの内容を一覧表示 |

## セットアップ

```bash
cd examples/mcp-server-sample
npm install
npm run build
```

## Claude Code での設定

### プロジェクトレベル（`.mcp.json`）

プロジェクトルートに `.mcp.json` を作成:

```json
{
  "mcpServers": {
    "sample-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-sample/dist/index.js"]
    }
  }
}
```

または `tsx` を使ってビルドなしで直接起動:

```json
{
  "mcpServers": {
    "sample-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-server-sample/src/index.ts"]
    }
  }
}
```

### グローバル設定（`~/.claude/claude_desktop_config.json`）

```json
{
  "mcpServers": {
    "sample-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-sample/dist/index.js"]
    }
  }
}
```

## 動作確認

```bash
# デバッグモードでClaude Codeを起動
claude --mcp-debug

# または設定をリスト表示
claude mcp list
```

## ローカルでのテスト

```bash
# サーバーを直接起動してJSON-RPCを確認
node dist/index.js
```

起動後、JSONメッセージを送信して動作確認できます:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```
