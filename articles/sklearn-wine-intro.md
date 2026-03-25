---
title: "Pythonエンジニアのためのscikit-learn入門 ― 4ステップで学ぶ分類タスク"
emoji: "🍷"
type: "tech"
topics: ["python", "scikitlearn", "machinelearning", "beginners"]
published: false
---

機械学習、やってみたいと思ってるけどなかなか手が出ない……という方、多いんじゃないでしょうか。「数学が難しそう」「ライブラリが多くて何から始めればいいか」とか。

でも実は、**scikit-learn**（sklearn）を使えば、Pythonが書ければ数十行で「機械学習してる」状態になれます。この記事では、Wineデータセットを題材にして、素朴な実装から少しずつ改善していくスタイルで、分類タスクの基本フローを体験してもらいます。

## この記事で学ぶこと

- scikit-learnの基本的な使い方（fit/predict）
- 前処理（StandardScaler）がなぜ大事か
- モデルの評価指標（classification_report, confusion_matrix）
- ハイパーパラメータのチューニング（GridSearchCV）

**前提条件**: Python 3.9以上、scikit-learn 1.x（`pip install scikit-learn`）

## 使うデータセット

今回はscikit-learnに組み込まれている**Wineデータセット**を使います。イタリアのワイン178本を対象に、アルコール度数やプロリン含有量などの化学成分（13特徴量）から、ワインの産地（3クラス）を分類するタスクです。

シンプルながら、スケールがバラバラな特徴量が混在しているので「前処理の重要性」を体感するのにちょうどいいんですよね。

---

## Step1: まず動かす

最初は余計なことを考えず、最小限のコードで動かしてみましょう。

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

# 学習 → 予測
svc = SVC(random_state=42)
svc.fit(X_train, y_train)
y_pred = svc.predict(X_test)

print(f"Step1 accuracy: {accuracy_score(y_test, y_pred):.4f}")
```

```
Step1 accuracy: 0.7593
```

動きました！でも正解率75.9%……なんかイマイチですよね。3クラスのランダム予測でも33%なので悪くはないんですが、「もっとできるはず」という感覚があります。

実は原因があって、SVC（サポートベクターマシン）は特徴量のスケールに敏感なモデルです。Wineデータを見てみると、アルコール度数（11〜14程度）とプロリン含有量（300〜1700程度）では数値のスケールが全然違います。この差がそのままモデルに影響してしまっています。

---

## Step2: 前処理を入れる

スケールの違いを吸収するために、**StandardScaler**（平均0、分散1に正規化）を使います。ここでポイントなのが、**Pipeline**を使って前処理とモデルをセットにすること。

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("svc", SVC(random_state=42)),
])
pipe.fit(X_train, y_train)
y_pred2 = pipe.predict(X_test)

print(f"Step2 accuracy: {accuracy_score(y_test, y_pred2):.4f}")
```

```
Step2 accuracy: 0.9815
```

**75.9% → 98.2%**。これ、地味にすごくないですか？コード数行追加しただけでこの変化。前処理の効果がはっきり出ましたね。

Pipelineを使う理由はもう一つあって、**データリーク防止**です。Pipelineを使わずに`X_train`全体でスケーリングしてから分割すると、テストデータの情報が訓練に漏れてしまいます（これをデータリークと言います）。Pipelineなら`fit`のタイミングで訓練データだけを使ってスケーラーを学習してくれるので安心です。

---

## Step3: モデルを評価する

正解率（accuracy）だけで判断するのは少し危険です。たとえばクラスが極端に偏っているデータなら、全部同じクラスと予測するだけで高い正解率が出てしまいます。

より詳細に評価するために、**classification_report**と**confusion_matrix**を見てみましょう。

```python
from sklearn.metrics import classification_report, confusion_matrix

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred2))

print("\nClassification Report:")
print(classification_report(y_test, y_pred2, target_names=wine.target_names))
```

```
Confusion Matrix:
[[19  0  0]
 [ 0 21  0]
 [ 0  1 13]]

Classification Report:
              precision    recall  f1-score   support

     class_0       1.00      1.00      1.00        19
     class_1       0.95      1.00      0.98        21
     class_2       1.00      0.93      0.96        14

    accuracy                           0.98        54
```

混同行列を見ると、class_1とclass_2の間で1件だけ誤分類しています。class_2をclass_1と予測してしまったケースですね。

Classification Reportで注目するのは：
- **precision（適合率）**: そのクラスと予測したうち、実際にそのクラスだった割合
- **recall（再現率）**: 実際にそのクラスのうち、正しく検出できた割合
- **f1-score**: precisionとrecallの調和平均

用途によってどの指標を重視するか変わりますが、まずこの3つを確認する習慣をつけておくと良いです。

---

## Step4: ハイパーパラメータを調整する

モデルには「ハイパーパラメータ」と呼ばれる、学習前に設定する設定値があります。SVCなら`C`（マージンの広さ）、`gamma`（カーネルの影響範囲）、`kernel`（カーネル関数の種類）などです。

これを手動で試すのは大変なので、**GridSearchCV**を使って自動探索します。

```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    "svc__C": [0.1, 1, 10],
    "svc__gamma": ["scale", "auto", 0.01, 0.1],
    "svc__kernel": ["rbf", "linear"],
}
grid = GridSearchCV(pipe, param_grid, cv=5, scoring="accuracy")
grid.fit(X_train, y_train)

print(f"Best params: {grid.best_params_}")
print(f"Best CV score: {grid.best_score_:.4f}")
print(f"Test accuracy: {grid.score(X_test, y_test):.4f}")
```

```
Best params: {'svc__C': 1, 'svc__gamma': 'scale', 'svc__kernel': 'linear'}
Best CV score: 0.9840
Test accuracy: 0.9815
```

`cv=5`は5分割交差検証（クロスバリデーション）を使うことを意味します。単一の訓練/テスト分割より信頼性の高い評価ができます。

ハマりポイントなので注意ですが、パラメータ名が`svc__C`のように`ステップ名__パラメータ名`の形式になっています。Pipelineの中のパラメータを指定するときのscikit-learnの書き方です。

今回の結果では`kernel: linear`が最良でした。元のデフォルトである`rbf`カーネルよりlinearの方が今回のデータに合っていたようです。

---

## まとめ

4ステップで精度の変化を振り返ります：

| ステップ | 内容 | 精度 |
|--------|------|------|
| Step1 | 前処理なし | 75.9% |
| Step2 | StandardScaler + Pipeline | 98.2% |
| Step4 | GridSearchCVでチューニング | 98.2%（CVスコア: 98.4%）|

単純なfitから始めて、前処理 → 評価 → チューニングと順番に積み上げていくことで、機械学習の基本フローを一通り体験できたと思います。特に前処理のインパクトは大きかったですよね。

**次のステップとして試してみると面白いこと:**
- RandomForestやLogisticRegressionなど他のモデルで同じフローを試す
- クロスバリデーション（`cross_val_score`）をもっと詳しく掘り下げる
- 回帰タスク（数値を予測する問題）に挑戦してみる

コードは全部動作確認済みです。ぜひコピーして手元で動かしてみてください！
