"""
sklearn入門記事（Wineデータセット分類）のコード検証スクリプト

このスクリプトは記事に掲載するコード例を実行し、出力を確認するためのものです。
Step1〜Step4の順番に実行されます。
"""

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

# Step1: そのまま学習（前処理なし）
print("=== Step1: 前処理なし ===")
svc = SVC(random_state=42)
svc.fit(X_train, y_train)
y_pred = svc.predict(X_test)
print(f"Step1 accuracy: {accuracy_score(y_test, y_pred):.4f}")

# Step2: 前処理あり（StandardScaler + Pipeline）
print("\n=== Step2: StandardScaler + Pipeline ===")
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("svc", SVC(random_state=42)),
])
pipe.fit(X_train, y_train)
y_pred2 = pipe.predict(X_test)
print(f"Step2 accuracy: {accuracy_score(y_test, y_pred2):.4f}")

# Step3: 詳細な評価指標
print("\n=== Step3: モデル評価 ===")
from sklearn.metrics import classification_report, confusion_matrix

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred2))
print("\nClassification Report:")
print(classification_report(y_test, y_pred2, target_names=wine.target_names))

# Step4: ハイパーパラメータ調整（GridSearchCV）
print("\n=== Step4: GridSearchCV ===")
from sklearn.model_selection import GridSearchCV

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
