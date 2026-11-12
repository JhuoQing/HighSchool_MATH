/* ===== 全站資料：單元、課綱冊別、考試範圍、遊戲、工具 ===== */

/* tracks：g10=高一必修、A=高二數A、B=高二數B、甲=選修數學甲、乙=選修數學乙 */
const UNITS = [
  { key:"polynomial", icon:"📈", title:"多項式函數", desc:"係數如何決定圖形？根與交點的對應", grade:"高一", tracks:["g10"], c:"#5b8def" },
  { key:"explog",     icon:"🚀", title:"指數與對數", desc:"指數成長有多快？對數為什麼能壓縮數字", grade:"高一・高二", tracks:["g10","A","B"], c:"#8b6ef3" },
  { key:"linecircle", icon:"⭕", title:"直線與圓", desc:"斜率、距離、直線與圓的三種位置關係", grade:"高一", tracks:["g10"], c:"#38bdf8" },
  { key:"sequence",   icon:"🔢", title:"數列與級數", desc:"等差、等比與無窮級數的收斂", grade:"高一", tracks:["g10"], c:"#22d3ee" },
  { key:"statistics", icon:"📊", title:"數據分析", desc:"拖曳資料點，看相關係數與回歸線變化", grade:"高一", tracks:["g10"], c:"#e879f9" },
  { key:"probability",icon:"🎲", title:"排列組合與機率", desc:"用上萬次模擬驗證機率的預言", grade:"高一", tracks:["g10"], c:"#fb7185" },
  { key:"trig",       icon:"🌊", title:"三角函數", desc:"單位圓轉一圈，正弦波就畫出來了", grade:"高一・高二", tracks:["g10","A","B"], c:"#2dd4bf" },
  { key:"vector",     icon:"➡️", title:"平面向量", desc:"拖曳向量，看懂加法、內積與投影", grade:"高二", tracks:["A","B"], c:"#3ecf8e" },
  { key:"spacevector",icon:"🧊", title:"空間向量", desc:"旋轉 3D 視角，看懂空間坐標與外積", grade:"高二", tracks:["A"], c:"#60a5fa", is3d:true },
  { key:"spaceplane", icon:"🛩️", title:"空間中的平面與直線", desc:"法向量決定平面；直線何時穿過平面？", grade:"高二", tracks:["A"], c:"#a78bfa", is3d:true },
  { key:"matrix",     icon:"🔳", title:"矩陣與線性變換", desc:"一個 2×2 矩陣如何旋轉、鏡射、推移整個平面", grade:"高二", tracks:["A","B"], c:"#f59e0b" },
  { key:"bayes",      icon:"🧪", title:"條件機率與貝氏定理", desc:"檢驗陽性就真的生病嗎？用面積圖破解直覺陷阱", grade:"高二", tracks:["A","B"], c:"#f472b6" },
  { key:"conics",     icon:"🪐", title:"圓錐曲線", desc:"拖動焦點，看橢圓與雙曲線如何誕生", grade:"高二・高三", tracks:["B","甲"], c:"#f5a623" },
  { key:"calculus",   icon:"🔬", title:"極限與微分", desc:"割線慢慢靠近，切線就出現了", grade:"高三", tracks:["甲","乙"], c:"#f87171" },
  { key:"integral",   icon:"📐", title:"積分", desc:"矩形越切越細，面積就被「逼」出來了", grade:"高三", tracks:["甲","乙"], c:"#fb923c" },
  { key:"complex",    icon:"🌀", title:"複數平面", desc:"複數相乘 = 長度相乘、角度相加", grade:"高三", tracks:["甲","乙"], c:"#c084fc" },
  { key:"binomial",   icon:"🎯", title:"二項分布", desc:"調整 n 與 p，看分布的形狀、期望值與標準差", grade:"高三", tracks:["甲","乙"], c:"#4ade80" },
  { key:"linprog",    icon:"🧭", title:"線性規劃", desc:"推動目標函數直線，在可行解區域找最佳解", grade:"高三", tracks:["乙"], c:"#facc15" },
];

const GAMES = [
  { key:"game24",   icon:"🃏", title:"24 點挑戰", desc:"四個數字、加減乘除，湊出 24。含需要分數才解得開的魔王題", level:"中等～困難", c:"#f59e0b" },
  { key:"shooter",  icon:"🎯", title:"函數打靶", desc:"不能預覽！算出參數再發射，讓曲線一次穿過所有靶心", level:"困難", c:"#ef4444" },
  { key:"vectornav",icon:"🚀", title:"向量迷航", desc:"只能用指定向量移動，在燃料耗盡前避開隕石抵達目標", level:"中等～困難", c:"#3b82f6" },
  { key:"matrixpuzzle", icon:"🧩", title:"矩陣變形師", desc:"用旋轉、鏡射、推移的組合，把圖形變成目標形狀", level:"困難", c:"#a855f7" },
  { key:"speed",    icon:"⚡", title:"極速心算", desc:"60 秒限時：對數、三角、微分、組合……連擊加倍得分", level:"中等", c:"#10b981" },
];

const TOOLS = [
  { key:"grapher",  icon:"🖊️", title:"函數繪圖計算機", desc:"輸入任意函數即時繪圖，可拖曳平移、滾輪縮放、同時比較多條曲線", c:"#38bdf8" },
  { key:"formulas", icon:"📒", title:"公式速查表", desc:"全單元重點公式一頁收齊，支援關鍵字搜尋", c:"#f472b6" },
];

/* 課綱冊別 → 章節 → 對應單元（各版本教科書章節順序略有不同） */
const BOOKS = [
  { id:"b1", name:"數學 1", grade:"高一上", chapters:[
    { t:"數與式（實數、絕對值、乘法公式）", units:[] },
    { t:"指數與常用對數", units:["explog"] },
    { t:"多項式函數", units:["polynomial"] },
    { t:"直線與圓", units:["linecircle"] },
  ]},
  { id:"b2", name:"數學 2", grade:"高一下", chapters:[
    { t:"數列與級數", units:["sequence"] },
    { t:"數據分析", units:["statistics"] },
    { t:"排列、組合與機率", units:["probability"] },
    { t:"三角比", units:["trig"] },
  ]},
  { id:"b3a", name:"數學 3A", grade:"高二上", chapters:[
    { t:"三角函數（弧度、圖形、和角公式）", units:["trig"] },
    { t:"指數與對數函數", units:["explog"] },
    { t:"平面向量（內積、面積與行列式）", units:["vector"] },
  ]},
  { id:"b4a", name:"數學 4A", grade:"高二下", chapters:[
    { t:"空間向量（空間坐標、內積、外積）", units:["spacevector"] },
    { t:"空間中的平面與直線", units:["spaceplane"] },
    { t:"條件機率與貝氏定理", units:["bayes"] },
    { t:"矩陣（運算、反方陣、線性變換）", units:["matrix"] },
  ]},
  { id:"b3b", name:"數學 3B", grade:"高二上", chapters:[
    { t:"弧度量與週期性數學模型（正弦函數）", units:["trig"] },
    { t:"按比例成長模型（指數與對數函數）", units:["explog"] },
    { t:"平面向量（線性組合、正射影與內積）", units:["vector"] },
    { t:"平面上的比例", units:[] },
  ]},
  { id:"b4b", name:"數學 4B", grade:"高二下", chapters:[
    { t:"空間概念（空間坐標、球面經緯線）", units:["spacevector"] },
    { t:"條件機率與貝氏定理", units:["bayes"] },
    { t:"矩陣與資料表格", units:["matrix"] },
    { t:"圓錐曲線（圓錐截痕）", units:["conics"] },
  ]},
  { id:"ja", name:"選修數學甲", grade:"高三", chapters:[
    { t:"（上）極限與函數", units:["sequence","calculus"] },
    { t:"（上）微分", units:["calculus"] },
    { t:"（上）積分", units:["integral"] },
    { t:"（下）分布與統計（離散型隨機變數、二項分布）", units:["binomial"] },
    { t:"（下）複數平面", units:["complex"] },
    { t:"（下）二次曲線", units:["conics"] },
  ]},
  { id:"yi", name:"選修數學乙", grade:"高三", chapters:[
    { t:"（上）極限與函數", units:["sequence","calculus"] },
    { t:"（上）微分", units:["calculus"] },
    { t:"（上）積分", units:["integral"] },
    { t:"（下）分布與統計（離散型隨機變數、二項分布）", units:["binomial"] },
    { t:"（下）複數平面", units:["complex"] },
    { t:"（下）線性規劃", units:["linprog"] },
  ]},
];

/* 大考範圍。filter(u) 回傳該單元是否在範圍內 */
const EXAMS = [
  { id:"gsatA", name:"學測 數學A", when:"高三上學期末（1 月）", c:"#5b8def",
    scope:["數學 1、2（高一必修）","數學 3A、4A（高二數A）"],
    who:"理工、醫藥、資訊及部分商管學系多參採",
    filter:u => u.tracks.includes("g10") || u.tracks.includes("A") },
  { id:"gsatB", name:"學測 數學B", when:"高三上學期末（1 月）", c:"#3ecf8e",
    scope:["數學 1、2（高一必修）","數學 3B、4B（高二數B）"],
    who:"文、法、社會科學、藝術設計學系多參採",
    filter:u => u.tracks.includes("g10") || u.tracks.includes("B") },
  { id:"astJia", name:"分科測驗 數學甲", when:"高三畢業後（7 月）", c:"#f5a623",
    scope:["數學 1、2","數學 3A、4A","選修數學甲（上）（下）"],
    who:"高數學需求學系（理工、資訊、醫藥等）",
    filter:u => u.tracks.includes("g10") || u.tracks.includes("A") || u.tracks.includes("甲") },
  { id:"astYi", name:"分科測驗 數學乙", when:"高三畢業後（7 月）", c:"#f472b6",
    scope:["數學 1、2","第 3、4 冊中數A、數B 共同的內容","選修數學乙（上）（下）"],
    who:"商管、財經、社會科學等學系",
    filter:u => u.tracks.includes("g10") || (u.tracks.includes("A") && u.tracks.includes("B")) || u.tracks.includes("乙") },
];
