/* ===== 主題切換 ===== */
(function () {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
})();
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const next = cur === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  document.dispatchEvent(new CustomEvent("themechange"));
}

/* ===== 進度紀錄 ===== */
const Progress = {
  key: "hsmath-progress",
  get() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; } },
  markDone(unit) { const p = this.get(); p[unit] = true; localStorage.setItem(this.key, JSON.stringify(p)); },
  isDone(unit) { return !!this.get()[unit]; }
};

/* ===== CSS 變數取色 ===== */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const MONO = "'JetBrains Mono', ui-monospace, monospace";

/* ===== Canvas 座標系繪圖工具 ===== */
class Plot {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} opt {xmin,xmax,ymin,ymax,heightPx,aspect}
   *   aspect:true → 等比例座標（圓看起來是圓），以「包含指定範圍」為原則向外擴張
   */
  constructor(canvas, opt = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this._base = {
      xmin: opt.xmin ?? -10, xmax: opt.xmax ?? 10,
      ymin: opt.ymin ?? -6, ymax: opt.ymax ?? 6
    };
    this.xmin = this._base.xmin; this.xmax = this._base.xmax;
    this.ymin = this._base.ymin; this.ymax = this._base.ymax;
    this.heightPx = opt.heightPx ?? 420;
    this.aspect = !!opt.aspect;
    this._resize();
    window.addEventListener("resize", () => { this._resize(); this.redraw && this.redraw(); });
    document.addEventListener("themechange", () => this.redraw && this.redraw());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.redraw && this.redraw());
  }
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || this.canvas.parentElement.clientWidth || 800;
    // 小螢幕自動降低高度，維持合理比例
    this.W = w;
    this.H = Math.min(this.heightPx, Math.max(240, Math.round(w * 0.7)));
    this.canvas.width = w * dpr; this.canvas.height = this.H * dpr;
    this.canvas.style.height = this.H + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.aspect) this._fitAspect();
  }
  /** 等比例：以較小的縮放率為準，對稱擴張另一軸的範圍 */
  _fitAspect() {
    const b = this._base;
    const sx = this.W / (b.xmax - b.xmin);
    const sy = this.H / (b.ymax - b.ymin);
    const s = Math.min(sx, sy);
    const xspan = this.W / s, yspan = this.H / s;
    const cx = (b.xmin + b.xmax) / 2, cy = (b.ymin + b.ymax) / 2;
    this.xmin = cx - xspan / 2; this.xmax = cx + xspan / 2;
    this.ymin = cy - yspan / 2; this.ymax = cy + yspan / 2;
  }
  // 座標轉換
  px(x) { return (x - this.xmin) / (this.xmax - this.xmin) * this.W; }
  py(y) { return this.H - (y - this.ymin) / (this.ymax - this.ymin) * this.H; }
  ix(px) { return this.xmin + px / this.W * (this.xmax - this.xmin); }
  iy(py) { return this.ymin + (this.H - py) / this.H * (this.ymax - this.ymin); }

  clear() { this.ctx.clearRect(0, 0, this.W, this.H); }

  /** 取「漂亮」刻度間距（1, 2, 5 × 10^n），目標約 targetN 格 */
  static niceStep(span, targetN = 10) {
    const raw = Math.abs(span) / targetN;
    const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    for (const m of [1, 2, 5, 10]) if (m * pow >= raw) return m * pow;
    return 10 * pow;
  }
  _autoX(target) { return Plot.niceStep(this.xmax - this.xmin, target); }
  _autoY(target) { return Plot.niceStep(this.ymax - this.ymin, target); }

  /** 格線。不給參數 → 依範圍自動；給了也會自動防過密 */
  grid(stepX, stepY) {
    stepX = Math.max(stepX || 0, this._autoX(14));
    stepY = Math.max(stepY || 0, this._autoY(12));
    const c = this.ctx;
    c.lineWidth = 1; c.strokeStyle = cssVar("--grid");
    c.beginPath();
    for (let x = Math.ceil(this.xmin / stepX) * stepX; x <= this.xmax; x += stepX) {
      c.moveTo(this.px(x), 0); c.lineTo(this.px(x), this.H);
    }
    for (let y = Math.ceil(this.ymin / stepY) * stepY; y <= this.ymax; y += stepY) {
      c.moveTo(0, this.py(y)); c.lineTo(this.W, this.py(y));
    }
    c.stroke();
  }

  /** 座標軸與刻度標籤。不給參數 → 自動間距，避免數字擠成一團 */
  axes(stepX, stepY) {
    stepX = Math.max(stepX || 0, this._autoX(7));
    stepY = Math.max(stepY || 0, this._autoY(6));
    const c = this.ctx;
    c.lineWidth = 1.5; c.strokeStyle = cssVar("--axis");
    const y0 = Math.min(Math.max(this.py(0), 0), this.H);
    const x0 = Math.min(Math.max(this.px(0), 0), this.W);
    c.beginPath();
    c.moveTo(0, y0); c.lineTo(this.W, y0);
    c.moveTo(x0, 0); c.lineTo(x0, this.H);
    c.stroke();
    c.fillStyle = cssVar("--axis"); c.font = "11px " + MONO;
    c.textAlign = "center"; c.textBaseline = "top";
    for (let x = Math.ceil(this.xmin / stepX) * stepX; x <= this.xmax; x += stepX) {
      if (Math.abs(x) < stepX / 2) continue;
      c.fillText(this._fmt(x), this.px(x), Math.min(y0 + 4, this.H - 14));
    }
    c.textAlign = "left"; c.textBaseline = "middle";
    for (let y = Math.ceil(this.ymin / stepY) * stepY; y <= this.ymax; y += stepY) {
      if (Math.abs(y) < stepY / 2) continue;
      c.fillText(this._fmt(y), Math.min(x0 + 5, this.W - 44), this.py(y));
    }
  }
  /** 數字友善格式：大數用「萬／億」，避免一長串 0 */
  _fmt(v) {
    const a = Math.abs(v);
    const trim = n => (+n.toFixed(2)).toString();
    if (a >= 1e8) return trim(v / 1e8) + "億";
    if (a >= 1e4) return trim(v / 1e4) + "萬";
    return trim(v);
  }

  /** 畫函數曲線 */
  fn(f, color = null, width = 2.5, dash = null) {
    const c = this.ctx;
    c.lineWidth = width; c.strokeStyle = color || cssVar("--curve1");
    c.setLineDash(dash || []);
    c.beginPath();
    let pen = false;
    const N = this.W;
    for (let i = 0; i <= N; i++) {
      const x = this.ix(i);
      const y = f(x);
      if (!isFinite(y)) { pen = false; continue; }
      const Y = this.py(y);
      if (Y < -2000 || Y > this.H + 2000) { pen = false; continue; }
      if (!pen) { c.moveTo(i, Y); pen = true; } else c.lineTo(i, Y);
    }
    c.stroke();
    c.setLineDash([]);
  }

  /** 參數式曲線 */
  param(fx, fy, t0, t1, color = null, width = 2.5, steps = 600) {
    const c = this.ctx;
    c.lineWidth = width; c.strokeStyle = color || cssVar("--curve1");
    c.beginPath();
    let pen = false;
    for (let i = 0; i <= steps; i++) {
      const t = t0 + (t1 - t0) * i / steps;
      const x = fx(t), y = fy(t);
      if (!isFinite(x) || !isFinite(y)) { pen = false; continue; }
      const X = this.px(x), Y = this.py(y);
      if (!pen) { c.moveTo(X, Y); pen = true; } else c.lineTo(X, Y);
    }
    c.stroke();
  }

  line(x1, y1, x2, y2, color = null, width = 2, dash = null) {
    const c = this.ctx;
    c.lineWidth = width; c.strokeStyle = color || cssVar("--curve2");
    c.setLineDash(dash || []);
    c.beginPath(); c.moveTo(this.px(x1), this.py(y1)); c.lineTo(this.px(x2), this.py(y2)); c.stroke();
    c.setLineDash([]);
  }

  /** 無限直線 ax+by=c */
  infLine(a, b, cc, color = null, width = 2, dash = null) {
    if (Math.abs(b) > 1e-9) {
      this.fnLineSeg(x => (cc - a * x) / b, color, width, dash);
    } else if (Math.abs(a) > 1e-9) {
      this.line(cc / a, this.ymin, cc / a, this.ymax, color, width, dash);
    }
  }
  fnLineSeg(f, color, width, dash) {
    this.line(this.xmin, f(this.xmin), this.xmax, f(this.xmax), color, width, dash);
  }

  point(x, y, color = null, r = 6, label = "", labelDx = 10, labelDy = -10) {
    const c = this.ctx;
    c.fillStyle = color || cssVar("--curve4");
    c.beginPath(); c.arc(this.px(x), this.py(y), r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = cssVar("--bg2"); c.lineWidth = 2; c.stroke();
    if (label) {
      c.fillStyle = cssVar("--text"); c.font = "bold 13px " + MONO;
      c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText(label, this.px(x) + labelDx, this.py(y) + labelDy);
    }
  }

  arrow(x1, y1, x2, y2, color = null, width = 2.5, label = "") {
    const c = this.ctx;
    const col = color || cssVar("--curve1");
    const X1 = this.px(x1), Y1 = this.py(y1), X2 = this.px(x2), Y2 = this.py(y2);
    const ang = Math.atan2(Y2 - Y1, X2 - X1), hl = 11;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = width;
    c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke();
    c.beginPath();
    c.moveTo(X2, Y2);
    c.lineTo(X2 - hl * Math.cos(ang - 0.4), Y2 - hl * Math.sin(ang - 0.4));
    c.lineTo(X2 - hl * Math.cos(ang + 0.4), Y2 - hl * Math.sin(ang + 0.4));
    c.closePath(); c.fill();
    if (label) {
      c.font = "bold 14px " + MONO;
      c.textAlign = "center";
      c.fillText(label, (X1 + X2) / 2 + 12 * Math.cos(ang - Math.PI / 2), (Y1 + Y2) / 2 + 12 * Math.sin(ang - Math.PI / 2));
    }
  }

  text(x, y, str, color = null, font = null, align = "left") {
    const c = this.ctx;
    c.fillStyle = color || cssVar("--text");
    c.font = font || ("13px " + MONO); c.textAlign = align; c.textBaseline = "middle";
    c.fillText(str, this.px(x), this.py(y));
  }

  circle(cx, cy, r, color = null, width = 2.5, fill = null) {
    const c = this.ctx;
    c.beginPath();
    const rx = r / (this.xmax - this.xmin) * this.W;
    const ry = r / (this.ymax - this.ymin) * this.H;
    c.ellipse(this.px(cx), this.py(cy), rx, ry, 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.strokeStyle = color || cssVar("--curve1"); c.lineWidth = width; c.stroke();
  }

  /** 可拖曳點。points: [{get:()=>[x,y], set:(x,y)=>{}}] */
  draggable(points, onChange) {
    let active = null;
    const pick = (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
      for (const p of points) {
        const [x, y] = p.get();
        if (Math.hypot(this.px(x) - mx, this.py(y) - my) < 24) return p;
      }
      return null;
    };
    const move = (ev) => {
      if (!active) return;
      ev.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = this.ix(ev.clientX - rect.left), y = this.iy(ev.clientY - rect.top);
      active.set(x, y);
      onChange && onChange();
    };
    this.canvas.addEventListener("pointerdown", (ev) => {
      active = pick(ev);
      if (active) this.canvas.setPointerCapture(ev.pointerId);
    });
    this.canvas.addEventListener("pointermove", move);
    this.canvas.addEventListener("pointerup", () => active = null);
    this.canvas.addEventListener("pointercancel", () => active = null);
  }
}

/* ===== 滑桿綁定工具 ===== */
function bindSlider(id, onInput, fmt) {
  const el = document.getElementById(id);
  const lab = document.querySelector(`label[for="${id}"] b`);
  const update = () => {
    const v = parseFloat(el.value);
    if (lab) lab.textContent = fmt ? fmt(v) : v;
    onInput(v);
  };
  el.addEventListener("input", update);
  update();
  return el;
}

/* ===== 測驗引擎 ===== */
function renderQuiz(containerId, questions, unitKey) {
  const box = document.getElementById(containerId);
  let correct = 0, answered = 0;
  questions.forEach((item, qi) => {
    const div = document.createElement("div");
    div.className = "quiz-q";
    div.innerHTML = `<div class="qtext">${qi + 1}. ${item.q}</div>`;
    item.opts.forEach((o, oi) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = o;
      b.onclick = () => {
        if (div.classList.contains("answered")) return;
        div.classList.add("answered");
        answered++;
        if (oi === item.ans) { b.classList.add("correct"); correct++; }
        else {
          b.classList.add("wrong");
          div.querySelectorAll(".opt")[item.ans].classList.add("correct");
        }
        if (answered === questions.length) {
          const res = document.createElement("div");
          res.className = "note";
          res.innerHTML = `測驗完成：答對 <b>${correct} / ${questions.length}</b> 題${correct === questions.length ? "，太強了！🎉" : "，再試試互動實驗加深理解！"}`;
          box.appendChild(res);
          if (unitKey && correct >= Math.ceil(questions.length * 0.6)) Progress.markDone(unitKey);
        }
      };
      div.appendChild(b);
    });
    const expl = document.createElement("div");
    expl.className = "expl";
    expl.innerHTML = "💡 " + item.expl;
    div.appendChild(expl);
    box.appendChild(div);
  });
  if (window.renderMathInElement) renderMathInElement(box, katexOpt);
}

const katexOpt = {
  delimiters: [
    { left: "$$", right: "$$", display: true },
    { left: "$", right: "$", display: false }
  ],
  throwOnError: false
};

/* ===== 共用頁首（含首頁按鈕） ===== */
function injectNav(isUnit) {
  const root = isUnit ? "../" : "";
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML = `
    <a class="brand" href="${root}index.html"><span class="logo">∑</span><span class="brand-txt">高中數學視覺實驗室</span></a>
    <div class="actions">
      <a class="btn-icon home-btn" href="${root}index.html" title="回首頁" aria-label="回首頁">🏠<span class="home-txt">首頁</span></a>
      <button class="btn-icon" onclick="toggleTheme()" title="切換深淺色" aria-label="切換深淺色">◐</button>
    </div>`;
  document.body.prepend(nav);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, katexOpt);
  }
});
