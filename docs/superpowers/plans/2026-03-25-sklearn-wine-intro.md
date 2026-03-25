# sklearn入門記事 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wineデータセットを使ったscikit-learn入門記事を執筆し、`articles/sklearn-wine-intro.md` に保存する

**Architecture:** まずコード検証用スクリプトで全コード例の出力を確認し、その結果を元に記事を執筆する。記事はZennフォーマット（frontmatter + markdown）で、日本語で書く。

**Tech Stack:** Python 3.9+, scikit-learn 1.x, Zenn markdown

---

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `examples/sklearn-wine-intro/verify.py` | コード検証スクリプト（全Stepのコードを実行し出力を確認） |
| `articles/sklearn-wine-intro.md` | 記事本体 |

## 執筆ルール

- **記事内でpandas/matplotlibには言及しない**（spec技術判断に従う）
- **コードブロックの前後に必ず解説を入れる**（何をするコードか → コード → 結果の解釈）
- **はじめにセクションはフックから始める**（読者が「なぜ読むべきか」がわかる書き出し）
- **語りかけ表現を使う**（「〜してみましょう」「〜ですよね」「これ、地味にうれしい」など）
- **個人の感想・体験を交える**（「実際に動かしてみると〜」「個人的には〜」）

---

### Task 1: コード検証環境のセットアップ

**Files:**
- Create: `examples/sklearn-wine-intro/verify.py`

- [ ] **Step 1: scikit-learnがインストール済みか確認**

Run: `python -c "import sklearn; print(sklearn.__version__)"`
Expected: 1.x のバージョン番号が表示される。なければ `pip install scikit-learn` を実行。

- [ ] **Step 2: 検証用ディレクトリを作成**

```bash
mkdir -p examples/sklearn-wine-intro
```

- [ ] **Step 3: Step1のコードを書いて実行結果を確認**

`examples/sklearn-wine-intro/verify.py` に以下を記述:

```python
from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

# データ読み込み
wine = load_wine()
X, y = wine.data, wine.target

# 訓練・テスト分割
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Step1: そのまま学習
svc = SVC(random_state=42)
svc.fit(X_train, y_train)
y_pred = svc.predict(X_test)
print(f"Step1 accuracy: {accuracy_score(y_test, y_pred):.4f}")
```

Run: `python examples/sklearn-wine-intro/verify.py`
Expected: Step1 accuracy が 0.6〜0.7 程度

- [ ] **Step 4: Step2のコードを追加して実行結果を確認**

verify.py に以下を追記:

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Step2: 前処理あり
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("svc", SVC(random_state=42)),
])
pipe.fit(X_train, y_train)
y_pred2 = pipe.predict(X_test)
print(f"Step2 accuracy: {accuracy_score(y_test, y_pred2):.4f}")
```

Run: `python examples/sklearn-wine-intro/verify.py`
Expected: Step2 accuracy が 0.95+ で、Step1からの大幅改善

- [ ] **Step 5: Step3のコードを追加して実行結果を確認**

verify.py に以下を追記:

```python
from sklearn.metrics import classification_report, confusion_matrix

# Step3: 評価
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred2))
print("\nClassification Report:")
print(classification_report(y_test, y_pred2, target_names=wine.target_names))
```

Run: `python examples/sklearn-wine-intro/verify.py`
Expected: 混同行列と classification_report が表示される。Step2のPipelineで0.95+の精度が出ているため、各クラスのf1-scoreは概ね0.90以上になるはず。

- [ ] **Step 6: Step4のコードを追加して実行結果を確認**

verify.py に以下を追記:

```python
from sklearn.model_selection import GridSearchCV

# Step4: ハイパーパラメータ調整
param_grid = {
    "svc__C": [0.1, 1, 10],
    "svc__gamma": ["scale", "auto", 0.01, 0.1],
    "svc__kernel": ["rbf", "linear"],
}
grid = GridSearchCV(pipe, param_grid, cv=5, scoring="accuracy")
grid.fit(X_train, y_train)
print(f"\nBest params: {grid.best_params_}")
print(f"Best CV score: {grid.best_score_:.4f}")
print(f"Test accuracy: {grid.score(X_test, y_test):.4f}")
```

Run: `python examples/sklearn-wine-intro/verify.py`
Expected: best_params_, best_score_, test accuracy が表示される。test accuracy は Step2 と同等かやや改善。

- [ ] **Step 7: 全出力を記録してコミット**

```bash
python examples/sklearn-wine-intro/verify.py > examples/sklearn-wine-intro/output.txt 2>&1
git add examples/sklearn-wine-intro/
git commit -m "docs: sklearn記事のコード検証スクリプトと出力結果を追加"
```

---

### Task 2: 記事の執筆 ― はじめに + Step1

**Files:**
- Create: `articles/sklearn-wine-intro.md`

**参照:**
- Spec: `docs/superpowers/specs/2026-03-25-sklearn-intro-design.md`
- Writer style: `.claude/agents/writer.md`
- 検証結果: `examples/sklearn-wine-intro/output.txt`

- [ ] **Step 1: frontmatter + はじめにセクションを書く**

`articles/sklearn-wine-intro.md` を作成。以下を含める:

frontmatter（そのままコピー）:
```yaml
---
title: "Pythonエンジニアのためのscikit-learn入門 ― 4ステップで学ぶ分類タスク"
emoji: "🍷"
type: "tech"
topics: ["python", "scikitlearn", "machinelearning", "beginners"]
published: false
---
```

はじめにセクション:
- **フックから始める**（例: 「Pythonは書けるけど機械学習は何から始めれば…」という読者の気持ちに寄り添う）
- sklearnの1行紹介、この記事のゴール、Wineデータセットの紹介、前提条件（Python 3.9+, `pip install scikit-learn`）
- 約300字、writer.md のスタイル（です/ます調、親しみやすい文体）

- [ ] **Step 2: Step1セクション「まず動かす」を書く**

以下を含める:
- データ読み込みのコードブロック
- train_test_split のコードブロック
- SVC の fit → predict → accuracy_score のコードブロック
- verify.py の実行結果から実際の精度を記載
- 「動いた！でも精度はイマイチ」というナラティブ
- 約800字

- [ ] **Step 3: コミット**

```bash
git add articles/sklearn-wine-intro.md
git commit -m "docs: sklearn記事のはじめに・Step1を執筆"
```

---

### Task 3: 記事の執筆 ― Step2 + Step3

**Files:**
- Modify: `articles/sklearn-wine-intro.md`

- [ ] **Step 1: Step2セクション「前処理を入れる」を書く**

以下を含める:
- 特徴量のスケール差の問題提起（具体的な数値例: アルコール度数 vs プロリン含有量）
- Pipeline + StandardScaler のコードブロック
- 精度の変化（verify.py の実際の結果を使う）
- Pipeline の利点（データリーク防止）の説明
- 約800字

- [ ] **Step 2: Step3セクション「モデルを評価する」を書く**

以下を含める:
- accuracy だけでは不十分な理由
- classification_report のコードブロックと出力例
- confusion_matrix のコードブロックと出力例
- 結果の読み解き方（どのクラスが間違えやすいか）
- 約800字

- [ ] **Step 3: コミット**

```bash
git add articles/sklearn-wine-intro.md
git commit -m "docs: sklearn記事のStep2・Step3を執筆"
```

---

### Task 4: 記事の執筆 ― Step4 + まとめ

**Files:**
- Modify: `articles/sklearn-wine-intro.md`

- [ ] **Step 1: Step4セクション「ハイパーパラメータを調整する」を書く**

以下を含める:
- ハイパーパラメータとは何かの簡潔な説明
- GridSearchCV のコードブロック（param_grid の定義、Pipeline との組み合わせ）
- best_params_ と best_score_ の確認コード
- verify.py の実際の結果を使った解説
- 約800字

- [ ] **Step 2: まとめセクションを書く**

以下を含める:
- 各ステップの精度変化の振り返りテーブル（Step1 → Step2 → Step4）
- 次のステップへの案内（回帰タスク、他のモデルなど）
- 約300字

- [ ] **Step 3: 全体の通し読みと調整**

- 分量が5000〜7000字の範囲に収まっているか確認
- コードブロックの言語タグ（```python）が全て付いているか確認
- 段落が3-4文以内に収まっているか確認
- writer.md のスタイル（語りかけ表現、親しみやすさ）が一貫しているか確認

- [ ] **Step 4: コミット**

```bash
git add articles/sklearn-wine-intro.md
git commit -m "docs: sklearn記事のStep4・まとめを執筆、記事完成"
```
