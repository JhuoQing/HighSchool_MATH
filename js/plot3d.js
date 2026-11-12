/* ===== 輕量 3D 繪圖引擎（純 Canvas，無外部函式庫） =====
 * 數學慣用右手座標：z 軸朝上。拖曳旋轉視角、滾輪／雙指縮放。
 * 用法：p.begin(); p.axes(4); p.arrow(...); p.end();   （end 會做深度排序後繪製）
 */
class Plot3D {
  constructor(canvas, opt = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.range = opt.range ?? 5;          // 畫面大約可容納 ±range
    this.yaw = opt.yaw ?? -0.65;          // 繞 z 軸
    this.pitch = opt.pitch ?? 0.42;       // 俯仰
    this.zoom = 1;
    this.heightPx = opt.heightPx ?? 460;
    this.items = [];
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
    this._resize();
    window.addEventListener("resize", () => { this._resize(); this.redraw && this.redraw(); });
    document.addEventListener("themechange", () => this.redraw && this.redraw());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.redraw && this.redraw());
    this._bindOrbit();
  }
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || this.canvas.parentElement.clientWidth || 800;
    this.W = w;
    this.H = Math.min(this.heightPx, Math.max(280, Math.round(w * 0.8)));
    this.canvas.width = w * dpr; this.canvas.height = this.H * dpr;
    this.canvas.style.height = this.H + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  _bindOrbit() {
    const pts = new Map(); let lastDist = 0;
    const cv = this.canvas;
    cv.addEventListener("pointerdown", e => {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing";
    });
    cv.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) {
        this.yaw += (e.clientX - prev[0]) * 0.01;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch + (e.clientY - prev[1]) * 0.01));
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (lastDist) this.zoom = Math.max(0.4, Math.min(3, this.zoom * d / lastDist));
        lastDist = d;
      }
      this.redraw && this.redraw();
    });
    const up = e => { pts.delete(e.pointerId); lastDist = 0; cv.style.cursor = "grab"; };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", e => {
      e.preventDefault();
      this.zoom = Math.max(0.4, Math.min(3, this.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
      this.redraw && this.redraw();
    }, { passive: false });
  }

  /** 3D → 螢幕座標。回傳 {X, Y, d}，d 越大越遠 */
  project(x, y, z) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const x1 = x * cy - y * sy, y1 = x * sy + y * cy;
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const up = z * cp + y1 * sp;       // 螢幕向上（pitch>0 為由上往下俯視）
    const d = y1 * cp - z * sp;        // 深度（遠離觀察者為正）
    const D = this.range * 6;          // 透視距離
    const f = D / (D + d);
    const s = Math.min(this.W, this.H) / (this.range * 1.75) * this.zoom;
    return { X: this.W / 2 + x1 * s * f, Y: this.H / 2 - up * s * f, d };
  }

  begin() { this.items = []; this.ctx.clearRect(0, 0, this.W, this.H); }
  _push(depth, draw) { this.items.push({ depth, draw }); }

  line(a, b, color, width = 2, dash = null) {
    const A = this.project(...a), B = this.project(...b);
    this._push((A.d + B.d) / 2, c => {
      c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash || []);
      c.beginPath(); c.moveTo(A.X, A.Y); c.lineTo(B.X, B.Y); c.stroke(); c.setLineDash([]);
    });
  }
  arrow(a, b, color, width = 3, label = "") {
    const A = this.project(...a), B = this.project(...b);
    this._push((A.d + B.d) / 2 - 0.01, c => {
      const ang = Math.atan2(B.Y - A.Y, B.X - A.X), hl = 12;
      c.strokeStyle = color; c.fillStyle = color; c.lineWidth = width;
      c.beginPath(); c.moveTo(A.X, A.Y); c.lineTo(B.X, B.Y); c.stroke();
      if (Math.hypot(B.X - A.X, B.Y - A.Y) > 4) {
        c.beginPath(); c.moveTo(B.X, B.Y);
        c.lineTo(B.X - hl * Math.cos(ang - 0.4), B.Y - hl * Math.sin(ang - 0.4));
        c.lineTo(B.X - hl * Math.cos(ang + 0.4), B.Y - hl * Math.sin(ang + 0.4));
        c.closePath(); c.fill();
      }
      if (label) {
        c.font = "bold 14px 'JetBrains Mono', ui-monospace, monospace";
        c.textAlign = "left"; c.textBaseline = "middle";
        c.fillText(label, B.X + 8, B.Y - 8);
      }
    });
  }
  point(p, color, r = 5, label = "") {
    const P = this.project(...p);
    this._push(P.d - 0.02, c => {
      c.fillStyle = color; c.beginPath(); c.arc(P.X, P.Y, r, 0, Math.PI * 2); c.fill();
      if (label) {
        c.fillStyle = cssVar("--text"); c.font = "bold 13px 'JetBrains Mono', ui-monospace, monospace";
        c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(label, P.X + 9, P.Y - 9);
      }
    });
  }
  text(p, str, color) {
    const P = this.project(...p);
    this._push(P.d - 0.02, c => {
      c.fillStyle = color || cssVar("--text"); c.font = "bold 13px 'JetBrains Mono', ui-monospace, monospace";
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(str, P.X, P.Y);
    });
  }
  /** 半透明多邊形（平面、平行四邊形等） */
  poly(pts, fill, stroke = null, alpha = 0.28) {
    if (pts.length < 3) return;
    const P = pts.map(p => this.project(...p));
    const depth = P.reduce((s, q) => s + q.d, 0) / P.length;
    this._push(depth + 0.05, c => {
      c.beginPath(); P.forEach((q, i) => i ? c.lineTo(q.X, q.Y) : c.moveTo(q.X, q.Y)); c.closePath();
      c.globalAlpha = alpha; c.fillStyle = fill; c.fill(); c.globalAlpha = 1;
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
    });
  }

  /** 座標軸 + 地板格線 */
  axes(L = 4, grid = true) {
    const ax = cssVar("--axis"), g = cssVar("--grid");
    if (grid) {
      for (let i = -L; i <= L; i++) {
        this.line([i, -L, 0], [i, L, 0], g, 1);
        this.line([-L, i, 0], [L, i, 0], g, 1);
      }
    }
    this.arrow([-L, 0, 0], [L + 0.6, 0, 0], ax, 1.5, "x");
    this.arrow([0, -L, 0], [0, L + 0.6, 0], ax, 1.5, "y");
    this.arrow([0, 0, -L * 0.6], [0, 0, L + 0.6], ax, 1.5, "z");
  }

  end() {
    this.items.sort((a, b) => b.depth - a.depth);   // 遠的先畫
    for (const it of this.items) it.draw(this.ctx);
  }

  /** 平面 ax+by+cz=d 與立方體 [-R,R]³ 的截面多邊形（已依序排列） */
  static planePoly(a, b, c, d, R) {
    const n = [a, b, c], pts = [];
    const corners = [];
    for (const x of [-R, R]) for (const y of [-R, R]) for (const z of [-R, R]) corners.push([x, y, z]);
    const f = p => a * p[0] + b * p[1] + c * p[2] - d;
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
      const P = corners[i], Q = corners[j];
      const diff = (P[0] !== Q[0]) + (P[1] !== Q[1]) + (P[2] !== Q[2]);
      if (diff !== 1) continue;                       // 只取 12 條稜
      const fp = f(P), fq = f(Q);
      if (fp === fq) continue;
      const t = fp / (fp - fq);
      if (t < 0 || t > 1) continue;
      pts.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1]), P[2] + t * (Q[2] - P[2])]);
    }
    if (pts.length < 3) return [];
    // 以重心為中心、在平面內的角度排序
    const cen = [0, 1, 2].map(k => pts.reduce((s, p) => s + p[k], 0) / pts.length);
    const len = Math.hypot(...n);
    const nn = n.map(v => v / len);
    let u = Math.abs(nn[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const dot = u[0] * nn[0] + u[1] * nn[1] + u[2] * nn[2];
    u = u.map((v, k) => v - dot * nn[k]);
    const ul = Math.hypot(...u); u = u.map(v => v / ul);
    const w = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]];
    const ang = p => {
      const r = [p[0] - cen[0], p[1] - cen[1], p[2] - cen[2]];
      return Math.atan2(r[0] * w[0] + r[1] * w[1] + r[2] * w[2], r[0] * u[0] + r[1] * u[1] + r[2] * u[2]);
    };
    // 去除重複頂點
    const uniq = [];
    for (const p of pts) if (!uniq.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-6)) uniq.push(p);
    return uniq.sort((p, q) => ang(p) - ang(q));
  }
}
