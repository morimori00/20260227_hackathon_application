"""Compare 5 traditional classifiers with saved XGBoost model for AML detection."""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import time
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, accuracy_score,
    f1_score, precision_score, recall_score
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import LinearSVC
from xgboost import XGBClassifier
from imblearn.under_sampling import RandomUnderSampler
import joblib
import warnings
warnings.filterwarnings('ignore')

# ── Load and preprocess (same as original notebook) ──────────────────────────
print("Loading data...")
df = pd.read_csv(
    "/root/.cache/kagglehub/datasets/ealtman2019/"
    "ibm-transactions-for-anti-money-laundering-aml/versions/8/HI-Small_Trans.csv"
)
df.drop_duplicates(inplace=True)
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df['Week'] = df['Timestamp'].dt.day_name()
df.drop(['Timestamp'], axis=1, inplace=True)
df['From Bank'] = df['From Bank'].astype(str)
df['To Bank'] = df['To Bank'].astype(str)

X = df.drop(['Is Laundering'], axis=1)
y = df['Is Laundering']

cat = ['From Bank', 'Account', 'To Bank',
       'Receiving Currency', 'Payment Currency', 'Payment Format', 'Week']

print(f"Dataset: {X.shape[0]:,} rows x {X.shape[1]} columns")
print(f"  Normal:     {(y==0).sum():>10,} ({(y==0).mean()*100:.2f}%)")
print(f"  Laundering: {(y==1).sum():>10,} ({(y==1).mean()*100:.2f}%)")

# ── Undersample and split ────────────────────────────────────────────────────
print("\nUndersampling and splitting...")
rus = RandomUnderSampler(random_state=42)
X_s, y_s = rus.fit_resample(X, y)

X_train, X_test, y_train, y_test = train_test_split(
    X_s, y_s, test_size=0.3, random_state=42
)
print(f"After undersampling: {len(X_s):,} balanced samples")
print(f"Train: {len(X_train):,} | Test: {len(X_test):,}")


# ── Train 5 classifiers + retrained XGBoost ──────────────────────────────────
def build_pipeline(estimator):
    """Build sklearn pipeline: OneHotEncoder + estimator (same as original)."""
    ohe = Pipeline([('Encoder', OneHotEncoder(drop='first', handle_unknown='ignore'))])
    transformer = ColumnTransformer([('OHE', ohe, cat)])
    return Pipeline([("Transformer", transformer), ("Estimator", estimator)])


classifiers = {
    'Logistic Regression': LogisticRegression(max_iter=2000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Decision Tree': DecisionTreeClassifier(random_state=42),
    'KNN (k=5)': KNeighborsClassifier(n_neighbors=5),
    'SVM (Linear)': LinearSVC(max_iter=5000, random_state=42, dual='auto'),
    'XGBoost (Retrained)': XGBClassifier(random_state=42, eval_metric='logloss'),
}

results = []
predictions = {}

print("\n── Training Models ──")
for name, clf in classifiers.items():
    pipe = build_pipeline(clf)
    t0 = time.time()
    pipe.fit(X_train, y_train)
    elapsed = time.time() - t0
    y_pred = pipe.predict(X_test)
    predictions[name] = y_pred

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, pos_label=1)
    rec = recall_score(y_test, y_pred, pos_label=1)
    f1 = f1_score(y_test, y_pred, pos_label=1)

    results.append({
        'Model': name, 'Accuracy': acc,
        'Precision': prec, 'Recall': rec, 'F1': f1,
        'Train Time (s)': round(elapsed, 2),
    })
    print(f"  [{elapsed:6.1f}s] {name:25s} | F1={f1:.4f}")

# ── Evaluate saved XGBoost model ─────────────────────────────────────────────
print("\n── Saved Model ──")
saved_model = joblib.load('saved_model/aml_pipeline.joblib')
y_pred_saved = saved_model.predict(X_test)
predictions['XGBoost (Saved)'] = y_pred_saved

acc = accuracy_score(y_test, y_pred_saved)
prec = precision_score(y_test, y_pred_saved, pos_label=1)
rec = recall_score(y_test, y_pred_saved, pos_label=1)
f1 = f1_score(y_test, y_pred_saved, pos_label=1)

results.append({
    'Model': 'XGBoost (Saved)', 'Accuracy': acc,
    'Precision': prec, 'Recall': rec, 'F1': f1,
    'Train Time (s)': '-',
})
print(f"  XGBoost (Saved)             | F1={f1:.4f}")
print("  Note: Trained on a different undersample split.")

# ── Results table ─────────────────────────────────────────────────────────────
results_df = (pd.DataFrame(results)
              .sort_values('F1', ascending=False)
              .reset_index(drop=True))
results_df.index += 1
results_df.index.name = 'Rank'

print("\n\n══════════════════════════════════════════════════════")
print("  MODEL COMPARISON RESULTS (sorted by F1 score)")
print("══════════════════════════════════════════════════════")
print(results_df.to_string())

# ── Visualization ─────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Left: grouped bar chart
metrics_cols = ['Accuracy', 'Precision', 'Recall', 'F1']
x = np.arange(len(results_df))
width = 0.2
for i, m in enumerate(metrics_cols):
    axes[0].bar(x + i * width, results_df[m], width, label=m)
axes[0].set_ylabel('Score')
axes[0].set_title('All Metrics by Model')
axes[0].set_xticks(x + width * 1.5)
axes[0].set_xticklabels(results_df['Model'], rotation=35, ha='right', fontsize=9)
axes[0].legend(fontsize=9)
axes[0].set_ylim(0, 1.15)
axes[0].grid(axis='y', alpha=0.3)

# Right: F1 horizontal bar
colors = ['#4CAF50' if 'XGBoost' in m else '#2196F3' for m in results_df['Model']]
bars = axes[1].barh(results_df['Model'], results_df['F1'], color=colors)
axes[1].set_xlabel('F1 Score (Laundering Class)')
axes[1].set_title('F1 Score Ranking')
axes[1].set_xlim(0, 1.15)
axes[1].grid(axis='x', alpha=0.3)
for bar, val in zip(bars, results_df['F1']):
    axes[1].text(val + 0.01, bar.get_y() + bar.get_height() / 2,
                 f'{val:.4f}', va='center', fontsize=10)

plt.tight_layout()
plt.savefig('model_comparison.png', dpi=150, bbox_inches='tight')
print("\nChart saved to model_comparison.png")

# ── Detailed classification reports ───────────────────────────────────────────
for name in results_df['Model']:
    print(f"\n{'='*55}")
    print(f"  {name}")
    print(f"{'='*55}")
    print(classification_report(
        y_test, predictions[name],
        target_names=['Normal', 'Laundering']
    ))
