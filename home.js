const list = document.getElementById("notebookList");

/* =========================
   メモ帳データ取得
========================= */
let allMemos = JSON.parse(localStorage.getItem("memoBooks")) || {};
let memoOrder = JSON.parse(localStorage.getItem("memoOrder")) || [];

/* =========================
   新規メモ帳カード
========================= */
const newCard = document.createElement("div");
newCard.className = "page-card new-card";
newCard.innerHTML = `
  <h2>＋ 新規メモ帳</h2>
  <p>メモ帳を作成</p>
`;
list.appendChild(newCard);

newCard.addEventListener("click", () => {
  const title = prompt("メモ帳の名前を入力してください");
  if (!title) return;

  const id = Date.now().toString();

  allMemos[id] = {
    title,
    books: []
  };

  memoOrder.push(id);
  save();
  location.reload();
});

/* =========================
   並び順がなければ初期生成
========================= */
if (memoOrder.length === 0) {
  memoOrder = Object.keys(allMemos);
  save();
}

/* =========================
   メモ帳カード表示
========================= */
memoOrder.forEach(id => {
  const memo = allMemos[id];
  if (!memo) return;

  const card = document.createElement("div");
  card.className = "page-card notebook";
  card.dataset.id = id;
  card.draggable = true;

  card.innerHTML = `
    <h2>${memo.title}</h2>
    <p>メモ数：${memo.books.length}</p>
    <div class="card-buttons">
      <button class="rename-btn">名前変更</button>
      <button class="delete-btn">削除</button>
    </div>
  `;

  /* ===== クリックとドラッグの分離 ===== */
  let isDragging = false;

  card.addEventListener("click", () => {
    if (isDragging) return;
    location.href = `index.html?memoId=${id}`;
  });

  card.addEventListener("dragstart", e => {
    isDragging = true;
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", "");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    saveOrder();
    setTimeout(() => {
      isDragging = false;
    }, 0);
  });

  /* 名前変更 */
  card.querySelector(".rename-btn").addEventListener("click", e => {
    e.stopPropagation();
    renameNotebook(id);
  });

  /* 削除 */
  card.querySelector(".delete-btn").addEventListener("click", e => {
    e.stopPropagation();
    deleteNotebook(id);
  });

  list.appendChild(card);
});

/* =========================
   ドラッグ並び替え（DOM順のみ変更）
========================= */
list.addEventListener("dragover", e => {
  e.preventDefault();

  const dragging = document.querySelector(".dragging");
  if (!dragging) return;

  const after = getDragAfterElement(e.clientY);
  after
    ? list.insertBefore(dragging, after)
    : list.appendChild(dragging);
});

function getDragAfterElement(y) {
  const cards = [...list.querySelectorAll(".notebook:not(.dragging)")];

  return cards.reduce(
    (closest, card) => {
      const box = card.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: card };
      }
      return closest;
    },
    { offset: -Infinity }
  ).element;
}

/* =========================
   並び順保存
========================= */
function saveOrder() {
  memoOrder = [...list.querySelectorAll(".notebook")]
    .map(card => card.dataset.id);
  save();
}

/* =========================
   名前変更
========================= */
function renameNotebook(id) {
  const newTitle = prompt(
    "新しいメモ帳名を入力してください",
    allMemos[id].title
  );
  if (!newTitle) return;

  allMemos[id].title = newTitle;
  save();
  location.reload();
}

/* =========================
   削除
========================= */
function deleteNotebook(id) {
  if (!confirm(`「${allMemos[id].title}」を削除しますか？`)) return;

  delete allMemos[id];
  memoOrder = memoOrder.filter(mid => mid !== id);

  save();
  location.reload();
}

/* =========================
   保存
========================= */
function save() {
  localStorage.setItem("memoBooks", JSON.stringify(allMemos));
  localStorage.setItem("memoOrder", JSON.stringify(memoOrder));
}
