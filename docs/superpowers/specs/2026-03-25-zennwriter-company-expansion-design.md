# ZennWriter Company Expansion Design

## Overview

ZennWriter (Paperclip Company) の組織構造を拡張し、記事制作の全工程にレビュー・チェック体制を導入する。品質重視の方針で、4名体制から9名体制へ拡張する。

### 設計方針

- **品質重視**: 全工程にチェックレイヤーを設ける
- **柔軟性**: 記事ごとにコード品質レベル・ターゲット読者を変更可能
- **人間の介入は最初と最後のみ**: brainstormingで記事要件を整理 → 最終レビュー
- **構造化ドキュメント**: エージェント間のやり取りはすべてmdファイル経由
- **記事ジャンル**: ツール・ライブラリ紹介 + 比較検証が中心

---

## 1. 組織構成とロール定義

```
Editor (CEO)
├── Planner           — 記事設計書・コード仕様書の作成
├── Researcher        — 情報収集・比較調査・ソース整理
├── Coder             — サンプルコード実装（コード記事のみ）
├── Code Reviewer     — コードレビュー・動作検証（コード記事のみ）
├── Writer            — 記事執筆
├── Technical Reviewer — 技術的正確性・論理構成のレビュー
├── Copy Editor       — 文章品質・読者体験のレビュー
└── Security Reviewer — セキュリティ・個人情報・機密情報チェック
```

### ロール詳細

| ロール | 入力 | 出力 | 責務 |
|--------|------|------|------|
| **Editor** | 記事要件spec（人間がbrainstormingで作成） | 記事設計書（`docs/articles/<slug>/brief.md`） | 記事要件specをbrief.mdフォーマットに変換。ワークフロー全体の指揮。並列レビューの競合解決 |
| **Planner** | 記事設計書 | コード仕様書（`docs/articles/<slug>/code-spec.md`）、リサーチ指示書（`docs/articles/<slug>/research-brief.md`） | 設計書を元に、Researcher/Coderへの具体的な作業指示を構造化 |
| **Researcher** | リサーチ指示書 | リサーチレポート（`docs/articles/<slug>/research.md`） | 情報収集、比較分析、ソースの信頼性確認 |
| **Coder** | コード仕様書 + リサーチレポート | 実装コード（`/Users/koshun/projects/<slug>/`）+ 実装レポート（`docs/articles/<slug>/code-report.md`） | リサーチ結果を踏まえた仕様に基づくコード実装、動作確認 |
| **Code Reviewer** | コード仕様書 + 実装コード | レビューレポート（`docs/articles/<slug>/code-review.md`） | コードが仕様通りか、品質基準を満たすかをレビュー。問題があればCoderに差し戻し |
| **Writer** | リサーチレポート + コードレポート + レビュー結果 | 記事ドラフト（`articles/<slug>.md`） | 全素材を統合して記事を執筆 |
| **Technical Reviewer** | 記事ドラフト + リサーチレポート + コード | テクニカルレビュー（`docs/articles/<slug>/tech-review.md`） | 技術的正確性、説明の論理性、コード例と本文の整合性をチェック |
| **Copy Editor** | 記事ドラフト | コピーレビュー（`docs/articles/<slug>/copy-review.md`） | 文章の読みやすさ、構成、ターゲット読者への適切さ、Zennスタイルガイドとの整合性 |
| **Security Reviewer** | 記事ドラフト + コード | セキュリティレビュー（`docs/articles/<slug>/security-review.md`） | 個人情報（名前・メールアドレス・APIキー等）の混入チェック、コード例の脆弱性チェック、内部情報の漏洩チェック |

### Security Reviewerのチェック対象

- APIキー、トークン、パスワードのハードコード
- 個人名、メールアドレス、IPアドレス
- ローカルのファイルパス（`/Users/koshun/...`など）
- 社内URL、内部ホスト名
- コード例に含まれるセキュリティ上のバッドプラクティス

---

## 2. ワークフロー

### 前段: Brainstormingフェーズ（Paperclipの外）

記事制作の開始前に、人間がClaude Codeのbrainstormingスキルを使って記事の要件を整理する。Paperclipのエージェントはリアルタイムの人間との対話ができないため、このフェーズはPaperclipの外で行う。

```
人間: brainstormingスキルで記事要件を整理
  - 記事の方向性・角度
  - 想定読者層（beginner/intermediate/advanced）
  - おおよその文字数・深さ
  - コードの要否・品質レベル
  - 比較対象（comparison記事の場合）
  ↓
出力: docs/articles/<slug>/article-spec.md に保存
  ↓
人間: PaperclipのIssueを作成し、article-spec.mdのパスを記載
```

このフェーズにより、Editorは人間の意図を推測する必要がなく、article-spec.mdをbrief.mdフォーマットに変換するだけでよい。

### コード記事フロー（ツール紹介・比較検証）

```
人間: article-spec.md作成済み → Issueを作成
  ↓
Editor: article-spec.mdを元にbrief.md作成
  ↓
Planner: リサーチ指示書 + コード仕様書を作成
  ↓
Researcher: リサーチ → research.md
  ↓
Coder: リサーチ結果 + コード仕様書を元に実装 → code-report.md
  ↓
Code Reviewer: コードレビュー → code-review.md
  ├── NG → Coderに差し戻し（最大2回）
  └── OK ↓
Writer: 全素材を統合して記事ドラフト執筆
  ↓
┌──────────────────────┐  ← 並列実行
│ Technical Reviewer    │
│ Copy Editor           │
│ Security Reviewer     │
└──────────────────────┘
  ├── 問題あり → Writerが修正（最大2回）
  └── 全員OK ↓
Editor: 最終確認 → Issueを完了
  ↓
人間: 最終レビュー → published: true
```

### コードなし記事フロー

```
人間: article-spec.md作成済み → Issueを作成
  ↓
Editor: article-spec.mdを元にbrief.md作成
  ↓
Planner: リサーチ指示書を作成
  ↓
Researcher: リサーチ → research.md
  ↓
Writer: 記事ドラフト執筆
  ↓
┌──────────────────────┐  ← 並列実行
│ Technical Reviewer    │
│ Copy Editor           │
│ Security Reviewer     │
└──────────────────────┘
  ├── 問題あり → Writerが修正（最大2回）
  └── 全員OK ↓
Editor: 最終確認
  ↓
人間: 最終レビュー → published: true
```

### ワークフローのポイント

- **リサーチ先行**: Coderはリサーチ結果を踏まえて実装する（リサーチとコードの並列実行はしない）
- **並列化できる箇所は並列実行**: 3つのレビュー（Technical/Copy/Security）は並列でトークン消費とリードタイムを抑える
- **差し戻しは最大2回**: ループ防止。2回で解決しなければEditorが介入判断
- **フロー選択は自動**: brief.mdの`code_required`フラグでEditorが分岐を制御

---

## 3. ドキュメント構造

### ディレクトリ構成

```
docs/articles/<slug>/
├── article-spec.md    — 人間作成（brainstorming）：記事要件spec
├── brief.md           — Editor作成：記事設計書
├── research-brief.md  — Planner作成：リサーチ指示書
├── code-spec.md       — Planner作成：コード仕様書（コード記事のみ）
├── research.md        — Researcher作成：リサーチレポート
├── code-report.md     — Coder作成：実装レポート（コード記事のみ）
├── code-review.md     — Code Reviewer作成：レビュー結果（コード記事のみ）
├── tech-review.md     — Technical Reviewer作成：技術レビュー
├── copy-review.md     — Copy Editor作成：文章レビュー
└── security-review.md — Security Reviewer作成：セキュリティレビュー
```

### article-spec.md（記事要件spec）テンプレート

人間がbrainstormingスキルで作成する。Editorへの入力となる。

```markdown
# 記事要件: <トピック名>

## トピック
- URL: <参考URL（あれば）>
- 概要: <何について書きたいか>

## 記事の方向性
<どういう角度で書きたいか、自分が興味を持ったポイント>

## 想定読者
- レベル: beginner/intermediate/advanced
- 前提知識: <読者が知っていると想定する知識>

## 記事の規模
- おおよその文字数: <1500-3000 / 3000-6000 / 5000-10000>
- コードの要否: true/false
- コードの品質レベル: minimal/production/educational（コードありの場合）

## 比較対象（comparison記事の場合）
- <ツールA>
- <ツールB>
- 比較で特に注目したいポイント: <性能、DX、エコシステム等>

## その他の意図・メモ
<自由記述: 記事で伝えたいこと、避けたいこと、個人的な体験など>
```

### brief.md（記事設計書）テンプレート

```markdown
# 記事設計書: <タイトル>

## 基本情報
- slug: <slug>
- topic_url: <ソースURL>
- code_required: true/false
- target_audience: beginner/intermediate/advanced
- code_quality_level: minimal/production/educational
- article_type: tool-intro/comparison/tutorial/deep-dive

## 記事の方向性
<何を、なぜ、どういう角度で書くか>

## 比較対象（比較記事の場合）
- ツールA: <概要>
- ツールB: <概要>
- 比較軸: <性能、DX、エコシステム等>

## 期待するアウトプット
<完成イメージの概要>
```

### code-spec.md（コード仕様書）テンプレート

```markdown
# コード仕様書: <slug>

## 目的
<このコードで何を示すか>

## 要件
- 言語/フレームワーク:
- 品質レベル: minimal/production/educational
- テスト: 必要/不要

## 実装すべき内容
1. <具体的な実装項目>
2. ...

## 成果物
- リポジトリ: /Users/koshun/projects/<slug>/
- 動作確認手順: <どう実行して何が出れば成功か>
```

### レビュー系ドキュメント共通フォーマット

```markdown
# <レビュー種別>: <slug>

## 判定: OK / NG
## 差し戻し回数: 0/2

## 指摘事項
### 重大（修正必須）
- [ ] <指摘内容>

### 軽微（推奨）
- [ ] <指摘内容>

## コメント
<総評>
```

---

## 4. エージェント間の連携ルール

### ドキュメント受け渡しの原則

- **すべてのやり取りはmdファイル経由**。Issueコメントは進捗報告のみに使う
- 各エージェントは自分の入力ドキュメントを読み、出力ドキュメントを書く。直接の口頭伝達はない
- ドキュメントのパスは`docs/articles/<slug>/`で固定なので、slugさえ知っていれば誰でもアクセスできる

### タスクdescriptionの起動フォーマット

Editorがタスクを作成する際、descriptionに以下の情報を必ず含める。各エージェントはこの情報を元に自分の入出力ドキュメントを特定する：

```
slug: <記事のslug>
docs_path: docs/articles/<slug>/
issue_id: <PaperclipのIssue ID>
```

### タスク発行の権限ルール

**タスクの作成・アサインは常にEditorが行う。** `tasks:assign`権限の制約を回避するため、他のエージェントがタスクを直接発行することはしない。

- レビュアーがNG判定を出した場合 → レビュードキュメントにNG判定を記載し、Issueにコメントで報告する。Editorがそれを検知して差し戻しタスクを作成する
- 並列レビュー後の再レビュー → Editorがレビュードキュメントを確認し、NG判定のレビュアーのみに再レビュータスクを作成する
- エスカレーション → 差し戻し回数が2/2に達した場合、EditorがIssueにエスカレーションコメントを記載し、人間に判断を委ねる

### 差し戻しの判断基準

| レビュー | NG基準（差し戻し） | OK基準 |
|---------|-------------------|--------|
| **Code Reviewer** | コードが動かない、仕様と乖離、重大なバグ | 動作する、仕様を満たす、品質レベルに応じた基準を達成 |
| **Technical Reviewer** | 技術的に誤った記述、コードと本文の不整合、論理の飛躍 | 正確、整合性あり、説明が論理的 |
| **Copy Editor** | 構成が読者に伝わらない、ターゲット読者と文体の不一致 | 読みやすい、構成が明確、スタイルガイドに準拠 |
| **Security Reviewer** | APIキー・個人情報の混入、内部パスの露出、脆弱なコード例 | 機密情報なし、公開して問題のない内容 |

### 差し戻しフロー

```
レビュアー: review.md に NG判定 + 指摘事項を記載（差し戻し回数: 1/2）
  ↓
Editor: NG判定を検知 → 対象エージェントに修正タスクを作成
  ↓
対象エージェント: 指摘事項を読み修正 → ドキュメント/コードを更新
  ↓
Editor: レビュアーに再レビュータスクを作成
  ↓
レビュアー: 再レビュー
  ├── OK → 次の工程へ
  └── NG（差し戻し回数: 2/2） → Editor が介入して判断
      ├── Editorが修正方針を決定して再実行
      └── または人間にエスカレーション
```

### 並列レビューでの競合解決

Technical Reviewer、Copy Editor、Security Reviewerは並列で動くため、矛盾する指摘が出る可能性がある：

- **矛盾がない場合** → Writerが全指摘をまとめて1回で修正
- **矛盾がある場合**（例：Technical Reviewerは「この説明を追加すべき」、Copy Editorは「長すぎるので削るべき」） → **Editorが判断**して修正方針を決定し、Writerに指示

### Editorのワークフロー制御

Editorは`brief.md`の`code_required`フラグで自動的にフローを切り替える：

- `code_required: true` → Planner がコード仕様書も作成、Coder/Code Reviewer が参加
- `code_required: false` → コード関連工程をスキップ

---

## 5. エージェントInstruction Fileの方針

### ファイル配置

```
.claude/agents/
├── editor.md             — 既存（大幅改訂）
├── planner.md            — 新規
├── researcher.md         — 既存（改訂）
├── coder.md              — 既存（改訂）
├── code-reviewer.md      — 新規
├── writer.md             — 既存（改訂）
├── technical-reviewer.md — 新規
├── copy-editor.md        — 新規
└── security-reviewer.md  — 新規
```

### 各instruction fileの共通構造

```markdown
# <ロール名> Instructions

## Role
<一文でロールの目的を定義>

## Input
<読むべきドキュメントのパスと説明>

## Process
<具体的な作業ステップ>

## Output
<書き出すドキュメントのパスとフォーマット>

## Quality Criteria
<自分のアウトプットが満たすべき基準>

## Escalation
<判断に迷った場合の対応>
```

### 既存エージェントの主な変更点

| エージェント | 変更内容 |
|-------------|---------|
| **Editor** | Issueコメントベースから`brief.md`作成ベースに変更。フロー制御ロジック追加。並列レビューの競合解決ルール追加 |
| **Researcher** | Issueコメントへの投稿から`research.md`への書き出しに変更。`research-brief.md`を入力として受け取る形に |
| **Coder** | `code-spec.md` + `research.md`を入力に。`code-report.md`を出力に。Code Reviewerからの差し戻し対応を追加 |
| **Writer** | 複数ドキュメントを入力として統合。レビュー結果に基づく修正フローを追加 |

### 新規エージェントの概要

| エージェント | 核心的な責務 |
|-------------|-------------|
| **Planner** | brief.mdを読み、Researcher/Coderが迷わず動ける具体的な指示書を作る。記事の「設計」を担当。Editorから分離する理由：(1) Editorが複数記事を並行管理する際、Planning作業をブロッキングにしない (2) 戦略的判断（Editor）と戦術的分解（Planner）の責務を明確に分離 |
| **Code Reviewer** | code-spec.mdを基準にコードをレビュー。品質レベル（minimal/production/educational）に応じて基準を調整 |
| **Technical Reviewer** | 記事の技術的正確性を検証。リサーチレポートやコードと本文の整合性を確認 |
| **Copy Editor** | 読者体験の最適化。構成、文体、ターゲットとの一致をチェック。Zennスタイルガイド（writer.mdの文体ルール）を基準に |
| **Security Reviewer** | 公開前の安全確認。個人情報、機密情報、内部パス、脆弱なコード例を検出 |

---

## 6. 補足事項

### Editorの意思決定プロセス

Editorは人間がbrainstormingで作成した`article-spec.md`を元に`brief.md`を作成する。article-spec.mdには記事の方向性・読者層・文字数などが人間の意図として明記されているため、Editorは推測する必要がなく、brief.mdフォーマットへの変換と、ワークフロー制御に必要なパラメータの確定に集中する。

article-spec.mdに明記されていないパラメータがある場合、Editorは以下のヒューリスティクスで補完する：

- **`code_required`**: トピックがツール・ライブラリに関するものならtrue、概念的な議論ならfalse
- **`target_audience`**: トピックの専門性から判断。新しいツールの紹介→intermediate、深い内部実装→advanced
- **`code_quality_level`**: article_typeに連動。comparison→minimal（比較が主目的）、tutorial→production、deep-dive→educational
- **`article_type`**: トピックの性質から判断。「AとBを比較して」→comparison、「Xの使い方」→tool-intro

### article_typeによるエージェント動作の違い

`article_type`はワークフローの分岐には使わない（分岐は`code_required`のみ）。代わりに、各エージェントがドキュメント作成時に`article_type`を参照して内容を調整する：

| article_type | Researcherへの影響 | Writerへの影響 |
|-------------|-------------------|---------------|
| **tool-intro** | 単一ツールの機能・特徴・エコシステムを調査 | 導入→機能紹介→実践→まとめの構成 |
| **comparison** | 複数ツールの同一基準での比較調査 | 比較軸ごとの並列構成、比較表を含む |
| **tutorial** | 手順の正確性、前提条件を重点調査 | ステップバイステップ構成 |
| **deep-dive** | 内部実装・設計思想まで深掘り | 概念説明→実装詳細→考察の構成 |

### 並列レビュー後の修正・再レビュールール

1. 3つのレビュー結果が出揃ったら、Writerが全指摘を統合して**1回の修正パスで対応**
2. 修正後の再レビューは**NG判定を出したレビュアーのみ**が実施（OK判定のレビュアーは再レビュー不要）
3. 再レビューで新たな問題が見つかった場合も、同じ2回制限にカウントする
4. 2回で解決しない場合はEditorが介入

**並列レビュー→修正サイクル全体はEditorが管制する。** 具体的には：
- Editorが3つのレビュータスクを並列で作成
- 3つすべてが完了したことをEditorが確認
- NG判定があればEditorがWriterに修正タスクを作成（全指摘を集約して渡す）
- 修正完了後、EditorがNG判定のレビュアーのみに再レビュータスクを作成
- 全員OKになるまでEditorがこのサイクルを管理する

### ドキュメントのバージョン管理

- ドキュメントは**上書き更新**する（バージョンサフィックスは付けない）
- 変更履歴はgit historyで追跡可能なので、ドキュメント内にchangelogは持たない
- レビューで差し戻しが発生した場合、レビュードキュメントに`## 再レビュー`セクションを追記する形で履歴を残す

### 人間による最終レビューでのリジェクト対応

人間が最終レビューで記事をリジェクトした場合：

1. 人間がIssue（またはbrief.md）にフィードバックを記載
2. Editorがフィードバックを読み、修正範囲を判断
   - 軽微な修正 → Writerに直接修正指示
   - 技術的な問題 → 該当工程（Researcher/Coder）からやり直し
3. 修正後、再度レビュー工程を通す（ただしEditorの判断で一部スキップ可能）

### CLAUDE.mdの更新

実装時に`CLAUDE.md`のエージェント構成セクションを9名体制に更新する。具体的には：
- 組織図の更新
- ドキュメントディレクトリ（`docs/articles/<slug>/`）の説明追加
- ワークフローの概要追記

### 実装計画について

具体的な実装計画（フェーズ分け、マイグレーション手順）は本設計書の承認後、別途作成する。

---

## 7. 不足テンプレートの補完

### research-brief.md（リサーチ指示書）テンプレート

```markdown
# リサーチ指示書: <slug>

## 調査目的
<何を明らかにするためのリサーチか>

## 調査対象
- <調査すべきツール・技術・概念>

## 調査項目
1. <具体的な調査ポイント>
2. ...

## 比較基準（comparison記事の場合）
- <比較軸1>: <何を比較するか>
- <比較軸2>: ...

## ソース要件
- 公式ドキュメントを最優先
- リリースノート、GitHub Issues/Discussionsも参照
- 情報の鮮度: <最新バージョンのみ / 過去バージョンとの比較も含む>

## アウトプット要件
- ターゲット読者: <beginner/intermediate/advanced>
- 読者が知りたいであろう疑問を意識して整理すること
```

### code-report.md（実装レポート）テンプレート

```markdown
# 実装レポート: <slug>

## 概要
<何を実装したかの要約>

## リポジトリ
- パス: /Users/koshun/projects/<slug>/
- 言語/フレームワーク: <使用技術>

## 実装内容
1. <実装した項目と概要>
2. ...

## 動作確認結果
- 実行コマンド: <手順>
- 結果: <成功/失敗、出力の要約>

## 仕様からの変更点
<code-spec.mdからの乖離があれば記載。なければ「なし」>

## 発見・注意点
<実装中に気づいたこと、ハマりポイント、記事に含めると有用な情報>
```

### Plannerのコードなし記事での挙動

`brief.md`の`code_required: false`の場合、Plannerは以下のように動作する：
- `research-brief.md`のみ作成する
- `code-spec.md`は作成しない
- リサーチ指示書には、コード例が不要であることを明記する
