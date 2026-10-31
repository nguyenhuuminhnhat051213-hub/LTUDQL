const API_URL = 'http://localhost:5000/api';
let allDocuments = []; // Lưu danh sách tài liệu hiện hành
let editingDocId = null; // null: Đang thêm mới, khác null: Đang sửa

const subjectColors = {
  "Toán": "bg-blue-100 text-blue-700",
  "Ngữ Văn": "bg-amber-100 text-amber-700",
  "Văn": "bg-amber-100 text-amber-700",
  "Tiếng Anh": "bg-emerald-100 text-emerald-700",
  "Vật Lý": "bg-purple-100 text-purple-700",
  "Hóa Học": "bg-rose-100 text-rose-700",
  "Sinh Học": "bg-lime-100 text-lime-700",
  "Lịch Sử": "bg-orange-100 text-orange-700",
  "Địa Lý": "bg-cyan-100 text-cyan-700",
  "Tin Học": "bg-indigo-100 text-indigo-700"
};

// 1. Tải danh mục môn học
async function loadSubjects() {
  try {
    const res = await fetch(`${API_URL}/subjects`);
    const subjects = await res.json();
    
    const filterSelect = document.getElementById("filterSubject");
    const formSelect = document.getElementById("subject");

    filterSelect.innerHTML = `<option value="all">Tất cả môn học</option>` + 
      subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    formSelect.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  } catch (error) {
    console.error("Lỗi khi tải môn học:", error);
  }
}

// 2. Cập nhật thẻ thống kê
function updateStats(docs) {
  document.getElementById("statTotal").innerText = docs.length;

  const uniqueSubjects = new Set(docs.map(d => d.subject_id));
  document.getElementById("statSubjects").innerText = uniqueSubjects.size;

  const slides = docs.filter(d => d.type === "Bài giảng Slide");
  document.getElementById("statSlides").innerText = slides.length;
}

// 3. Tải danh sách tài liệu từ server
async function loadDocuments() {
  const search = document.getElementById("searchInput").value.trim();
  const subjectId = document.getElementById("filterSubject").value;
  const filterType = document.getElementById("filterType").value;

  try {
    const query = new URLSearchParams();
    if (search) query.append("search", search);
    if (subjectId !== "all") query.append("subject_id", subjectId);

    const res = await fetch(`${API_URL}/documents?${query.toString()}`);
    allDocuments = await res.json();

    let filtered = allDocuments;
    if (filterType !== "all") {
      filtered = filtered.filter(d => d.type === filterType);
    }

    renderDocs(filtered);
    updateStats(allDocuments);
  } catch (error) {
    console.error("Lỗi khi tải tài liệu:", error);
  }
}

// 4. Render danh sách thẻ tài liệu
function renderDocs(docs) {
  const container = document.getElementById("docGrid");
  const emptyNotice = document.getElementById("emptyNotice");

  if (!docs || docs.length === 0) {
    container.innerHTML = "";
    emptyNotice.classList.remove("hidden");
    return;
  }

  emptyNotice.classList.add("hidden");
  container.innerHTML = docs.map(doc => {
    const badgeColor = subjectColors[doc.subject_name] || "bg-gray-100 text-gray-700";
    return `
      <div class="doc-card bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
        <div>
          <div class="flex justify-between items-start gap-2 mb-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-md ${badgeColor}">${doc.subject_name || "Môn học"}</span>
            <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">${doc.type}</span>
          </div>
          <h3 class="font-bold text-slate-800 text-base mb-1">${doc.title}</h3>
          <p class="text-xs text-slate-500 mb-4">${doc.notes ? doc.notes : "Không có ghi chú thêm."}</p>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          <a href="${doc.link}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở tài liệu
          </a>
          <div class="flex items-center gap-2">
            <button onclick="openEditModal(${doc.id})" class="text-slate-400 hover:text-amber-600 transition text-sm p-1" title="Sửa thông tin">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button onclick="deleteDoc(${doc.id})" class="text-slate-400 hover:text-rose-600 transition text-sm p-1" title="Xóa tài liệu">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// 5. Chuẩn bị Modal cho chế độ Sửa
window.openEditModal = function(id) {
  const doc = allDocuments.find(d => d.id === id);
  if (!doc) return;

  editingDocId = id;
  document.querySelector("#docModal h2").innerText = "Chỉnh sửa tài liệu học tập";
  document.getElementById("title").value = doc.title;
  document.getElementById("subject").value = doc.subject_id;
  document.getElementById("type").value = doc.type;
  document.getElementById("link").value = doc.link;
  document.getElementById("notes").value = doc.notes || "";

  modal.classList.remove("hidden");
};

// 6. Xóa tài liệu
window.deleteDoc = async function(id) {
  if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadDocuments();
      } else {
        alert("Lỗi khi xóa tài liệu!");
      }
    } catch (error) {
      console.error("Lỗi xóa tài liệu:", error);
    }
  }
};

// 7. Modal và Form (Xử lý cả Thêm mới và Cập nhật)
const modal = document.getElementById("docModal");
document.getElementById("openModalBtn").onclick = () => {
  editingDocId = null;
  document.querySelector("#docModal h2").innerText = "Thêm tài liệu học tập";
  document.getElementById("docForm").reset();
  modal.classList.remove("hidden");
};
document.getElementById("closeModalBtn").onclick = () => modal.classList.add("hidden");

document.getElementById("docForm").onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById("title").value.trim(),
    subject_id: parseInt(document.getElementById("subject").value),
    type: document.getElementById("type").value,
    link: document.getElementById("link").value.trim(),
    notes: document.getElementById("notes").value.trim()
  };

  try {
    const url = editingDocId ? `${API_URL}/documents/${editingDocId}` : `${API_URL}/documents`;
    const method = editingDocId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      modal.classList.add("hidden");
      document.getElementById("docForm").reset();
      editingDocId = null;
      loadDocuments();
    } else {
      alert("Lỗi khi lưu dữ liệu!");
    }
  } catch (error) {
    console.error("Lỗi gửi dữ liệu:", error);
  }
};

// 8. Lắng nghe tìm kiếm và bộ lọc
document.getElementById("searchInput").oninput = loadDocuments;
document.getElementById("filterSubject").onchange = loadDocuments;
document.getElementById("filterType").onchange = loadDocuments;

loadSubjects().then(loadDocuments);