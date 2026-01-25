# Excel構造分析: 001966731.xlsx

## 📋 目次

1. [全体アーキテクチャ](#全体アーキテクチャ)
2. [データフローの仕組み](#データフローの仕組み)
3. [各専門シートの計算ロジック](#各専門シートの計算ロジック)
4. [メイン証明書シートの集計ロジック](#メイン証明書シートの集計ロジック)
5. [重要な制約条件](#重要な制約条件)
6. [アプリケーションへの実装方針](#アプリケーションへの実装方針)

---

## 🏗️ 全体アーキテクチャ

### 9つのシート構成

| # | シート名 | サイズ | 用途 |
|---|---|---|---|
| 1 | 増改築等工事証明書 | 666×67 | メイン証明書シート（全体集計） |
| 2 | 耐震改修 | 31×14 | 耐震改修工事の費用計算 |
| 3 | バリアフリー改修 | 56×24 | バリアフリー改修工事の費用計算 |
| 4 | 省エネ改修 | 56×14 | 省エネ改修工事の費用計算 |
| 5 | 同居対応 | 30×12 | 多世帯同居改修工事の費用計算 |
| 6 | 長期優良住宅化（耐震又は省エネ） | 163×16 | 長期優良住宅化（耐震OR省エネ） |
| 7 | 長期優良住宅化 (耐震及び省エネ) | 163×17 | 長期優良住宅化（耐震AND省エネ） |
| 8 | 子育て対応 | 70×11 | 子育て対応改修工事の費用計算 |
| 9 | その他増改築 | 74×17 | その他の増改築工事（第1号～第6号） |

---

## 🔄 データフローの仕組み

```
【ユーザー入力】
    ↓
【各専門シート】で計算実行
    ├─ 耐震改修シート → 工事費総額(H26), 補助金(H28)を計算
    ├─ バリアフリーシート → 工事費総額(H51), 補助金(H53)を計算
    ├─ 省エネシート → 工事費総額(J51), 補助金(J53)を計算
    ├─ 同居対応シート → 工事費総額(G25), 補助金(G27)を計算
    ├─ 子育て対応シート → 工事費総額(I59), 補助金(I61)を計算
    └─ その他増改築シート → 工事費総額(L39), 補助金(L41)を計算
    ↓
【メイン証明書シート】の行378-460で集計
    ↓ IF関数で各シートの計算結果を参照
    ↓ 補助金を差し引き
    ↓ 控除上限額(250万円/350万円/500万円など)を適用
    ↓ 複数の減税制度の組み合わせを計算
    ↓
【最終控除額】を算出 (行451: ⑰、行459: ㉑など)
```

### データ連携の実例

**メイン証明書シート → 各専門シートへの参照:**

```excel
=IF(耐震改修!H26>0,耐震改修!H26,"")           # 耐震改修の総額を参照
=IF(バリアフリー改修!H51>0,バリアフリー改修!H51,"")  # バリアフリーの総額を参照
=IF(省エネ改修!J51>0,省エネ改修!J51,"")          # 省エネの総額を参照
```

---

## 💡 各専門シートの計算ロジック

### 共通パターン: 標準的費用の計算

すべての専門シートは同じ計算パターンを使用:

```
計算額 = 単位価格 × 数量 × オプション割合(%)
```

**基本計算式:**
```excel
=IF(ISNUMBER(J8), C8*F8*J8, C8*F8)
```

- `C8`: 単位価格（政府が定めた標準単価）
- `F8`: 数量（ユーザー入力・黄色セル）
- `J8`: マンション等の場合の居住割合％（オプション）

---

### 1. 耐震改修シート

**列構成:**

| 列 | 内容 | 例 |
|---|---|---|
| A,B | 工事種別 | 木造基礎、鉄筋コンクリート基礎など |
| C | 単位価格 | ¥15,400/㎡ |
| E | 単位 | ㎡、ｍなど |
| F | **数量入力欄**（黄色セル） | ユーザーが入力 |
| J | 居住割合％（マンション用） | 80%など（オプション） |
| H | 計算金額 | `=IF(ISNUMBER(J8),C8*F8*J8,C8*F8)` |

**集計セル:**

- **Row 26 (H26)**: 工事費総額 `=H8+H10+H12+H14+H16+H18+H20+H22+H24`
- **Row 28 (H28)**: 補助金額（ユーザー入力）

**メイン証明書シートでの参照箇所:**

- `AQ380`: `=IF(耐震改修!H26>0,耐震改修!H26,"")` # 総額
- `AQ382`: `=IF(AQ380>0,IF(耐震改修!H28>0,耐震改修!H28,0),"")` # 補助金

---

### 2. バリアフリー改修シート

**工事カテゴリー（8種類）:**

1. 通路又は出入口の拡幅
2. 階段の勾配の緩和
3. 浴室の改良
4. 便所の改良
5. 手すりの取付
6. 床の段差の解消
7. 出入口の戸の改良
8. 床材の取替

**計算式:** 耐震改修と同様
```excel
=IF(ISNUMBER(J9),C9*F9*J9,C9*F9)
```

**集計セル:**

- **Row 51 (H51)**: 工事費総額
- **Row 53 (H53)**: 補助金額

**メイン証明書シートでの参照箇所:**

- `AQ387`: `=IF(バリアフリー改修!H51>0,バリアフリー改修!H51,"")`
- `AQ389`: `=IF(AQ387>0,IF(バリアフリー改修!H53>0,バリアフリー改修!H53,0),"")`

---

### 3. 省エネ改修シート

**複雑な計算式（窓面積割合も考慮）:**

```excel
=IF(AND(H9>0,L9>0), C9*F9*H9*L9,
  IF(ISNUMBER(H9), C9*F9*H9,
    IF(ISNUMBER(L9), C9*F9*L9, C9*F9)))
```

- `C9`: 単位価格
- `F9`: 数量
- `H9`: 窓面積割合％（窓工事の場合）
- `L9`: 居住割合％（マンション等の場合）

**特記事項:**

- **Row 39 (F39)**: 太陽光発電設備の有無（チェックボックス）
  - この値により控除上限額が変動（250万円 or 350万円）

**集計セル:**

- **Row 51 (J51)**: 工事費総額
- **Row 53 (J53)**: 補助金額

**メイン証明書シートでの参照箇所:**

- `AQ394`: `=IF(省エネ改修!J51>0,省エネ改修!J51,"")`
- `AQ396`: `=IF(AQ394>0,IF(省エネ改修!J53>0,省エネ改修!J53,0),"")`
- `AQ398`: `=IF(ISNUMBER(省エネ改修!F39),IF(増改築等工事証明書!AQ397>=3500000,3500000,...),...)` # 太陽光の有無で上限判定

---

### 4. 同居対応シート

**固定単価での工事項目:**

| 工事種別 | 詳細 | 単価（税込） |
|---|---|---|
| ① 調理室増設 | ミニキッチン | ¥476,100 |
|  | フルキッチン | ¥1,622,000 |
| ② 浴室増設 | 給湯設備有り | ¥1,373,800 |
|  | 給湯設備無し | ¥855,400 |
|  | シャワー専用 | ¥584,100 |
| ③ 便所増設 | - | ¥526,200 |
| ④ 玄関増設 | 地上階 | ¥658,700 |
|  | 地上階以外 | ¥1,254,100 |

**集計セル:**

- **Row 25 (G25)**: 工事費総額
- **Row 27 (G27)**: 補助金額

**メイン証明書シートでの参照箇所:**

- `AQ401`: `=IF(同居対応!G25>0,同居対応!G25,"")`
- `AQ403`: `=IF(AQ401>0,IF(同居対応!G27>0,同居対応!G27,0),"")`

---

### 5. 子育て対応シート

**用途:** 子どもの事故防止・安全対策のための改修工事

**集計セル:**

- **Row 59 (I59)**: 工事費総額
- **Row 61 (I61)**: 補助金額

**メイン証明書シートでの参照箇所:**

- `AQ436`: `=IF(子育て対応!I59>0,子育て対応!I59,"")`
- `AQ438`: `=IF(子育て対応!I59>0,子育て対応!I61,"")`

---

### 6. その他増改築シート

**用途:** 第1号～第6号工事（住宅借入金等特別控除用）の費用入力

**集計セル:**

- **Row 39 (L39)**: 工事費総額 `=Q8+Q14+Q18+Q24+Q30+Q37`
- **Row 41 (L41)**: 補助金額（ユーザー入力）

**メイン証明書シートでの参照箇所:**

- `AQ86`: `=その他増改築!$L$39` # 早期参照（Row 86）
- `AQ88`: `=その他増改築!$L$41`
- `AQ455`: `=IF(その他増改築!L39>0,その他増改築!L39,"")` # 後期参照（Row 455）
- `AQ457`: `=IF(AQ455>0,その他増改築!L41,"")`

---

## 🧮 メイン証明書シートの集計ロジック（行378-460）

### Section: （３）実施した工事の費用の額等

この箇所で全ての専門シートの計算結果を集約し、最終的な控除対象額を算出します。

---

### ① 耐震改修（Row 380-385）

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 380 | ア | `=IF(耐震改修!H26>0,耐震改修!H26,"")` | 工事費総額 |
| 382 | イ | `=IF(AQ380>0,IF(耐震改修!H28>0,耐震改修!H28,0),"")` | 補助金額 |
| 383 | ウ | `=IF(AQ380>0,IF(AQ380-AQ382>0,AQ380-AQ382,0),"")` | 補助金差引後 |
| 384 | エ | `=IF(AQ383>2500000,2500000,AQ383)` | **上限250万円** |
| 385 | オ | `=IF(AQ380>0,IF(AQ383-AQ384>0,AQ383-AQ384,0),"")` | 超過額 |

---

### ② バリアフリー改修（Row 387-392）

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 387 | ア | `=IF(バリアフリー改修!H51>0,バリアフリー改修!H51,"")` | 工事費総額 |
| 389 | イ | `=IF(AQ387>0,IF(バリアフリー改修!H53>0,バリアフリー改修!H53,0),"")` | 補助金額 |
| 390 | ウ | `=IF(AQ387>0,IF(AQ387-AQ389>500000,AQ387-AQ389,0),"")` | **50万円超の場合のみ** |
| 391 | エ | `=IF(AQ390>2000000,2000000,AQ390)` | **上限200万円** |
| 392 | オ | `=IF(AQ387>0,IF(AQ390-AQ391>0,AQ390-AQ391,0),"")` | 超過額 |

---

### ③ 省エネ改修（Row 394-399）

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 394 | ア | `=IF(省エネ改修!J51>0,省エネ改修!J51,"")` | 工事費総額 |
| 396 | イ | `=IF(AQ394>0,IF(省エネ改修!J53>0,省エネ改修!J53,0),"")` | 補助金額 |
| 397 | ウ | `=IF(AQ394>0,IF(AQ394-AQ396>500000,AQ394-AQ396,0),"")` | **50万円超の場合のみ** |
| 398 | エ | `=IF(ISNUMBER(省エネ改修!F39),IF(AQ397>=3500000,3500000,AQ397),IF(AQ397>=2500000,2500000,AQ397))` | **太陽光有=350万円、無=250万円** |
| 399 | オ | `=IF(AQ394>0,IF(AQ397-AQ398>0,AQ397-AQ398,0),"")` | 超過額 |

---

### ④ 同居対応（Row 401-406）

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 401 | ア | `=IF(同居対応!G25>0,同居対応!G25,"")` | 工事費総額 |
| 403 | イ | `=IF(AQ401>0,IF(同居対応!G27>0,同居対応!G27,0),"")` | 補助金額 |
| 404 | ウ | `=IF(AQ401>0,IF(AQ401-AQ403>500000,AQ401-AQ403,0),"")` | **50万円超の場合のみ** |
| 405 | エ | `=IF(AQ404>=2500000,2500000,AQ404)` | **上限250万円** |
| 406 | オ | `=IF(AQ401>0,IF(AQ404-AQ405>0,AQ404-AQ405,0),"")` | 超過額 |

---

### ⑦ 子育て対応（Row 436-441）

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 436 | ア | `=IF(子育て対応!I59>0,子育て対応!I59,"")` | 工事費総額 |
| 438 | イ | `=IF(子育て対応!I59>0,子育て対応!I61,"")` | 補助金額 |
| 439 | ウ | `=IF(AQ436>0,IF(AQ436-AQ438>500000,AQ436-AQ438,0),"")` | **50万円超の場合のみ** |
| 440 | エ | `=IF(AQ436>0,IF(AQ439>=2500000,2500000,AQ439),"")` | **上限250万円** |
| 441 | オ | `=IF(AQ439>0,IF(AQ439-AQ440>0,AQ439-AQ440,0),"")` | 超過額 |

---

### 複数制度の組み合わせ計算（Row 442-453）

複数の減税制度を利用する場合、最も有利な組み合わせを自動選択します。

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 442 | ⑧ | `=IF(AQ383+AQ390+AQ397+AQ404+AQ439>0,AQ383+AQ390+AQ397+AQ404+AQ439,"")` | 全制度の合計（ウの合計） |
| 443 | ⑨ | `=IF(AQ384+AQ391+AQ398+AQ405+AQ440>0,AQ384+AQ391+AQ398+AQ405+AQ440,"")` | 全制度の控除額合計（エの合計） |
| 444 | ⑩ | `=IF(AQ385+AQ392+AQ399+AQ406+AQ441>0,AQ385+AQ392+AQ399+AQ406+AQ441,"")` | 全制度の超過額合計（オの合計） |
| 445 | ⑪ | `=IF(AQ390+AQ404+AQ416+AQ439>0,AQ390+AQ404+AQ416+AQ439,"")` | 組み合わせパターンA（長期優良OR含む） |
| 446 | ⑫ | `=IF(AQ391+AQ405+AQ417+AQ440>0,AQ391+AQ405+AQ417+AQ440,"")` | パターンAの控除額 |
| 447 | ⑬ | `=IF(AQ392+AQ406+AQ418+AQ441>0,AQ392+AQ406+AQ418+AQ441,"")` | パターンAの超過額 |
| 448 | ⑭ | `=IF(AQ390+AQ404+AQ432+AQ439>0,AQ390+AQ404+AQ432+AQ439,"")` | 組み合わせパターンB（長期優良AND含む） |
| 449 | ⑮ | `=IF(AQ391+AQ405+AQ433+AQ440>0,AQ391+AQ405+AQ433+AQ440,"")` | パターンBの控除額 |
| 450 | ⑯ | `=IF(AQ392+AQ406+AQ434+AQ441>0,AQ392+AQ406+AQ434+AQ441,"")` | パターンBの超過額 |
| **451** | **⑰** | `=IF(OR(AQ443>0,AQ446>0,AQ449>0),MAX(AQ443,AQ446,AQ449),"")` | **最大控除額（10%控除分）** |
| 452 | ⑱ | `=IF(OR(AQ442>0,AQ445>0,AQ448>0),MAX(AQ442,AQ445,AQ448),"")` | 最大工事費 |
| 453 | ⑲ | `=IF(OR(AQ444>0,AQ447>0,AQ450>0),MAX(AQ444,AQ447,AQ450),"")` | ⑱に対応する超過額 |

---

### その他増改築との合算（Row 455-460）

| Row | 項目 | 計算式 | 説明 |
|---|---|---|---|
| 455 | ⑳ア | `=IF(その他増改築!L39>0,その他増改築!L39,"")` | 第1-6号工事費 |
| 457 | ⑳イ | `=IF(AQ455>0,その他増改築!L41,"")` | 補助金額 |
| 458 | ⑳ウ | `=IF(AQ455>0,IF(AQ455-AQ457>0,AQ455-AQ457,0),"")` | 補助金差引後 |
| **459** | **㉑** | `=IF(OR(AQ452>0,AQ453+AQ458>0),MIN(AQ452,AQ453+AQ458),"")` | **最終控除対象額** |
| 460 | ㉒ | `=IF(AQ451>0,IF(10000000-AQ451>0,10000000-AQ451,0),"")` | 残り控除可能額 |

---

## 🎯 重要な制約条件

### 1. 最低工事費要件

**バリアフリー、省エネ、同居対応、子育て対応**は**50万円超**が必須:

```excel
=IF(ア-イ > 500000, ア-イ, 0)
```

工事費から補助金を差し引いた額が50万円以下の場合、控除対象外となります。

---

### 2. 控除上限額

| 改修工事種別 | 上限額 | 参照セル |
|---|---|---|
| 耐震改修 | 250万円 | AQ384 |
| バリアフリー改修 | 200万円 | AQ391 |
| 省エネ改修（太陽光無） | 250万円 | AQ398 |
| 省エネ改修（太陽光有） | **350万円** | AQ398 |
| 同居対応改修 | 250万円 | AQ405 |
| 子育て対応改修 | 250万円 | AQ440 |
| 長期優良（耐震OR省エネ、太陽光無） | 250万円 | AQ417 |
| 長期優良（耐震OR省エネ、太陽光有） | **350万円** | AQ417 |
| 長期優良（耐震AND省エネ、太陽光無） | **500万円** | AQ433 |
| 長期優良（耐震AND省エネ、太陽光有） | **600万円** | AQ433 |

---

### 3. 総合上限額

最終的な控除対象額（10%控除分）は**1,000万円**が上限:

- Row 451 (AQ451): `⑰` が1,000万円を超える場合でも、1,000万円までしか控除できない
- Row 460 (AQ460): `㉒ = MAX(0, 10,000,000 - ⑰)` で残り枠を計算

---

### 4. 太陽光発電設備の影響

省エネ改修シートの**Row 39 (F39)** に太陽光発電設備の有無を入力:

- **有り（ISNUMBER(F39)=TRUE）**: 控除上限が250万円 → 350万円に拡大
- **無し**: 控除上限は250万円

この判定は以下の箇所で使用:

- Row 398 (省エネ改修の上限判定)
- Row 417 (長期優良OR の上限判定)
- Row 433 (長期優良AND の上限判定)

---

## 📝 アプリケーションへの実装方針

### 現状の実装範囲

現在のPrismaスキーマは**Category 1（住宅借入金等特別控除）**のみ対応:

```prisma
model HousingLoanDetail {
  id               String      @id @default(cuid())
  certificateId    String      @unique
  workTypes        Json        // 第1-6号工事種別
  workDescription  String?     // 工事内容説明
  totalCost        Decimal     @db.Decimal(12, 0)
  hasSubsidy       Boolean     @default(false)
  subsidyAmount    Decimal     @db.Decimal(12, 0) @default(0)
  deductibleAmount Decimal     @db.Decimal(12, 0)
  certificate      Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)
}
```

---

### 必要な拡張: Category 3（住宅特定改修特別税額控除）

#### Prismaスキーマの拡張案

```prisma
model Certificate {
  // ... 既存フィールド

  // Category 3用の追加リレーション
  seismicRenovation      SeismicRenovation?
  barrierFreeRenovation  BarrierFreeRenovation?
  energyRenovation       EnergyRenovation?
  cohabitationRenovation CohabitationRenovation?
  childcareRenovation    ChildcareRenovation?
  longTermHousing        LongTermHousing?
  otherRenovation        OtherRenovation?
}

// 耐震改修
model SeismicRenovation {
  id            String      @id @default(cuid())
  certificateId String      @unique
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  workItems     Json        // 工事項目と数量の配列: [{type, unitPrice, quantity, residentRatio?}]
  totalCost     Decimal     @db.Decimal(12, 0)  // H26
  subsidyAmount Decimal     @db.Decimal(12, 0)  // H28
  deductibleAmount Decimal  @db.Decimal(12, 0)  // 計算結果（ウ）
  maxDeduction  Decimal     @db.Decimal(12, 0)  // エ (250万円上限適用後)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// バリアフリー改修
model BarrierFreeRenovation {
  id            String      @id @default(cuid())
  certificateId String      @unique
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  workItems     Json        // 工事項目と数量の配列
  totalCost     Decimal     @db.Decimal(12, 0)  // H51
  subsidyAmount Decimal     @db.Decimal(12, 0)  // H53
  deductibleAmount Decimal  @db.Decimal(12, 0)  // ウ (50万円超の場合)
  maxDeduction  Decimal     @db.Decimal(12, 0)  // エ (200万円上限適用後)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 省エネ改修
model EnergyRenovation {
  id                  String      @id @default(cuid())
  certificateId       String      @unique
  certificate         Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  workItems           Json        // 工事項目と数量の配列
  hasSolarPanel       Boolean     @default(false)  // F39: 太陽光発電設備の有無
  totalCost           Decimal     @db.Decimal(12, 0)  // J51
  subsidyAmount       Decimal     @db.Decimal(12, 0)  // J53
  deductibleAmount    Decimal     @db.Decimal(12, 0)  // ウ (50万円超の場合)
  maxDeduction        Decimal     @db.Decimal(12, 0)  // エ (250万円 or 350万円)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 同居対応改修
model CohabitationRenovation {
  id            String      @id @default(cuid())
  certificateId String      @unique
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  workItems     Json        // 工事項目（調理室、浴室、便所、玄関）
  totalCost     Decimal     @db.Decimal(12, 0)  // G25
  subsidyAmount Decimal     @db.Decimal(12, 0)  // G27
  deductibleAmount Decimal  @db.Decimal(12, 0)  // ウ (50万円超の場合)
  maxDeduction  Decimal     @db.Decimal(12, 0)  // エ (250万円上限適用後)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 子育て対応改修
model ChildcareRenovation {
  id            String      @id @default(cuid())
  certificateId String      @unique
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  workItems     Json        // 工事項目と数量の配列
  totalCost     Decimal     @db.Decimal(12, 0)  // I59
  subsidyAmount Decimal     @db.Decimal(12, 0)  // I61
  deductibleAmount Decimal  @db.Decimal(12, 0)  // ウ (50万円超の場合)
  maxDeduction  Decimal     @db.Decimal(12, 0)  // エ (250万円上限適用後)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// その他増改築（第1-6号工事）
model OtherRenovation {
  id            String      @id @default(cuid())
  certificateId String      @unique
  certificate   Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)

  work1         Boolean     @default(false)  // 第1号工事
  work2         Boolean     @default(false)  // 第2号工事
  work3         Boolean     @default(false)  // 第3号工事
  work4         Boolean     @default(false)  // 第4号工事
  work5         Boolean     @default(false)  // 第5号工事
  work6         Boolean     @default(false)  // 第6号工事

  totalCost     Decimal     @db.Decimal(12, 0)  // L39
  subsidyAmount Decimal     @db.Decimal(12, 0)  // L41
  deductibleAmount Decimal  @db.Decimal(12, 0)  // ウ

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### 計算ロジックの実装

`/src/lib/renovationCalculator.ts` を新規作成:

```typescript
/**
 * 改修工事の控除額計算ユーティリティ
 * Excel構造（001966731.xlsx）の計算ロジックを実装
 */

interface WorkItem {
  type: string;
  unitPrice: number;
  quantity: number;
  residentRatio?: number;  // マンション等の居住割合（0.0-1.0）
  windowAreaRatio?: number; // 窓面積割合（省エネ改修用、0.0-1.0）
}

/**
 * 耐震改修の控除額を計算
 * 参照: 耐震改修シート H26, H28
 */
export function calculateSeismicRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): {
  totalCost: number;
  deductibleAmount: number;  // ウ
  maxDeduction: number;       // エ (250万円上限)
} {
  // 各工事項目の計算: 単位価格 × 数量 × 居住割合
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  // 補助金差引後 (ウ = ア - イ)
  const afterSubsidy = totalCost - subsidyAmount;
  const deductibleAmount = Math.max(0, afterSubsidy);

  // 250万円上限適用 (エ = MIN(ウ, 2,500,000))
  const maxDeduction = Math.min(deductibleAmount, 2_500_000);

  return { totalCost, deductibleAmount, maxDeduction };
}

/**
 * バリアフリー改修の控除額を計算
 * 参照: バリアフリー改修シート H51, H53
 */
export function calculateBarrierFreeRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): {
  totalCost: number;
  deductibleAmount: number;  // ウ (50万円超の場合のみ)
  maxDeduction: number;       // エ (200万円上限)
} {
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // 50万円超の場合のみ対象 (ウ = (ア-イ > 500,000) ? ア-イ : 0)
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // 200万円上限適用 (エ = MIN(ウ, 2,000,000))
  const maxDeduction = Math.min(deductibleAmount, 2_000_000);

  return { totalCost, deductibleAmount, maxDeduction };
}

/**
 * 省エネ改修の控除額を計算
 * 参照: 省エネ改修シート J51, J53, F39
 */
export function calculateEnergyRenovation(
  workItems: WorkItem[],
  subsidyAmount: number,
  hasSolarPanel: boolean  // 太陽光発電設備の有無
): {
  totalCost: number;
  deductibleAmount: number;  // ウ (50万円超の場合のみ)
  maxDeduction: number;       // エ (250万円 or 350万円)
} {
  const totalCost = workItems.reduce((sum, item) => {
    const residentRatio = item.residentRatio ?? 1.0;
    const windowRatio = item.windowAreaRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * residentRatio * windowRatio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // 50万円超の場合のみ対象
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // 太陽光有=350万円、無=250万円
  const limit = hasSolarPanel ? 3_500_000 : 2_500_000;
  const maxDeduction = Math.min(deductibleAmount, limit);

  return { totalCost, deductibleAmount, maxDeduction };
}

/**
 * 同居対応改修の控除額を計算
 * 参照: 同居対応シート G25, G27
 */
export function calculateCohabitationRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): {
  totalCost: number;
  deductibleAmount: number;  // ウ (50万円超の場合のみ)
  maxDeduction: number;       // エ (250万円上限)
} {
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;
  const maxDeduction = Math.min(deductibleAmount, 2_500_000);

  return { totalCost, deductibleAmount, maxDeduction };
}

/**
 * 子育て対応改修の控除額を計算
 * 参照: 子育て対応シート I59, I61
 */
export function calculateChildcareRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): {
  totalCost: number;
  deductibleAmount: number;  // ウ (50万円超の場合のみ)
  maxDeduction: number;       // エ (250万円上限)
} {
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;
  const maxDeduction = Math.min(deductibleAmount, 2_500_000);

  return { totalCost, deductibleAmount, maxDeduction };
}

/**
 * 複数制度の最適な組み合わせを計算
 * 参照: メイン証明書シート Row 442-453
 */
export function calculateOptimalCombination(renovations: {
  seismic?: { deductibleAmount: number; maxDeduction: number };
  barrierFree?: { deductibleAmount: number; maxDeduction: number };
  energy?: { deductibleAmount: number; maxDeduction: number };
  cohabitation?: { deductibleAmount: number; maxDeduction: number };
  childcare?: { deductibleAmount: number; maxDeduction: number };
}): {
  totalDeductible: number;    // ⑱ 最大工事費
  maxControlAmount: number;   // ⑰ 最大控除額（10%控除分）
  excessAmount: number;       // ⑲ 超過額
  remaining: number;          // ㉒ 残り控除可能額
} {
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  // 各制度のウ、エ、オを抽出
  const allDeductible = [
    renovations.seismic?.deductibleAmount ?? 0,
    renovations.barrierFree?.deductibleAmount ?? 0,
    renovations.energy?.deductibleAmount ?? 0,
    renovations.cohabitation?.deductibleAmount ?? 0,
    renovations.childcare?.deductibleAmount ?? 0,
  ];

  const allMaxDeduction = [
    renovations.seismic?.maxDeduction ?? 0,
    renovations.barrierFree?.maxDeduction ?? 0,
    renovations.energy?.maxDeduction ?? 0,
    renovations.cohabitation?.maxDeduction ?? 0,
    renovations.childcare?.maxDeduction ?? 0,
  ];

  const allExcess = allDeductible.map((d, i) => d - allMaxDeduction[i]);

  // ⑧、⑨、⑩ の計算
  const pattern1_total = sum(allDeductible);
  const pattern1_max = sum(allMaxDeduction);
  const pattern1_excess = sum(allExcess);

  // TODO: 長期優良住宅化の組み合わせパターンも実装

  // 現時点では単純合計（パターン1のみ）
  const totalDeductible = pattern1_total;
  const maxControlAmount = pattern1_max;
  const excessAmount = pattern1_excess;

  // 1,000万円上限
  const finalMax = Math.min(maxControlAmount, 10_000_000);
  const remaining = Math.max(0, 10_000_000 - finalMax);

  return {
    totalDeductible,
    maxControlAmount: finalMax,
    excessAmount,
    remaining,
  };
}
```

---

### UI設計案

#### 目的選択フロー

```
/certificates/new
  ↓
【今回の目的は？】
├─ 住宅借入金等特別控除（10年以上のローン）
│   → /certificates/new?category=1
│   → HousingLoanDetailの入力フォーム
│
└─ 住宅特定改修特別税額控除（ローン無し、または5年以上ローン）
    → /certificates/new?category=3
    → 改修種別の複数選択
        ☑ 耐震改修
        ☑ バリアフリー改修
        ☑ 省エネ改修
        ☑ 同居対応改修
        ☑ 子育て対応改修
        ☑ その他増改築

    → 各選択した種別の詳細入力画面
       （工事項目、数量、補助金額など）

    → 自動計算により最適な組み合わせを提示
       「最大控除額: XXX万円（⑰）」
       「控除対象工事費: XXX万円（⑱）」
```

---

## 🔍 参照クイックリファレンス

### 各シートの重要セル一覧

| シート名 | 総額セル | 補助金セル | 特記事項 |
|---|---|---|---|
| 耐震改修 | H26 | H28 | - |
| バリアフリー改修 | H51 | H53 | 50万円超要件 |
| 省エネ改修 | J51 | J53 | F39=太陽光の有無 |
| 同居対応 | G25 | G27 | 50万円超要件 |
| 子育て対応 | I59 | I61 | 50万円超要件 |
| その他増改築 | L39 | L41 | 第1-6号工事 |

### メイン証明書シートの重要行

| Row | 内容 | 用途 |
|---|---|---|
| 378 | セクションヘッダー | （３）実施した工事の費用の額等 |
| 380-385 | 耐震改修 | ア～オの計算 |
| 387-392 | バリアフリー改修 | ア～オの計算 |
| 394-399 | 省エネ改修 | ア～オの計算 |
| 401-406 | 同居対応 | ア～オの計算 |
| 436-441 | 子育て対応 | ア～オの計算 |
| 442-453 | 組み合わせ計算 | ⑧～⑲ |
| **451** | **⑰ 最大控除額** | **10%控除分（上限1000万円）** |
| 455-458 | その他増改築 | ⑳ア～⑳ウ |
| **459** | **㉑ 最終控除対象額** | **⑱とその他増改築の合算** |
| 460 | ㉒ 残り控除可能額 | 1000万円 - ⑰ |

---

## 📌 まとめ

### Excel構造の本質

1. **入力 → 計算 → 集約** の3層構造
2. **各専門シート**で標準単価×数量の計算を実行
3. **メイン証明書シート**で全てを集約し、補助金差引・上限適用・組み合わせ最適化を実施
4. **制約条件**（50万円超、各上限額、総合上限1000万円）を厳格に適用

### 実装の優先順位

1. **Phase 1**: Category 1（住宅借入金等特別控除）の完成 ← **現在ここ**
2. **Phase 2**: Category 3の基本実装（耐震、バリアフリー、省エネ、同居、子育て）
3. **Phase 3**: 長期優良住宅化の実装
4. **Phase 4**: 複雑な組み合わせ最適化の実装

---

**最終更新日:** 2026-01-25
**分析対象ファイル:** `/Users/dw1003/Downloads/001966731.xlsx`
**作成者:** Claude Code
**参照方法:** 「Excel構造を思い出して」と指示
