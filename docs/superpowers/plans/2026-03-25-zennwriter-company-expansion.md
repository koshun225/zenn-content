# ZennWriter Company Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand ZennWriter from 4 agents to 9 agents with quality review layers, structured document handoffs, and a brainstorming-driven intake process.

**Architecture:** Each agent has an instruction file in `.claude/agents/`. Agents communicate through structured md files in `docs/articles/<slug>/`. Editor orchestrates all task creation/assignment. Workflow branches on `code_required` flag.

**Tech Stack:** Paperclip multi-agent framework, Markdown documents, Git for version tracking.

**Spec:** `docs/superpowers/specs/2026-03-25-zennwriter-company-expansion-design.md`

---

## File Map

### New files to create
- `.claude/agents/planner.md` — Planner instruction file
- `.claude/agents/code-reviewer.md` — Code Reviewer instruction file
- `.claude/agents/technical-reviewer.md` — Technical Reviewer instruction file
- `.claude/agents/copy-editor.md` — Copy Editor instruction file
- `.claude/agents/security-reviewer.md` — Security Reviewer instruction file

### Existing files to modify
- `.claude/agents/editor.md` — Major rewrite: brief.md-based workflow, task orchestration, review cycle management
- `.claude/agents/researcher.md` — Change output from Issue comments to `research.md`, add `research-brief.md` as input
- `.claude/agents/coder.md` — Add `code-spec.md` + `research.md` as inputs, `code-report.md` as output, rework handling
- `.claude/agents/writer.md` — Add multi-document input, review-driven revision flow
- `CLAUDE.md` — Update org chart, workflow overview, docs directory description

### Files to leave unchanged
- `.claude/agents/paperclip-expert.md` — Not part of article workflow

---

## Shared Conventions (all agent instruction files must include)

Every agent instruction file (Tasks 1-9) must reference these shared rules:

**Task description parsing:** Each agent reads `slug`, `docs_path`, and `issue_id` from their task description to locate input/output documents. Include this in the Input section of every agent.

**Document versioning:** Documents are overwritten in place (no version suffixes). Git history tracks changes. On rework/re-review, reviewer agents append a `## 再レビュー` section to their review document rather than overwriting the original review.

---

## Task 1: Update Editor instruction file

The Editor is the central coordinator. All other agents depend on understanding Editor's behavior, so this must be done first.

**Files:**
- Modify: `.claude/agents/editor.md`

- [ ] **Step 1: Read current editor.md**

Read `.claude/agents/editor.md` to understand the current structure.

- [ ] **Step 2: Rewrite editor.md**

Replace the contents with the new instruction file following the common structure (Role, Input, Process, Output, Quality Criteria, Escalation). Must include:

- Role: Workflow orchestrator and CEO. Converts article-spec.md to brief.md. Creates and assigns all tasks.
- Input: `docs/articles/<slug>/article-spec.md` (from human brainstorming), Issue with slug/docs_path
- Process:
  1. Read article-spec.md from the Issue
  2. Create `docs/articles/<slug>/` directory
  3. Create `brief.md` from article-spec.md (convert format, fill missing params with heuristics from spec Section 6):
     - `code_required`: tool/library topic → true, conceptual → false
     - `target_audience`: new tool intro → intermediate, deep internals → advanced
     - `code_quality_level`: comparison → minimal, tutorial → production, deep-dive → educational
     - `article_type`: "AとBを比較" → comparison, "Xの使い方" → tool-intro
  4. Create Planner task with slug/docs_path/issue_id in description
  5. After Planner completes: create Researcher task
  6. After Researcher completes: if `code_required: true`, create Coder task; else skip to Writer
  7. After Coder completes: create Code Reviewer task
  8. After Code Review OK (or max 2 reworks): create Writer task
  9. After Writer completes: create 3 parallel review tasks (Technical Reviewer, Copy Editor, Security Reviewer)
  10. After all 3 reviews complete: check for NG judgments
  11. If NG exists and no contradictions: create Writer revision task with consolidated feedback
  12. If contradictions between reviewers: resolve and include resolution in Writer task
  13. After revision: create re-review tasks only for NG reviewers
  14. Repeat review cycle (max 2 rounds total)
  15. If 2 rounds exhausted: escalate to human via Issue comment
  16. All OK: final quality check, mark Issue as done
  17. If human rejects at final review: read human's feedback from Issue/brief.md, determine scope (minor → Writer revision, technical → re-run from Researcher/Coder), re-run review cycle as needed (Editor may skip some reviews at discretion)
- Output: `docs/articles/<slug>/brief.md`
- Quality Criteria: brief.md contains all required fields, workflow proceeds without human intervention until final review
- Escalation: If article-spec.md is ambiguous, comment on Issue asking human for clarification. If review loop exceeds 2 rounds, escalate to human.
- Task description format:
  ```
  slug: <slug>
  docs_path: docs/articles/<slug>/
  issue_id: <Issue ID>
  ```
- `code_required` flow branching logic
- Parallel review management rules
- Rework counter tracking via review documents

- [ ] **Step 3: Verify structure**

Confirm the file follows the common structure: Role, Input, Process, Output, Quality Criteria, Escalation.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/editor.md
git commit -m "refactor: editor.mdを9名体制ワークフローに対応"
```

---

## Task 2: Create Planner instruction file

**Files:**
- Create: `.claude/agents/planner.md`

- [ ] **Step 1: Create planner.md**

Write the instruction file with:

- Role: Translate Editor's brief.md into actionable instructions for Researcher and Coder.
- Input: `docs/articles/<slug>/brief.md`
- Process:
  1. Read brief.md
  2. Create `research-brief.md` using template from spec (調査目的, 調査対象, 調査項目, 比較基準, ソース要件, アウトプット要件)
  3. If `code_required: true`: create `code-spec.md` using template from spec (目的, 要件, 実装すべき内容, 成果物)
  4. If `code_required: false`: skip code-spec.md, note in research-brief that code examples are not needed
  5. Tailor instructions based on `article_type` (from spec Section 6):
     - tool-intro → Researcher: 単一ツールの機能・特徴・エコシステムを調査
     - comparison → Researcher: 複数ツールの同一基準での比較調査
     - tutorial → Researcher: 手順の正確性、前提条件を重点調査
     - deep-dive → Researcher: 内部実装・設計思想まで深掘り
  6. Comment on Issue that planning is complete
- Output: `docs/articles/<slug>/research-brief.md`, optionally `docs/articles/<slug>/code-spec.md`
- Quality Criteria: Instructions are specific enough that Researcher/Coder can execute without asking clarifying questions. Research brief includes concrete investigation items, not vague directions.
- Escalation: If brief.md lacks information needed to create actionable instructions, comment on Issue for Editor.

- [ ] **Step 2: Verify structure**

Confirm Role, Input, Process, Output, Quality Criteria, Escalation sections are present.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/planner.md
git commit -m "feat: planner.md（記事設計エージェント）を追加"
```

---

## Task 3: Update Researcher instruction file

**Files:**
- Modify: `.claude/agents/researcher.md`

- [ ] **Step 1: Read current researcher.md**

Read `.claude/agents/researcher.md`.

- [ ] **Step 2: Rewrite researcher.md**

Replace with new instruction file:

- Role: Research topics and produce structured reports for the Writer.
- Input: `docs/articles/<slug>/research-brief.md`
- Process:
  1. Read research-brief.md for investigation items and source requirements
  2. Research using web search, official docs, GitHub repos
  3. For comparison articles: research each tool against the specified comparison axes
  4. Verify facts against primary sources
  5. Write `research.md` with: key findings, analysis, sources, target audience considerations
  6. Comment on Issue that research is complete
- Output: `docs/articles/<slug>/research.md`
- Quality Criteria: All investigation items from research-brief.md addressed. Sources cited. Facts verified. Appropriate depth for target audience.
- Escalation: If research-brief.md is unclear, comment on Issue for Editor.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/researcher.md
git commit -m "refactor: researcher.mdをドキュメント駆動に変更"
```

---

## Task 4: Update Coder instruction file

**Files:**
- Modify: `.claude/agents/coder.md`

- [ ] **Step 1: Read current coder.md**

Read `.claude/agents/coder.md`.

- [ ] **Step 2: Rewrite coder.md**

Replace with new instruction file:

- Role: Implement sample code based on specifications and research findings.
- Input: `docs/articles/<slug>/code-spec.md`, `docs/articles/<slug>/research.md`
- Process:
  1. Read code-spec.md for requirements and quality level
  2. Read research.md for context, best practices, and findings to incorporate
  3. Create project at `/Users/koshun/projects/<slug>/`
  4. Implement code per spec (adjust quality to minimal/production/educational level)
  5. Run code and verify it works
  6. Write `code-report.md` using template (概要, リポジトリ, 実装内容, 動作確認結果, 仕様からの変更点, 発見・注意点)
  7. Comment on Issue that implementation is complete
  8. If rework requested (via code-review.md NG): read review feedback, fix issues, update code and code-report.md
- Output: Code at `/Users/koshun/projects/<slug>/`, `docs/articles/<slug>/code-report.md`
- Quality Criteria: Code runs successfully. Matches spec requirements. Quality level appropriate. Deviations from spec documented.
- Escalation: If code-spec.md requirements are contradictory or impossible, comment on Issue for Editor.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/coder.md
git commit -m "refactor: coder.mdをドキュメント駆動に変更"
```

---

## Task 5: Create Code Reviewer instruction file

**Files:**
- Create: `.claude/agents/code-reviewer.md`

- [ ] **Step 1: Create code-reviewer.md**

Write the instruction file with:

- Role: Review code against specifications and quality standards.
- Input: `docs/articles/<slug>/code-spec.md`, code at `/Users/koshun/projects/<slug>/`, `docs/articles/<slug>/code-report.md` (Note: code-report.md is added beyond spec's role table as a deliberate enhancement — reviewer should see Coder's deviation notes)
- Process:
  1. Read code-spec.md for expected requirements and quality level
  2. Read code-report.md for implementation summary and deviations
  3. Read and run the actual code
  4. Evaluate against quality level:
     - minimal: Does it run? Does it demonstrate the concept?
     - production: Tests? Error handling? Best practices?
     - educational: Clear comments? Good naming? Learning progression?
  5. Write `code-review.md` using review template (判定: OK/NG, 差し戻し回数, 指摘事項, コメント)
  6. Comment on Issue with review result
- Output: `docs/articles/<slug>/code-review.md`
- Quality Criteria: Review covers all spec requirements. NG/OK judgment is justified. Feedback is actionable (not vague).
- Escalation: If code-spec.md itself has issues (not the code), comment on Issue for Editor.

- [ ] **Step 2: Verify structure**

Confirm all sections present.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/code-reviewer.md
git commit -m "feat: code-reviewer.md（コードレビューエージェント）を追加"
```

---

## Task 6: Update Writer instruction file

**Files:**
- Modify: `.claude/agents/writer.md`

- [ ] **Step 1: Read current writer.md**

Read `.claude/agents/writer.md`.

- [ ] **Step 2: Rewrite writer.md**

Keep existing writing style guidelines (です/ます調, 親しみやすい文体, etc.) and add the new workflow:

- Role: Write engaging technical articles in Japanese by synthesizing all research and code materials.
- Input: `docs/articles/<slug>/brief.md`, `docs/articles/<slug>/research.md`, `docs/articles/<slug>/code-report.md` (if exists), `docs/articles/<slug>/code-review.md` (if exists)
- Process:
  1. Read brief.md for article direction, target audience, article_type
  2. Read research.md for content
  3. Read code-report.md for code examples and findings (if code article)
  4. Structure article based on article_type:
     - tool-intro: 導入→機能紹介→実践→まとめ
     - comparison: 比較軸ごとの並列構成、比較表
     - tutorial: ステップバイステップ
     - deep-dive: 概念説明→実装詳細→考察
  5. Write article draft to `articles/<slug>.md` with Zenn frontmatter
  6. Comment on Issue that draft is complete
  7. If revision requested: read tech-review.md, copy-review.md, security-review.md for feedback. If Editor has resolved contradictions between reviewers, follow Editor's resolution (provided in the task description). Fix all issues in one pass. Update article.
- Output: `articles/<slug>.md`
- Writing Style section: preserve all existing style rules from current writer.md
- Quality Criteria: Article integrates all source materials. Structure matches article_type. Frontmatter correct. Japanese, appropriate style.
- Escalation: If source materials are contradictory, comment on Issue for Editor.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/writer.md
git commit -m "refactor: writer.mdをドキュメント駆動+レビュー修正対応に変更"
```

---

## Task 7: Create Technical Reviewer instruction file

**Files:**
- Create: `.claude/agents/technical-reviewer.md`

- [ ] **Step 1: Create technical-reviewer.md**

Write the instruction file with:

- Role: Verify technical accuracy and logical consistency of article drafts.
- Input: `articles/<slug>.md`, `docs/articles/<slug>/research.md`, `docs/articles/<slug>/code-report.md` (if exists), code at `/Users/koshun/projects/<slug>/` (if exists)
- Process:
  1. Read the article draft
  2. Cross-reference technical claims against research.md sources
  3. If code article: verify code examples in article match actual code, run code if needed
  4. Check logical flow: does the explanation build coherently?
  5. Check for technical errors: wrong API names, outdated syntax, incorrect behavior descriptions
  6. Write `tech-review.md` using review template
  7. Comment on Issue with review result
- Output: `docs/articles/<slug>/tech-review.md`
- Quality Criteria: All technical claims verified. Code/text consistency checked. Logical gaps identified.
- Escalation: If uncertain about technical accuracy, note uncertainty in review rather than guessing.

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/technical-reviewer.md
git commit -m "feat: technical-reviewer.md（技術レビューエージェント）を追加"
```

---

## Task 8: Create Copy Editor instruction file

**Files:**
- Create: `.claude/agents/copy-editor.md`

- [ ] **Step 1: Create copy-editor.md**

Write the instruction file with:

- Role: Optimize reader experience through structure, style, and clarity review.
- Input: `articles/<slug>.md`, `docs/articles/<slug>/brief.md` (for target_audience and article_type)
- Process:
  1. Read brief.md for target audience and article type
  2. Read the article draft
  3. Check against Zenn style guide:
     - です/ます調ベースで親しみやすい文体
     - 読者に語りかける表現（〜ですよね、〜してみましょう）
     - 自分の感想や体験を交える
     - 堅い表現を避ける
     - 短いパラグラフ（3-4文以内）
  4. Check structure matches article_type expectations
  5. Check target audience appropriateness: beginner articles explain terms, advanced articles skip basics
  6. Check article length matches brief.md guidance
  7. Write `copy-review.md` using review template
  8. Comment on Issue with review result
- Output: `docs/articles/<slug>/copy-review.md`
- Quality Criteria: Style guide compliance checked. Structure evaluated. Audience appropriateness verified. Feedback is specific (not "improve readability" but "paragraph 3 uses jargon without explanation for a beginner audience").
- Escalation: If style preferences conflict with technical accuracy needs, note in review for Editor to resolve.

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/copy-editor.md
git commit -m "feat: copy-editor.md（文章レビューエージェント）を追加"
```

---

## Task 9: Create Security Reviewer instruction file

**Files:**
- Create: `.claude/agents/security-reviewer.md`

- [ ] **Step 1: Create security-reviewer.md**

Write the instruction file with:

- Role: Pre-publication safety check for sensitive information and security issues.
- Input: `articles/<slug>.md`, code at `/Users/koshun/projects/<slug>/` (if exists)
- Process:
  1. Read the article draft
  2. Scan for personal information:
     - Real names, email addresses, IP addresses
     - API keys, tokens, passwords (even in code blocks)
     - Local file paths (`/Users/koshun/...` or similar)
     - Internal URLs, hostnames
  3. If code article: scan code repository for:
     - Hardcoded credentials in source files
     - `.env` files or config files with real values
     - Security anti-patterns in code examples (SQL injection, XSS, etc.)
  4. Check code examples in article for security bad practices that readers might copy
  5. Write `security-review.md` using review template
  6. Comment on Issue with review result
- Output: `docs/articles/<slug>/security-review.md`
- Quality Criteria: All checklist items verified. No false negatives on critical items (API keys, passwords). Specific line/location references for findings.
- Escalation: If potential security issue is ambiguous (e.g., is this a real API key or a placeholder?), flag as NG to be safe.

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/security-reviewer.md
git commit -m "feat: security-reviewer.md（セキュリティレビューエージェント）を追加"
```

---

## Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read current CLAUDE.md**

Read `CLAUDE.md` to understand current structure.

- [ ] **Step 2: Update agent structure section**

Update the エージェント構成 section with the new 9-agent org chart:

```
Editor (CEO): ワークフロー管理、brief.md作成、タスク発行、レビューサイクル管制
└── Planner: 記事設計（research-brief.md, code-spec.md作成）
    ├── Researcher: リサーチ・要点整理 → research.md
    ├── Coder: コード実装 → code-report.md（コード記事のみ）
    │   └── Code Reviewer: コードレビュー → code-review.md
    └── Writer: 記事執筆 → articles/<slug>.md
        ├── Technical Reviewer: 技術レビュー → tech-review.md
        ├── Copy Editor: 文章レビュー → copy-review.md
        └── Security Reviewer: セキュリティレビュー → security-review.md
```

- [ ] **Step 3: Update workflow section**

Update the ワークフロー section:

1. 人間がbrainstormingで記事要件を整理 → `docs/articles/<slug>/article-spec.md`
2. PaperclipのIssueを作成
3. Editor → Planner → Researcher → (Coder → Code Reviewer) → Writer → 並列レビュー(3名)
4. 人間が最終レビュー → published: true

- [ ] **Step 4: Add docs directory description**

Add documentation about the `docs/articles/<slug>/` directory convention and what files go there.

- [ ] **Step 5: Update Agent Instruction Files list**

Update the "Agent Instruction Files" section to list all 9 agent files plus paperclip-expert.md:
```
.claude/agents/ にエージェントごとのinstruction fileを配置
- editor.md, planner.md, researcher.md, coder.md, code-reviewer.md,
  writer.md, technical-reviewer.md, copy-editor.md, security-reviewer.md
- paperclip-expert.md（Paperclip設定専門）
```

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.mdを9名体制に更新"
```

---

## Task 11: Verification — dry run check

Verify the complete system by reading through all 9 instruction files and confirming consistency.

**Files:**
- Read: all `.claude/agents/*.md` files (except paperclip-expert.md)
- Read: `CLAUDE.md`

- [ ] **Step 1: Cross-reference all agent inputs/outputs**

For each agent, verify:
- Every input document is produced by another agent's output
- Every output document is consumed by at least one other agent
- Document paths are consistent across all files

- [ ] **Step 2: Verify workflow coverage**

Trace through both flows (code article and code-less article) and confirm:
- Every step in the workflow has a corresponding agent instruction
- Task description format (slug, docs_path, issue_id) is referenced in all agents
- Rework flows reference correct review documents

- [ ] **Step 3: Verify template consistency**

Confirm all document templates referenced in agent instructions match the templates defined in the spec.

- [ ] **Step 4: Commit any fixes**

If any inconsistencies found, fix and commit:

```bash
git add -A
git commit -m "fix: エージェント定義の整合性修正"
```
