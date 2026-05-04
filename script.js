/* =========================
   DOM取得
========================= */
const imageInput = document.getElementById("imageInput");
const shelf = document.getElementById("shelf");
const saveBtn = document.getElementById("saveBtn");

const deleteAllBtn = document.getElementById("deleteAllBtn");
const selectDeleteBtn = document.getElementById("selectDeleteBtn");
const selectedCount = document.getElementById("selectedCount");

const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalMemo = document.getElementById("modalMemo");
const closeModal = document.getElementById("closeModal");

const selectFileBtn = document.getElementById("selectFileBtn");
const fileTypeMenu = document.getElementById("fileTypeMenu");

/* =========================
   メモ帳ID取得
========================= */
const params = new URLSearchParams(location.search);
const memoId = params.get("memoId");

/* =========================
   localStorage 読み込み
========================= */
let allMemos = JSON.parse(localStorage.getItem("memoBooks")) || {};

/* =========================
   メモ帳存在チェック
========================= */
if (!memoId || !allMemos[memoId]) {
  alert("メモ帳が見つかりません");
  location.href = "home.html";
}

/* =========================
   このメモ帳の中身
========================= */
let books = allMemos[memoId].books || [];

/* =========================
   状態
========================= */
let selectMode = false;
let activeIndex = null;

/* =========================
   初期描画
========================= */
window.addEventListener("load", render);

function render() {
  shelf.innerHTML = "";
  books.forEach(book => createBook(book.image, book.memo));
}

/* =========================
   ファイル選択
========================= */
selectFileBtn.addEventListener("click", () => {
  fileTypeMenu.classList.toggle("hidden");
});

fileTypeMenu.addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;

  const type = e.target.dataset.type;
  fileTypeMenu.classList.add("hidden");

  if (type === "memo") {
    books.push({ image: null, memo: "" });
    save();
    render();
  }

  if (type === "photo") {
    imageInput.click();
  }
});

/* =========================
   画像追加
========================= */
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    books.push({ image: reader.result, memo: "" });
    save();
    render();
  };
  reader.readAsDataURL(file);
  imageInput.value = "";
});

/* =========================
   本作成（ドラッグ完全対応）
========================= */
function createBook(imageSrc, memoText) {
  const book = document.createElement("div");
  book.className = "book";
  

  

  /* 画像 */
  if (imageSrc) {
    const img = document.createElement("img");
    img.src = imageSrc;
    img.draggable = false;
    img.addEventListener("click", e => {
      if (selectMode) return;
      e.stopPropagation();
      openModal(book);
    });
    book.appendChild(img);
  }

  /* メモ */
  const memo = document.createElement("textarea");
  memo.value = memoText;
  memo.placeholder = "メモを書く";
  memo.draggable = false;
  memo.addEventListener("input", updateBooksFromDOM);
  book.appendChild(memo);

  /* 選択削除 */
  book.addEventListener("click", () => {
    if (selectMode) {
      book.classList.toggle("selected");
      updateSelectedCount();
    }
  });

  shelf.appendChild(book);
}

/* =========================
   本棚全体のドラッグ制御
========================= */


/* =========================
   モーダル
========================= */
function openModal(book) {
  activeIndex = [...shelf.children].indexOf(book);
  modalImage.src = books[activeIndex].image;
  modalMemo.value = books[activeIndex].memo;
  modal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => {
  books[activeIndex].memo = modalMemo.value;
  save();
  modal.classList.add("hidden");
});

/* =========================
   保存
========================= */
function save() {
  allMemos[memoId].books = books;
  localStorage.setItem("memoBooks", JSON.stringify(allMemos));
}

saveBtn.addEventListener("click", () => {
  save();
  alert("保存しました");
});

/* =========================
   全削除
========================= */
deleteAllBtn.addEventListener("click", () => {
  if (!confirm("すべて削除しますか？")) return;
  books = [];
  save();
  render();
});

/* =========================
   DOM → データ同期
========================= */
function updateBooksFromDOM() {
  books = [...shelf.children].map(book => {
    const img = book.querySelector("img");
    return {
      image: img ? img.src : null,
      memo: book.querySelector("textarea").value
    };
  });
  save();
}

/* =========================
   選択数表示
========================= */
function updateSelectedCount() {
  const count = document.querySelectorAll(".book.selected").length;
  selectedCount.textContent =
    selectMode && count ? `選択中：${count}冊` : "";
}

/* =========================
   選択削除
========================= */
selectDeleteBtn.addEventListener("click", () => {
  if (!selectMode) {
    selectMode = true;
    selectDeleteBtn.classList.add("active");
    selectedCount.textContent = "本を選択してください";
    return;
  }

  const selectedBooks = [...document.querySelectorAll(".book.selected")];
  if (!selectedBooks.length) {
    alert("削除する本を選択してください");
    return;
  }

  if (!confirm(`${selectedBooks.length}冊削除しますか？`)) return;

  books = books.filter((_, i) => !selectedBooks.includes(shelf.children[i]));
  selectMode = false;
  selectDeleteBtn.classList.remove("active");
  save();
  render();
  selectedCount.textContent = "";
});

let draggingBook = null;
let isDragging = false;
let startX = 0;
let startY = 0;


shelf.addEventListener("mousedown", e => {
  const book = e.target.closest(".book");
  if (!book) return;

  draggingBook = book;
  startX = e.clientX;
  startY = e.clientY;
  isDragging = false;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});


function onMouseMove(e) {
  if (!draggingBook) return;

  const dx = Math.abs(e.clientX - startX);
  const dy = Math.abs(e.clientY - startY);

  // ★ 少し動いたら「ドラッグ開始」
  if (!isDragging && (dx > 5 || dy > 5)) {
    isDragging = true;
    draggingBook.classList.add("dragging");
    shelf.classList.add("drag-mode");
  }

  if (!isDragging) return;

  const after = getAfterByMouse(shelf, e.clientX, e.clientY);

  if (!after) {
    shelf.appendChild(draggingBook);
  } else {
    shelf.insertBefore(draggingBook, after);
  }
}



function onMouseUp() {
  if (!draggingBook) return;

  if (isDragging) {
    draggingBook.classList.remove("dragging");
    shelf.classList.remove("drag-mode");

    // ★ DOMの並び替えが確定してから保存する
    setTimeout(() => {
      updateBooksFromDOM();
    }, 0);
  }

  draggingBook = null;
  isDragging = false;

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}



function getAfterByMouse(container, x, y) {
  const items = [...container.querySelectorAll(".book:not(.dragging)")];

  let closest = null;
  let closestDistance = Infinity;

  items.forEach(item => {
    const box = item.getBoundingClientRect();

    // マウスが同じ行にあるか
    const isSameRow = y >= box.top && y <= box.bottom;
    if (!isSameRow) return;

    const distance = Math.abs(x - (box.left + box.width / 2));

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = item;
    }
  });

  return closest;
}


