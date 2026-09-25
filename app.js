/* Мектеп — расписание генератору (браузер) */
(function () {
  const DAYS = ["Дүйшөмбү", "Шейшемби", "Шаршемби", "Бейшемби", "Жума"];
  const PERIODS = [1, 2, 3, 4, 5, 6];

  const state = {
    teachers: [],
    classes: [],
    loads: [],
    entries: [],
    page: "schedule",
    shiftFilter: 1,
  };

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 8);
  }

  function seedData() {
    state.teachers = [
      { id: "t1", name: "Джолбаева Зейнеп", maxHours: 28, maxDaily: 6 },
      { id: "t2", name: "Абдуллаева Гулжамал", maxHours: 26, maxDaily: 6 },
      { id: "t3", name: "Иманалиева Арина", maxHours: 24, maxDaily: 6 },
      { id: "t4", name: "Мухтарова Барчын", maxHours: 24, maxDaily: 6 },
      { id: "t5", name: "Наскеева Нургуль", maxHours: 22, maxDaily: 6 },
      { id: "t6", name: "Аилчинова Эльмира", maxHours: 22, maxDaily: 6 },
      { id: "t7", name: "Бектурганов Жылдызбек", maxHours: 24, maxDaily: 6 },
      { id: "t8", name: "Орозалиева Гулайым", maxHours: 20, maxDaily: 6 },
      { id: "t9", name: "Адамбекова Раушан", maxHours: 22, maxDaily: 6 },
      { id: "t10", name: "Бактыбай кызы Элзада", maxHours: 20, maxDaily: 6 },
    ];

    const names = ["6-А", "6-Б", "7-А", "7-Б", "8-А", "8-Б", "9-А", "9-Б", "10-А", "10-Б", "11-А", "11-Б"];
    state.classes = names.map((name, i) => ({
      id: "c" + (i + 1),
      name,
      shift: i < 6 ? 1 : 2,
      dailyMax: 6,
    }));

    const subjects = [
      ["Кыргыз тили", 4, ["t1", "t2"]],
      ["Кыргыз адабияты", 3, ["t2", "t1"]],
      ["Математика", 5, ["t7", "t9"]],
      ["Орус тили", 3, ["t3", "t4"]],
      ["Тарых", 2, ["t5", "t6"]],
      ["География", 2, ["t6", "t5"]],
      ["Биология", 2, ["t8", "t9"]],
      ["Физика", 2, ["t9", "t8"]],
      ["Англис тили", 3, ["t4", "t3"]],
      ["Дене тарбия", 2, ["t10", "t7"]],
    ];

    state.loads = [];
    state.classes.forEach((cls, ci) => {
      subjects.forEach(([subject, hours, teachers], si) => {
        state.loads.push({
          id: "l-" + cls.id + "-" + si,
          classId: cls.id,
          subject,
          teacherId: teachers[ci % teachers.length],
          hours,
          maxPerDay: subject === "Математика" ? 2 : 1,
        });
      });
    });
    state.entries = [];
  }

  function teacherById(id) {
    return state.teachers.find((t) => t.id === id);
  }
  function classById(id) {
    return state.classes.find((c) => c.id === id);
  }

  function generate() {
    const entries = [];
    const usedClass = new Set();
    const usedTeacher = new Set();
    const teacherDayCount = {};
    const loadDayCount = {};
    const classDayCount = {};

    const units = [];
    state.loads.forEach((load) => {
      for (let i = 0; i < load.hours; i++) units.push({ ...load, occ: i });
    });
    units.sort((a, b) => b.hours - a.hours);

    function keyC(cid, d, p) { return cid + "|" + d + "|" + p; }
    function keyT(tid, d, p) { return tid + "|" + d + "|" + p; }

    let unplaced = 0;
    units.forEach((unit) => {
      const cls = classById(unit.classId);
      if (!cls) { unplaced++; return; }
      let placed = false;
      const days = [0, 1, 2, 3, 4];
      days.sort((a, b) => (classDayCount[cls.id + "|" + a] || 0) - (classDayCount[cls.id + "|" + b] || 0));
      for (const d of days) {
        if ((loadDayCount[unit.id + "|" + d] || 0) >= (unit.maxPerDay || 1)) continue;
        if ((classDayCount[cls.id + "|" + d] || 0) >= (cls.dailyMax || 6)) continue;
        if ((teacherDayCount[unit.teacherId + "|" + d] || 0) >= 6) continue;
        for (let p = 0; p < 6; p++) {
          if (usedClass.has(keyC(cls.id, d, p))) continue;
          if (usedTeacher.has(keyT(unit.teacherId, d, p))) continue;
          entries.push({
            id: uid("e"),
            day: d,
            period: p,
            shift: cls.shift,
            classId: cls.id,
            loadId: unit.id,
            teacherId: unit.teacherId,
            subject: unit.subject,
          });
          usedClass.add(keyC(cls.id, d, p));
          usedTeacher.add(keyT(unit.teacherId, d, p));
          teacherDayCount[unit.teacherId + "|" + d] = (teacherDayCount[unit.teacherId + "|" + d] || 0) + 1;
          loadDayCount[unit.id + "|" + d] = (loadDayCount[unit.id + "|" + d] || 0) + 1;
          classDayCount[cls.id + "|" + d] = (classDayCount[cls.id + "|" + d] || 0) + 1;
          placed = true;
          break;
        }
        if (placed) break;
      }
      if (!placed) unplaced++;
    });

    state.entries = entries;
    return { placed: entries.length, unplaced };
  }

  function toast(msg, ok) {
    const box = document.getElementById("toastContainer");
    if (!box) return alert(msg);
    const el = document.createElement("div");
    el.className = "toast px-4 py-3 rounded-lg text-sm text-white shadow " + (ok ? "bg-emerald-600" : "bg-rose-600");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function renderSchedule() {
    const classes = state.classes.filter((c) => c.shift === state.shiftFilter);
    const map = {};
    state.entries
      .filter((e) => e.shift === state.shiftFilter)
      .forEach((e) => { map[e.classId + "|" + e.day + "|" + e.period] = e; });

    let html = `
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <h1 class="text-xl font-bold">Расписание</h1>
        <button id="btnGen" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Генерация</button>
        <button id="btnClear" class="px-4 py-2 bg-slate-200 rounded-lg text-sm">Тазалоо</button>
        <select id="shiftSel" class="border rounded-lg px-3 py-2 text-sm">
          <option value="1" ${state.shiftFilter === 1 ? "selected" : ""}>1-смена</option>
          <option value="2" ${state.shiftFilter === 2 ? "selected" : ""}>2-смена</option>
        </select>
        <span class="text-sm text-slate-500">${state.entries.length} сабак коюлду</span>
      </div>
      <div class="overflow-auto bg-white rounded-xl border">
        <table class="min-w-full text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50">
              <th class="border p-2 sticky left-0 bg-slate-50">Күн / сабак</th>
              ${classes.map((c) => `<th class="border p-2 whitespace-nowrap">${c.name}</th>`).join("")}
            </tr>
          </thead>
          <tbody>`;

    DAYS.forEach((dayName, d) => {
      PERIODS.forEach((pn, p) => {
        html += `<tr>`;
        if (p === 0) {
          html += `<td class="border p-2 font-semibold bg-slate-50" rowspan="6">${dayName}</td>`;
        }
        classes.forEach((c) => {
          const e = map[c.id + "|" + d + "|" + p];
          if (e) {
            const t = teacherById(e.teacherId);
            html += `<td class="border p-1 align-top">
              <div class="font-semibold">${e.subject}</div>
              <div class="text-slate-500">${t ? t.name.split(" ")[0] : ""}</div>
              <div class="text-slate-400">${p + 1}-сабак</div>
            </td>`;
          } else {
            html += `<td class="border p-1 bg-slate-50/60 text-slate-300">${p + 1}</td>`;
          }
        });
        html += `</tr>`;
      });
    });

    html += `</tbody></table></div>`;
    return html;
  }

  function renderList(title, rows) {
    return `<h1 class="text-xl font-bold mb-4">${title}</h1>
      <div class="bg-white rounded-xl border overflow-auto">
        <table class="min-w-full text-sm"><tbody>
          ${rows}
        </tbody></table>
      </div>`;
  }

  function renderPage() {
    const root = document.getElementById("pageContent");
    if (!root) return;
    if (state.page === "schedule") root.innerHTML = renderSchedule();
    else if (state.page === "teachers") {
      root.innerHTML = renderList("Мугалимдер", state.teachers.map((t) =>
        `<tr><td class="border px-3 py-2">${t.name}</td><td class="border px-3 py-2">${t.maxHours} с/апта</td></tr>`
      ).join(""));
    } else if (state.page === "classes") {
      root.innerHTML = renderList("Класстар", state.classes.map((c) =>
        `<tr><td class="border px-3 py-2">${c.name}</td><td class="border px-3 py-2">${c.shift}-смена</td></tr>`
      ).join(""));
    } else if (state.page === "workload") {
      root.innerHTML = renderList("Жүктөм", state.loads.slice(0, 80).map((l) => {
        const c = classById(l.classId);
        const t = teacherById(l.teacherId);
        return `<tr><td class="border px-3 py-2">${c ? c.name : ""}</td><td class="border px-3 py-2">${l.subject}</td><td class="border px-3 py-2">${t ? t.name : ""}</td><td class="border px-3 py-2">${l.hours}</td></tr>`;
      }).join(""));
    } else {
      root.innerHTML = `<h1 class="text-xl font-bold mb-2">${state.page}</h1><p class="text-slate-500">Бул бөлүм даярдалууда. Азыр «Расписание»ден генерацияны басыңыз.</p>`;
    }

    const btn = document.getElementById("btnGen");
    if (btn) btn.onclick = () => {
      const r = generate();
      renderPage();
      toast("Коюлду: " + r.placed + (r.unplaced ? ", коюлбай калды: " + r.unplaced : ""), r.unplaced === 0);
    };
    const clr = document.getElementById("btnClear");
    if (clr) clr.onclick = () => { state.entries = []; renderPage(); };
    const sel = document.getElementById("shiftSel");
    if (sel) sel.onchange = (e) => { state.shiftFilter = Number(e.target.value); renderPage(); };
  }

  window.toggleSidebar = function () {
    document.getElementById("sidebar")?.classList.toggle("open");
    document.getElementById("sidebarOverlay")?.classList.toggle("show");
  };
  window.handleGlobalSearch = function () {};

  document.addEventListener("DOMContentLoaded", () => {
    seedData();
    generate();
    document.querySelectorAll(".nav-item").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".nav-item").forEach((x) => x.classList.remove("active", "text-white"));
        a.classList.add("active");
        state.page = a.getAttribute("data-page") === "dashboard" ? "schedule" : a.getAttribute("data-page");
        renderPage();
      });
    });
    renderPage();
  });
})();
