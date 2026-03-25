/**
 * シンプルなMCPサーバーのサンプル
 *
 * このサーバーは以下のツールを提供します:
 * - get_current_time: 現在時刻を返す
 * - read_text_file: テキストファイルを読み込む
 * - list_directory: ディレクトリ内のファイル一覧を返す
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode, } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
// MCPサーバーのインスタンスを作成
const server = new Server({
    name: "sample-mcp-server", // サーバーの識別名
    version: "1.0.0",
}, {
    capabilities: {
        tools: {}, // ツール機能を有効化
    },
});
// 利用可能なツールの一覧を返すハンドラー
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
                            description: "タイムゾーン（例: Asia/Tokyo）。省略時はUTC",
                        },
                    },
                },
            },
            {
                name: "read_text_file",
                description: "指定したパスのテキストファイルを読み込んで内容を返します",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "読み込むファイルのパス",
                        },
                    },
                    required: ["path"],
                },
            },
            {
                name: "list_directory",
                description: "指定したディレクトリのファイル・フォルダ一覧を返します",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "一覧を表示するディレクトリのパス",
                        },
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
            // 現在時刻を返す
            const timezone = args?.timezone || "UTC";
            const now = new Date();
            const formatted = now.toLocaleString("ja-JP", {
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `現在時刻 (${timezone}): ${formatted}\nISO 8601: ${now.toISOString()}`,
                    },
                ],
            };
        }
        case "read_text_file": {
            // テキストファイルを読み込む
            const filePath = args?.path;
            if (!filePath) {
                throw new McpError(ErrorCode.InvalidParams, "path は必須パラメータです");
            }
            try {
                const absolutePath = path.resolve(filePath);
                const content = await fs.readFile(absolutePath, "utf-8");
                return {
                    content: [
                        {
                            type: "text",
                            text: content,
                        },
                    ],
                };
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `ファイルの読み込みに失敗しました: ${error.message}`);
            }
        }
        case "list_directory": {
            // ディレクトリ一覧を返す
            const dirPath = args?.path;
            if (!dirPath) {
                throw new McpError(ErrorCode.InvalidParams, "path は必須パラメータです");
            }
            try {
                const absolutePath = path.resolve(dirPath);
                const entries = await fs.readdir(absolutePath, { withFileTypes: true });
                const listing = entries.map((entry) => {
                    const type = entry.isDirectory() ? "📁" : "📄";
                    return `${type} ${entry.name}`;
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: `${absolutePath} の内容:\n${listing.join("\n")}`,
                        },
                    ],
                };
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `ディレクトリの読み込みに失敗しました: ${error.message}`);
            }
        }
        default:
            throw new McpError(ErrorCode.MethodNotFound, `ツール "${name}" は存在しません`);
    }
});
// サーバーを起動（stdio transport を使用）
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stdioサーバーはstderrにログを出力する（stdoutはMCPプロトコルで使用するため）
    console.error("MCP サーバーが起動しました");
}
main().catch((error) => {
    console.error("サーバーの起動に失敗しました:", error);
    process.exit(1);
});
